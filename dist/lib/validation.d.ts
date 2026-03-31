import type { FileEntry } from "./types.js";
export declare function isValidSemver(v: string): boolean;
export declare function isValidHash(h: string): boolean;
export declare function isValidPath(p: string): boolean;
export declare function validateManifest(files: FileEntry[]): string | null;
