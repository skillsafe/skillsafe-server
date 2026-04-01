#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { Storage } from "./storage.js";
import { createApp } from "./server.js";
import { join } from "node:path";
import { homedir } from "node:os";
function parseArgs(args) {
    const opts = {
        port: 9876,
        dataDir: join(process.cwd(), "data"),
        token: null,
        maxSize: 50 * 1024 * 1024,
    };
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--port":
                opts.port = parseInt(args[++i], 10);
                break;
            case "--data":
                opts.dataDir = args[++i];
                break;
            case "--token":
                opts.token = args[++i];
                break;
            case "--max-size":
                opts.maxSize = parseInt(args[++i], 10);
                break;
            case "--help":
                console.log(`
skillsafe-local — Local skill registry for SkillSafe CLI

Usage: skillsafe-local [options]

Options:
  --port <number>     Port to listen on (default: 9876)
  --data <path>       Data directory (default: ./data)
  --token <string>    Require this token for write operations
  --max-size <bytes>  Max request body size (default: 52428800)
  --help              Show this help
`);
                process.exit(0);
        }
    }
    return opts;
}
async function main() {
    const opts = parseArgs(process.argv.slice(2));
    const storage = new Storage(opts.dataDir);
    await storage.init();
    const app = createApp(storage, opts.token);
    console.log(`skillsafe-local v0.1.0`);
    console.log(`  Data: ${opts.dataDir}`);
    console.log(`  Auth: ${opts.token ? "token required for writes" : "open (no token)"}`);
    console.log(`  Listening on http://localhost:${opts.port}`);
    serve({ fetch: app.fetch, port: opts.port });
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map