import { Hono } from "hono";
import { createHash } from "node:crypto";
import { ok, apiError } from "../lib/response.js";
import { isValidSemver, validateManifest } from "../lib/validation.js";
/**
 * Parse @ns/name from a skill API path.
 * e.g. /v1/skills/@alice/test-skill/versions/1.0.0/yank
 *      → { ns: "@alice", name: "test-skill", rest: "versions/1.0.0/yank" }
 *
 * Hono has a bug where @:ns/:name patterns only capture ns but leave name undefined
 * when the named params follow a literal `@` character.  We work around this by
 * parsing the path ourselves.
 */
function parseSkillPath(path) {
    const m = path.match(/^\/v1\/skills\/(@[^/]+)\/([^/?]+)(\/(.*))?/);
    if (!m)
        return null;
    return { ns: m[1], name: m[2], rest: m[4] ?? "" };
}
export function skillRoutes(storage) {
    const app = new Hono();
    // Negotiate — must be registered before the plain save route
    app.post("/v1/skills/@:ns/:name/negotiate", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const body = await c.req.json();
        const manifest = body.file_manifest || [];
        const neededFiles = [];
        const existingBlobs = [];
        for (const file of manifest) {
            if (await storage.hasBlob(file.hash)) {
                existingBlobs.push(file.hash);
            }
            else {
                neededFiles.push(file.path);
            }
        }
        return ok(c, { needed_files: neededFiles, existing_blobs: existingBlobs });
    });
    // Save
    app.post("/v1/skills/@:ns/:name", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const formData = await c.req.formData();
        // Parse metadata — formData.get() may return string or File/Blob depending on runtime
        const metadataRaw = formData.get("metadata");
        if (!metadataRaw) {
            return apiError(c, 400, "invalid_request", "Missing metadata field");
        }
        const metadataStr = typeof metadataRaw === "string"
            ? metadataRaw
            : await metadataRaw.text();
        const metadata = JSON.parse(metadataStr);
        const { version, description, category, tags, changelog, file_manifest } = metadata;
        if (!isValidSemver(version)) {
            return apiError(c, 400, "invalid_version", `Invalid semver: ${version}`);
        }
        const manifestErr = validateManifest(file_manifest);
        if (manifestErr) {
            return apiError(c, 400, "invalid_request", manifestErr);
        }
        if (await storage.versionExists(ns, name, version)) {
            return apiError(c, 409, "conflict", `Version ${version} already exists`);
        }
        // Build a lookup from path -> declared hash for verification
        const declaredHashes = new Map();
        for (const f of file_manifest) {
            declaredHashes.set(f.path, f.hash);
        }
        // Process uploaded files — verify hash matches declared manifest
        for (let i = 0;; i++) {
            const file = formData.get(`file_${i}`);
            if (!file || !(file instanceof File))
                break;
            const content = Buffer.from(await file.arrayBuffer());
            const computedHash = "sha256:" + createHash("sha256").update(content).digest("hex");
            const filePath = file.name; // CLI sets filename to the relative path
            const declaredHash = declaredHashes.get(filePath);
            if (declaredHash && computedHash !== declaredHash) {
                return apiError(c, 400, "invalid_request", `Hash mismatch for ${filePath}: expected ${declaredHash}, got ${computedHash}`);
            }
            await storage.writeBlob(declaredHash || computedHash, content);
        }
        // Compute tree hash from manifest
        const treeHash = computeTreeHash(file_manifest);
        // Build version manifest
        const versionManifest = {
            version,
            tree_hash: treeHash,
            saved_at: new Date().toISOString(),
            changelog: changelog || "",
            yanked: false,
            files: file_manifest,
        };
        await storage.saveVersion(ns, name, versionManifest);
        // Save scan report if embedded — handle string or File/Blob
        const scanReportRaw = formData.get("scan_report");
        if (scanReportRaw) {
            const scanStr = typeof scanReportRaw === "string"
                ? scanReportRaw
                : await scanReportRaw.text();
            await storage.writeScanReport(ns, name, version, JSON.parse(scanStr));
        }
        // Update or create skill metadata
        const existing = await storage.readSkillMeta(ns, name);
        const now = new Date().toISOString();
        await storage.writeSkillMeta(ns, name, {
            namespace: ns,
            name,
            description: description || existing?.description || "",
            category: category || existing?.category || "",
            tags: tags || existing?.tags || [],
            created_at: existing?.created_at || now,
            updated_at: now,
        });
        return ok(c, {
            namespace: ns,
            name,
            version,
            tree_hash: treeHash,
            latest_version: version,
        });
    });
    // Get metadata
    app.get("/v1/skills/@:ns/:name", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const meta = await storage.readSkillMeta(ns, name);
        if (!meta)
            return apiError(c, 404, "not_found", "Skill not found");
        const latestVersion = await storage.latestVersion(ns, name);
        const versions = await storage.listVersions(ns, name);
        return ok(c, {
            ...meta,
            // Normalize tags: local storage uses array, but UI code expects comma-separated string
            tags: Array.isArray(meta.tags) ? meta.tags.join(",") : (meta.tags || ""),
            latest_version: latestVersion,
            version_count: versions.length,
            visibility: "private",
        });
    });
    // List versions
    app.get("/v1/skills/@:ns/:name/versions", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        const all = await storage.listVersions(ns, name);
        const start = (page - 1) * limit;
        const slice = all.slice(start, start + limit);
        return ok(c, slice, {
            pagination: { has_more: start + limit < all.length },
        });
    });
    // Download
    app.get("/v1/skills/@:ns/:name/download/:version", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name, rest } = p;
        // rest = "download/1.0.0"
        const versionMatch = rest.match(/^download\/([^/]+)$/);
        const version = versionMatch ? versionMatch[1] : c.req.param("version");
        const manifest = await storage.readManifest(ns, name, version);
        if (!manifest)
            return apiError(c, 404, "not_found", "Version not found");
        return ok(c, {
            format: "files",
            namespace: ns,
            name,
            version: manifest.version,
            tree_hash: manifest.tree_hash,
            files: manifest.files,
        });
    });
    // List all skills
    app.get("/v1/skills", async (c) => {
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        const all = await storage.listAllSkills();
        const start = (page - 1) * limit;
        const slice = all.slice(start, start + limit);
        const enriched = await Promise.all(slice.map(async (s) => ({
            ...s,
            latest_version: await storage.latestVersion(s.namespace, s.name),
        })));
        return ok(c, enriched, {
            pagination: { has_more: start + limit < all.length },
        });
    });
    // Search
    app.get("/v1/skills/search", async (c) => {
        const q = (c.req.query("q") || "").toLowerCase();
        const category = c.req.query("category");
        const tagsParam = c.req.query("tags");
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        let all = await storage.listAllSkills();
        if (q) {
            all = all.filter((s) => s.namespace.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some((t) => t.toLowerCase().includes(q)));
        }
        if (category) {
            all = all.filter((s) => s.category === category);
        }
        if (tagsParam) {
            const filterTags = tagsParam.split(",");
            all = all.filter((s) => filterTags.some((t) => s.tags.includes(t)));
        }
        const start = (page - 1) * limit;
        const slice = all.slice(start, start + limit);
        const enriched = await Promise.all(slice.map(async (s) => ({
            ...s,
            latest_version: await storage.latestVersion(s.namespace, s.name),
        })));
        return ok(c, enriched, {
            pagination: { has_more: start + limit < all.length },
        });
    });
    // Yank
    app.post("/v1/skills/@:ns/:name/versions/:version/yank", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name, rest } = p;
        // rest = "versions/1.0.0/yank"
        const versionMatch = rest.match(/^versions\/([^/]+)\/yank$/);
        const version = versionMatch ? versionMatch[1] : c.req.param("version");
        const yanked = await storage.yankVersion(ns, name, version);
        if (!yanked)
            return apiError(c, 404, "not_found", "Version not found");
        return ok(c, { namespace: ns, name, version, yanked: true });
    });
    // Get specific version details (used by skill detail page for Files/Security/BOM tabs)
    app.get("/v1/skills/@:ns/:name/versions/:version", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name, rest } = p;
        // rest = "versions/1.0.0"
        const versionMatch = rest.match(/^versions\/([^/]+)$/);
        const version = versionMatch ? versionMatch[1] : c.req.param("version");
        const manifest = await storage.readManifest(ns, name, version);
        if (!manifest)
            return apiError(c, 404, "not_found", "Version not found");
        const scanReport = await storage.readScanReport(ns, name, version);
        // Normalize file fields: local storage uses {path,hash,size}
        // but the UI code expects {file_path,file_hash,file_size_bytes}
        const normalizedFiles = (manifest.files || []).map(f => ({
            file_path: f.path,
            file_hash: f.hash,
            file_size_bytes: f.size,
        }));
        return ok(c, {
            ...manifest,
            files: normalizedFiles,
            scan_reports: scanReport ? [{ report_type: "publisher", ...scanReport }] : [],
            verifications: [],
        });
    });
    // README — serve SKILL.md (or first .md file) as plain text
    app.get("/v1/skills/@:ns/:name/readme", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const latestVer = await storage.latestVersion(ns, name);
        if (!latestVer)
            return apiError(c, 404, "not_found", "No versions found");
        const manifest = await storage.readManifest(ns, name, latestVer);
        if (!manifest)
            return apiError(c, 404, "not_found", "Manifest not found");
        // Try SKILL.md, README.md, then first .md file
        const mdFiles = manifest.files
            .map(f => f.path)
            .filter(p => p.toLowerCase().endsWith(".md"));
        const preferred = ["SKILL.md", "README.md", "skill.md", "readme.md"];
        const target = preferred.find(n => mdFiles.includes(n)) || mdFiles[0];
        if (!target)
            return apiError(c, 404, "not_found", "No README found");
        const content = await storage.readVersionFile(ns, name, latestVer, target);
        if (!content)
            return apiError(c, 404, "not_found", "README not found");
        c.header("Content-Type", "text/plain; charset=utf-8");
        return c.body(content);
    });
    // Stubs for endpoints used by skill detail page (return empty data)
    app.get("/v1/skills/@:ns/:name/related", async (c) => ok(c, [], { pagination: { has_more: false } }));
    app.get("/v1/skills/@:ns/:name/eval", async (c) => ok(c, null));
    app.get("/v1/skills/@:ns/:name/arenas", async (c) => ok(c, [], { pagination: { has_more: false } }));
    app.get("/v1/skills/@:ns/:name/children", async (c) => ok(c, [], { pagination: { has_more: false } }));
    // Delete skill
    app.delete("/v1/skills/@:ns/:name", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name } = p;
        const deleted = await storage.deleteSkill(ns, name);
        if (!deleted)
            return apiError(c, 404, "not_found", "Skill not found");
        return ok(c, { deleted: true });
    });
    return app;
}
function computeTreeHash(files) {
    const sorted = [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    // Strip "sha256:" prefix from hash values to match CLI's compute_tree_hash_v2
    const data = sorted.map((f) => {
        const hexHash = f.hash.startsWith("sha256:") ? f.hash.slice(7) : f.hash;
        return `${f.path}\0${hexHash}\n`;
    }).join("");
    return "sha256tree:" + createHash("sha256").update(data).digest("hex");
}
//# sourceMappingURL=skills.js.map