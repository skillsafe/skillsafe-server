import {
  mkdir,
  writeFile,
  readFile,
  readdir,
  rename,
  symlink,
  access,
  rm,
} from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import type { SkillMeta, VersionManifest, VerificationResult } from "./lib/types.js";

export class Storage {
  private dataDir: string;
  private blobDir: string;
  private useSymlinks: boolean = true;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.blobDir = join(dataDir, "blobs");
  }

  async init(): Promise<void> {
    await mkdir(this.blobDir, { recursive: true });
    // Test symlink support (Windows may not support it without elevated privileges)
    try {
      const testTarget = join(this.blobDir, ".symlink-test-target");
      const testLink = join(this.blobDir, ".symlink-test-link");
      await writeFile(testTarget, "test");
      try {
        await rm(testLink);
      } catch {}
      await symlink(testTarget, testLink);
      await rm(testLink);
      await rm(testTarget);
      this.useSymlinks = true;
    } catch {
      this.useSymlinks = false;
    }
  }

  // --- Blob Store ---

  private blobPath(hash: string): string {
    const hex = hash.replace("sha256:", "");
    return join(this.blobDir, hex.slice(0, 2), hex);
  }

  async hasBlob(hash: string): Promise<boolean> {
    try {
      await access(this.blobPath(hash));
      return true;
    } catch {
      return false;
    }
  }

  async writeBlob(hash: string, content: Buffer): Promise<void> {
    const p = this.blobPath(hash);
    await mkdir(dirname(p), { recursive: true });
    if (await this.hasBlob(hash)) return;
    await writeFile(p, content);
  }

  async readBlob(hash: string): Promise<Buffer | null> {
    try {
      return await readFile(this.blobPath(hash));
    } catch {
      return null;
    }
  }

  // --- Skill Metadata ---

  private skillDir(ns: string, name: string): string {
    const cleanNs = ns.startsWith("@") ? ns.slice(1) : ns;
    return join(this.dataDir, "skills", cleanNs, name);
  }

  async writeSkillMeta(ns: string, name: string, meta: SkillMeta): Promise<void> {
    const dir = this.skillDir(ns, name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "skill.json"), JSON.stringify(meta, null, 2));
  }

  async readSkillMeta(ns: string, name: string): Promise<SkillMeta | null> {
    try {
      const data = await readFile(
        join(this.skillDir(ns, name), "skill.json"),
        "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // --- Versions ---

  private versionDir(ns: string, name: string, version: string): string {
    return join(this.skillDir(ns, name), "versions", version);
  }

  async saveVersion(
    ns: string,
    name: string,
    manifest: VersionManifest
  ): Promise<void> {
    const finalDir = this.versionDir(ns, name, manifest.version);
    const tmpDir = finalDir + ".tmp-" + Date.now();
    await mkdir(join(tmpDir, "files"), { recursive: true });
    await writeFile(
      join(tmpDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    for (const file of manifest.files) {
      const filePath = join(tmpDir, "files", file.path);
      await mkdir(dirname(filePath), { recursive: true });
      const blobP = this.blobPath(file.hash);
      if (this.useSymlinks) {
        const rel = relative(dirname(filePath), blobP);
        await symlink(rel, filePath);
      } else {
        const content = await readFile(blobP);
        await writeFile(filePath, content);
      }
    }
    await rename(tmpDir, finalDir);
  }

  async readManifest(
    ns: string,
    name: string,
    version: string
  ): Promise<VersionManifest | null> {
    try {
      const data = await readFile(
        join(this.versionDir(ns, name, version), "manifest.json"),
        "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async readVersionFile(
    ns: string,
    name: string,
    version: string,
    filePath: string
  ): Promise<Buffer | null> {
    try {
      return await readFile(
        join(this.versionDir(ns, name, version), "files", filePath)
      );
    } catch {
      return null;
    }
  }

  async listVersions(ns: string, name: string): Promise<VersionManifest[]> {
    const versionsDir = join(this.skillDir(ns, name), "versions");
    try {
      const entries = await readdir(versionsDir);
      const manifests: VersionManifest[] = [];
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const m = await this.readManifest(ns, name, entry);
        if (m) manifests.push(m);
      }
      manifests.sort((a, b) => compareSemver(b.version, a.version));
      return manifests;
    } catch {
      return [];
    }
  }

  async latestVersion(ns: string, name: string): Promise<string | null> {
    const versions = await this.listVersions(ns, name);
    const nonYanked = versions.filter((v) => !v.yanked);
    return nonYanked.length > 0 ? nonYanked[0].version : null;
  }

  async versionExists(
    ns: string,
    name: string,
    version: string
  ): Promise<boolean> {
    try {
      await access(
        join(this.versionDir(ns, name, version), "manifest.json")
      );
      return true;
    } catch {
      return false;
    }
  }

  // --- List All Skills ---

  async listAllSkills(): Promise<SkillMeta[]> {
    const skills: SkillMeta[] = [];
    try {
      const skillsBase = join(this.dataDir, "skills");
      const nsEntries = await readdir(skillsBase);
      for (const ns of nsEntries) {
        if (ns.startsWith(".")) continue;
        const nsPath = join(skillsBase, ns);
        const skillEntries = await readdir(nsPath);
        for (const skillName of skillEntries) {
          const meta = await this.readSkillMeta("@" + ns, skillName);
          if (meta) skills.push(meta);
        }
      }
    } catch {
      // empty data dir
    }
    return skills;
  }

  // --- Scan Reports ---

  async writeScanReport(
    ns: string,
    name: string,
    version: string,
    report: unknown
  ): Promise<void> {
    const dir = this.versionDir(ns, name, version);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "scan_report.json"),
      JSON.stringify(report, null, 2)
    );
  }

  async readScanReport(
    ns: string,
    name: string,
    version: string
  ): Promise<unknown | null> {
    try {
      const data = await readFile(
        join(this.versionDir(ns, name, version), "scan_report.json"),
        "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // --- Verification ---

  async writeVerification(
    ns: string,
    name: string,
    version: string,
    result: VerificationResult
  ): Promise<void> {
    const dir = this.versionDir(ns, name, version);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "verification.json"),
      JSON.stringify(result, null, 2)
    );
  }

  async readVerification(
    ns: string,
    name: string,
    version: string
  ): Promise<VerificationResult | null> {
    try {
      const data = await readFile(
        join(this.versionDir(ns, name, version), "verification.json"),
        "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // --- Agents ---

  agentDir(): string {
    return join(this.dataDir, "agents");
  }

  private agentPath(id: string): string {
    return join(this.agentDir(), id + ".json");
  }

  async listAgents(): Promise<unknown[]> {
    try {
      await mkdir(this.agentDir(), { recursive: true });
      const entries = await readdir(this.agentDir());
      const agents: unknown[] = [];
      for (const entry of entries) {
        if (!entry.endsWith(".json")) continue;
        const id = entry.slice(0, -5);
        const agent = await this.readAgent(id);
        if (agent) agents.push(agent);
      }
      (agents as any[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      return agents;
    } catch {
      return [];
    }
  }

  async readAgent(id: string): Promise<unknown | null> {
    try {
      const data = await readFile(this.agentPath(id), "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async writeAgent(id: string, data: unknown): Promise<void> {
    await mkdir(this.agentDir(), { recursive: true });
    await writeFile(this.agentPath(id), JSON.stringify(data, null, 2));
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      await rm(this.agentPath(id));
      return true;
    } catch {
      return false;
    }
  }

  // --- Delete Skill ---

  async deleteSkill(ns: string, name: string): Promise<boolean> {
    try {
      await rm(this.skillDir(ns, name), { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  // --- Yank ---

  async yankVersion(
    ns: string,
    name: string,
    version: string
  ): Promise<boolean> {
    const manifest = await this.readManifest(ns, name, version);
    if (!manifest) return false;
    manifest.yanked = true;
    await writeFile(
      join(this.versionDir(ns, name, version), "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    return true;
  }
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}
