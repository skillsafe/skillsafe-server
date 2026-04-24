import { Hono } from "hono";
import { ok, apiError } from "../lib/response.js";
function parseSkillPath(path) {
  const m = path.match(/^\/v1\/skills\/(@[^/]+)\/([^/?]+)(\/(.*))?/);
  if (!m) return null;
  return { ns: m[1], name: m[2], rest: m[4] ?? "" };
}
function verifyRoutes(storage) {
  const app = new Hono();
  app.post("/v1/skills/@:ns/:name/versions/:version/verify", async (c) => {
    const p = parseSkillPath(c.req.path);
    if (!p) return apiError(c, 400, "invalid_request", "Invalid skill path");
    const { ns, name, rest } = p;
    const versionMatch = rest.match(/^versions\/([^/]+)\/verify$/);
    const version = versionMatch ? versionMatch[1] : c.req.param("version");
    const manifest = await storage.readManifest(ns, name, version);
    if (!manifest) return apiError(c, 404, "not_found", "Version not found");
    const authorReport = await storage.readScanReport(ns, name, version);
    const body = await c.req.json();
    const consumerReport = body.scan_report || body;
    const authorTreeHash = authorReport?.skill_tree_hash || manifest.tree_hash;
    const consumerTreeHash = consumerReport.skill_tree_hash || consumerReport.tree_hash || "";
    let verdict;
    if (!consumerTreeHash) {
      verdict = "divergent";
    } else if (authorTreeHash !== consumerTreeHash) {
      verdict = "critical";
    } else if (!authorReport) {
      verdict = "verified";
    } else {
      const authorClean = authorReport.clean === true;
      const consumerClean = consumerReport.clean === true;
      const authorFindings = authorReport.findings_count ?? authorReport.findings?.length ?? 0;
      const consumerFindings = consumerReport.findings_count ?? consumerReport.findings?.length ?? 0;
      if (authorClean !== consumerClean || authorFindings !== consumerFindings) {
        verdict = "divergent";
      } else {
        verdict = "verified";
      }
    }
    const result = {
      verdict,
      author_tree_hash: authorTreeHash,
      consumer_tree_hash: consumerTreeHash,
      verified_at: (/* @__PURE__ */ new Date()).toISOString(),
      verified_by: "consumer"
    };
    await storage.writeVerification(ns, name, version, result);
    return ok(c, result);
  });
  app.get("/v1/skills/@:ns/:name/versions/:version/verify", async (c) => {
    const p = parseSkillPath(c.req.path);
    if (!p) return apiError(c, 400, "invalid_request", "Invalid skill path");
    const { ns, name, rest } = p;
    const versionMatch = rest.match(/^versions\/([^/]+)\/verify$/);
    const version = versionMatch ? versionMatch[1] : c.req.param("version");
    const result = await storage.readVerification(ns, name, version);
    if (!result) return apiError(c, 404, "not_found", "No verification found");
    return ok(c, result);
  });
  return app;
}
export {
  verifyRoutes
};
//# sourceMappingURL=verify.js.map
