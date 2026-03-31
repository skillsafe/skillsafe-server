const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const HASH_RE = /^sha256:[0-9a-f]{64}$/;
export function isValidSemver(v) {
    return SEMVER_RE.test(v);
}
export function isValidHash(h) {
    return HASH_RE.test(h);
}
export function isValidPath(p) {
    if (!p || p.startsWith("/"))
        return false;
    const parts = p.split("/");
    return !parts.some((s) => s === ".." || s === "");
}
export function validateManifest(files) {
    if (!Array.isArray(files) || files.length === 0)
        return "file manifest is empty";
    if (files.length > 1000)
        return "file manifest exceeds 1000 files";
    for (const f of files) {
        if (!isValidPath(f.path))
            return `invalid path: ${f.path}`;
        if (!isValidHash(f.hash))
            return `invalid hash for ${f.path}`;
        if (typeof f.size !== "number" || f.size < 0)
            return `invalid size for ${f.path}`;
    }
    return null;
}
//# sourceMappingURL=validation.js.map