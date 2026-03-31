import { Hono } from "hono";
import { ok, apiError } from "../lib/response.js";
function genId() {
  return "agt_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function agentRoutes(storage) {
  const app = new Hono();
  app.get("/v1/agents", async (c) => {
    const agents = await storage.listAgents();
    return ok(c, agents);
  });
  app.post("/v1/agents", async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.platform) {
      return apiError(c, 400, "invalid_request", "name and platform are required");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const agent = {
      id: genId(),
      name: body.name,
      platform: body.platform,
      description: body.description || "",
      metadata: body.metadata || {},
      created_at: now,
      updated_at: now
    };
    await storage.writeAgent(agent.id, agent);
    return ok(c, agent);
  });
  app.get("/v1/agents/:id", async (c) => {
    const { id } = c.req.param();
    const agent = await storage.readAgent(id);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");
    return ok(c, agent);
  });
  app.patch("/v1/agents/:id", async (c) => {
    const { id } = c.req.param();
    const agent = await storage.readAgent(id);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");
    const body = await c.req.json();
    const updated = {
      ...agent,
      ...body,
      id: agent.id,
      created_at: agent.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await storage.writeAgent(id, updated);
    return ok(c, updated);
  });
  app.delete("/v1/agents/:id", async (c) => {
    const { id } = c.req.param();
    const deleted = await storage.deleteAgent(id);
    if (!deleted) return apiError(c, 404, "not_found", "Agent not found");
    return ok(c, { deleted: true });
  });
  return app;
}
export {
  agentRoutes
};
//# sourceMappingURL=agents.js.map
