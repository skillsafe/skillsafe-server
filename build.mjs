import { build } from "esbuild";
import { readdirSync, statSync } from "fs";
import { join } from "path";

function collectFiles(dir, ext = ".ts") {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) result.push(...collectFiles(full, ext));
    else if (full.endsWith(ext)) result.push(full);
  }
  return result;
}

const entryPoints = collectFiles("src");

await build({
  entryPoints,
  bundle: false,
  platform: "node",
  format: "esm",
  outdir: "dist",
  outbase: "src",
  sourcemap: true,
  target: "node18",
});

console.log("Build complete.");
