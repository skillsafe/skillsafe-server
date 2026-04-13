import { Hono } from "hono";
import { ok } from "../lib/response.js";

export const utilityRoutes = new Hono();

utilityRoutes.get("/v1/health", (c) => {
  return ok(c, { status: "ok", version: "0.1.0" });
});

utilityRoutes.get("/v1/account", (c) => {
  return ok(c, {
    username: "local",
    tier: "local",
    email_verified: true,
  });
});
