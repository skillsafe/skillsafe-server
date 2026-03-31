export interface FileEntry {
    path: string;
    hash: string;
    size: number;
}
export interface SkillMeta {
    namespace: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}
export interface VersionManifest {
    version: string;
    tree_hash: string;
    saved_at: string;
    changelog: string;
    yanked: boolean;
    files: FileEntry[];
}
export interface VerificationResult {
    verdict: "verified" | "divergent" | "critical";
    author_tree_hash: string;
    consumer_tree_hash: string;
    verified_at: string;
    verified_by: string;
}
export interface ServerConfig {
    port: number;
    dataDir: string;
    token: string | null;
    maxSize: number;
}
