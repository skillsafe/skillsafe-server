import type { SkillMeta, VersionManifest, VerificationResult } from "./lib/types.js";
export declare class Storage {
    private dataDir;
    private blobDir;
    private useSymlinks;
    constructor(dataDir: string);
    init(): Promise<void>;
    private blobPath;
    hasBlob(hash: string): Promise<boolean>;
    writeBlob(hash: string, content: Buffer): Promise<void>;
    readBlob(hash: string): Promise<Buffer | null>;
    private skillDir;
    writeSkillMeta(ns: string, name: string, meta: SkillMeta): Promise<void>;
    readSkillMeta(ns: string, name: string): Promise<SkillMeta | null>;
    private versionDir;
    saveVersion(ns: string, name: string, manifest: VersionManifest): Promise<void>;
    readManifest(ns: string, name: string, version: string): Promise<VersionManifest | null>;
    readVersionFile(ns: string, name: string, version: string, filePath: string): Promise<Buffer | null>;
    listVersions(ns: string, name: string): Promise<VersionManifest[]>;
    latestVersion(ns: string, name: string): Promise<string | null>;
    versionExists(ns: string, name: string, version: string): Promise<boolean>;
    listAllSkills(): Promise<SkillMeta[]>;
    writeScanReport(ns: string, name: string, version: string, report: unknown): Promise<void>;
    readScanReport(ns: string, name: string, version: string): Promise<unknown | null>;
    writeVerification(ns: string, name: string, version: string, result: VerificationResult): Promise<void>;
    readVerification(ns: string, name: string, version: string): Promise<VerificationResult | null>;
    yankVersion(ns: string, name: string, version: string): Promise<boolean>;
}
