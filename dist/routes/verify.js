import { Hono } from "hono";
import { ok, apiError } from "../lib/response.js";
/**
 * Parse @ns/name/rest from a skill API path.
 * Workaround for Hono bug where @:ns/:name patterns don't correctly capture all params.
 */
function parseSkillPath(path) {
    const m = path.match(/^\/v1\/skills\/(@[^/]+)\/([^/?]+)(\/(.*))?/);
    if (!m)
        return null;
    return { ns: m[1], name: m[2], rest: m[4] ?? "" };
}
export function verifyRoutes(storage) {
    const app = new Hono();
    app.post("/v1/skills/@:ns/:name/versions/:version/verify", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name, rest } = p;
        // rest = "versions/1.0.0/verify"
        const versionMatch = rest.match(/^versions\/([^/]+)\/verify$/);
        const version = versionMatch ? versionMatch[1] : c.req.param("version");
        const manifest = await storage.readManifest(ns, name, version);
        if (!manifest)
            return apiError(c, 404, "not_found", "Version not found");
        const authorReport = await storage.readScanReport(ns, name, version);
        // CLI sends { scan_report: { tree_hash, findings, ... } }
        const body = await c.req.json();
        const consumerReport = body.scan_report || body;
        // Compare tree hashes
        const authorTreeHash = manifest.tree_hash;
        const consumerTreeHash = consumerReport.tree_hash || "";
        let verdict;
        if (authorTreeHash !== consumerTreeHash) {
            verdict = "divergent";
        }
        else if (consumerReport.findings?.some((f) => f.severity === "critical") &&
            authorReport &&
            !authorReport.findings?.some((f) => f.severity === "critical")) {
            verdict = "critical";
        }
        else {
            verdict = "verified";
        }
        const result = {
            verdict,
            author_tree_hash: authorTreeHash,
            consumer_tree_hash: consumerTreeHash,
            verified_at: new Date().toISOString(),
            verified_by: "consumer",
        };
        await storage.writeVerification(ns, name, version, result);
        return ok(c, result);
    });
    app.get("/v1/skills/@:ns/:name/versions/:version/verify", async (c) => {
        const p = parseSkillPath(c.req.path);
        if (!p)
            return apiError(c, 400, "invalid_request", "Invalid skill path");
        const { ns, name, rest } = p;
        const versionMatch = rest.match(/^versions\/([^/]+)\/verify$/);
        const version = versionMatch ? versionMatch[1] : c.req.param("version");
        const result = await storage.readVerification(ns, name, version);
        if (!result)
            return apiError(c, 404, "not_found", "No verification found");
        return ok(c, result);
    });
    return app;
}
//# sourceMappingURL=verify.js.map