import { mkdir, writeFile, readFile, readdir, rename, symlink, access, rm } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
export class Storage {
    dataDir;
    blobDir;
    useSymlinks = true;
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.blobDir = join(dataDir, ".blobs");
    }
    async init() {
        await mkdir(this.blobDir, { recursive: true });
        // Test symlink support (Windows may not support it without elevated privileges)
        try {
            const testTarget = join(this.blobDir, ".symlink-test-target");
            const testLink = join(this.blobDir, ".symlink-test-link");
            await writeFile(testTarget, "test");
            try {
                await rm(testLink);
            }
            catch { }
            await symlink(testTarget, testLink);
            await rm(testLink);
            await rm(testTarget);
            this.useSymlinks = true;
        }
        catch {
            this.useSymlinks = false;
        }
    }
    // --- Blob Store ---
    blobPath(hash) {
        const hex = hash.replace("sha256:", "");
        return join(this.blobDir, hex.slice(0, 2), hex);
    }
    async hasBlob(hash) {
        try {
            await access(this.blobPath(hash));
            return true;
        }
        catch {
            return false;
        }
    }
    async writeBlob(hash, content) {
        const p = this.blobPath(hash);
        await mkdir(dirname(p), { recursive: true });
        if (await this.hasBlob(hash))
            return;
        await writeFile(p, content);
    }
    async readBlob(hash) {
        try {
            return await readFile(this.blobPath(hash));
        }
        catch {
            return null;
        }
    }
    // --- Skill Metadata ---
    skillDir(ns, name) {
        return join(this.dataDir, ns, name);
    }
    async writeSkillMeta(ns, name, meta) {
        const dir = this.skillDir(ns, name);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "skill.json"), JSON.stringify(meta, null, 2));
    }
    async readSkillMeta(ns, name) {
        try {
            const data = await readFile(join(this.skillDir(ns, name), "skill.json"), "utf-8");
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    // --- Versions ---
    versionDir(ns, name, version) {
        return join(this.skillDir(ns, name), "versions", version);
    }
    async saveVersion(ns, name, manifest) {
        const finalDir = this.versionDir(ns, name, manifest.version);
        const tmpDir = finalDir + ".tmp-" + Date.now();
        await mkdir(join(tmpDir, "files"), { recursive: true });
        await writeFile(join(tmpDir, "manifest.json"), JSON.stringify(manifest, null, 2));
        for (const file of manifest.files) {
            const filePath = join(tmpDir, "files", file.path);
            await mkdir(dirname(filePath), { recursive: true });
            const blobP = this.blobPath(file.hash);
            if (this.useSymlinks) {
                const rel = relative(dirname(filePath), blobP);
                await symlink(rel, filePath);
            }
            else {
                const content = await readFile(blobP);
                await writeFile(filePath, content);
            }
        }
        await rename(tmpDir, finalDir);
    }
    async readManifest(ns, name, version) {
        try {
            const data = await readFile(join(this.versionDir(ns, name, version), "manifest.json"), "utf-8");
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async readVersionFile(ns, name, version, filePath) {
        try {
            return await readFile(join(this.versionDir(ns, name, version), "files", filePath));
        }
        catch {
            return null;
        }
    }
    async listVersions(ns, name) {
        const versionsDir = join(this.skillDir(ns, name), "versions");
        try {
            const entries = await readdir(versionsDir);
            const manifests = [];
            for (const entry of entries) {
                if (entry.startsWith("."))
                    continue;
                const m = await this.readManifest(ns, name, entry);
                if (m)
                    manifests.push(m);
            }
            manifests.sort((a, b) => compareSemver(b.version, a.version));
            return manifests;
        }
        catch {
            return [];
        }
    }
    async latestVersion(ns, name) {
        const versions = await this.listVersions(ns, name);
        const nonYanked = versions.filter((v) => !v.yanked);
        return nonYanked.length > 0 ? nonYanked[0].version : null;
    }
    async versionExists(ns, name, version) {
        try {
            await access(join(this.versionDir(ns, name, version), "manifest.json"));
            return true;
        }
        catch {
            return false;
        }
    }
    // --- List All Skills ---
    async listAllSkills() {
        const skills = [];
        try {
            const nsEntries = await readdir(this.dataDir);
            for (const ns of nsEntries) {
                if (!ns.startsWith("@"))
                    continue;
                const nsPath = join(this.dataDir, ns);
                const skillEntries = await readdir(nsPath);
                for (const skillName of skillEntries) {
                    const meta = await this.readSkillMeta(ns, skillName);
                    if (meta)
                        skills.push(meta);
                }
            }
        }
        catch {
            // empty data dir
        }
        return skills;
    }
    // --- Scan Reports ---
    async writeScanReport(ns, name, version, report) {
        const dir = this.versionDir(ns, name, version);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "scan_report.json"), JSON.stringify(report, null, 2));
    }
    async readScanReport(ns, name, version) {
        try {
            const data = await readFile(join(this.versionDir(ns, name, version), "scan_report.json"), "utf-8");
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    // --- Verification ---
    async writeVerification(ns, name, version, result) {
        const dir = this.versionDir(ns, name, version);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "verification.json"), JSON.stringify(result, null, 2));
    }
    async readVerification(ns, name, version) {
        try {
            const data = await readFile(join(this.versionDir(ns, name, version), "verification.json"), "utf-8");
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    // --- Yank ---
    async yankVersion(ns, name, version) {
        const manifest = await this.readManifest(ns, name, version);
        if (!manifest)
            return false;
        manifest.yanked = true;
        await writeFile(join(this.versionDir(ns, name, version), "manifest.json"), JSON.stringify(manifest, null, 2));
        return true;
    }
}
function compareSemver(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i])
            return pa[i] - pb[i];
    }
    return 0;
}
//# sourceMappingURL=storage.js.map