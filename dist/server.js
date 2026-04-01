import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiError } from "./lib/response.js";
import { utilityRoutes } from "./routes/utility.js";
import { skillRoutes } from "./routes/skills.js";
import { agentRoutes } from "./routes/agents.js";
import { blobRoutes } from "./routes/blobs.js";
import { scanRoutes } from "./routes/scan.js";
import { verifyRoutes } from "./routes/verify.js";
import { uiRoutes } from "./routes/ui.js";
const WRITE_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
function createApp(storage, token) {
  const app = new Hono();
  app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
  if (token) {
    app.use("*", async (c, next) => {
      if (!WRITE_METHODS.has(c.req.method)) return next();
      const auth = c.req.header("Authorization");
      if (!auth || auth !== `Bearer ${token}`) {
        return apiError(c, 401, "unauthorized", "Invalid or missing token");
      }
      return next();
    });
  }
  app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return apiError(c, 500, "internal_error", err.message || "Internal server error");
  });
  app.route("", uiRoutes(storage.dataDir));
  app.route("", utilityRoutes);
  app.route("", skillRoutes(storage));
  app.route("", agentRoutes(storage));
  app.route("", blobRoutes(storage));
  app.route("", scanRoutes(storage));
  app.route("", verifyRoutes(storage));
  return app;
}
export {
  createApp
};
//# sourceMappingURL=server.js.map
