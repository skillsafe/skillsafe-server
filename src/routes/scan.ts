import { Hono } from "hono";
import { ok, apiError } from "../lib/response.js";
import type { Storage } from "../storage.js";

/**
 * Parse @ns/name/rest from a skill API path.
 * Workaround for Hono bug where @:ns/:name patterns don't correctly capture all params.
 */
function parseSkillPath(
  path: string
): { ns: string; name: string; rest: string } | null {
  const m = path.match(/^\/v1\/skills\/(@[^/]+)\/([^/?]+)(\/(.*))?/);
  if (!m) return null;
  return { ns: m[1], name: m[2], rest: m[4] ?? "" };
}

export function scanRoutes(storage: Storage): Hono {
  const app = new Hono();

  app.post("/v1/skills/@:ns/:name/versions/:version/scan", async (c) => {
    const p = parseSkillPath(c.req.path);
    if (!p) return apiError(c, 400, "invalid_request", "Invalid skill path");
    const { ns, name, rest } = p;

    // rest = "versions/1.0.0/scan"
    const versionMatch = rest.match(/^versions\/([^/]+)\/scan$/);
    const version = versionMatch ? versionMatch[1] : c.req.param("version");

    if (!(await storage.versionExists(ns, name, version))) {
      return apiError(c, 404, "not_found", "Version not found");
    }

    const report = await c.req.json();
    await storage.writeScanReport(ns, name, version, report);
    return ok(c, { namespace: ns, name, version, scan_stored: true });
  });

  app.get("/v1/skills/@:ns/:name/versions/:version/scan", async (c) => {
    const p = parseSkillPath(c.req.path);
    if (!p) return apiError(c, 400, "invalid_request", "Invalid skill path");
    const { ns, name, rest } = p;

    const versionMatch = rest.match(/^versions\/([^/]+)\/scan$/);
    const version = versionMatch ? versionMatch[1] : c.req.param("version");

    const report = await storage.readScanReport(ns, name, version);
    if (!report) return apiError(c, 404, "not_found", "Scan report not found");
    return ok(c, report);
  });

  return app;
}
