import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiError } from "./lib/response.js";
import { utilityRoutes } from "./routes/utility.js";
import { skillRoutes } from "./routes/skills.js";
import { blobRoutes } from "./routes/blobs.js";
import { scanRoutes } from "./routes/scan.js";
import { verifyRoutes } from "./routes/verify.js";
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
export function createApp(storage, token) {
    const app = new Hono();
    // CORS
    app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
    // Optional token auth on write routes
    if (token) {
        app.use("*", async (c, next) => {
            if (!WRITE_METHODS.has(c.req.method))
                return next();
            const auth = c.req.header("Authorization");
            if (!auth || auth !== `Bearer ${token}`) {
                return apiError(c, 401, "unauthorized", "Invalid or missing token");
            }
            return next();
        });
    }
    // Global error handler
    app.onError((err, c) => {
        console.error("Unhandled error:", err);
        return apiError(c, 500, "internal_error", err.message || "Internal server error");
    });
    // Mount routes
    app.route("", utilityRoutes);
    app.route("", skillRoutes(storage));
    app.route("", blobRoutes(storage));
    app.route("", scanRoutes(storage));
    app.route("", verifyRoutes(storage));
    return app;
}
//# sourceMappingURL=server.js.map