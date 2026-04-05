import { Hono } from "hono";
import { ok, apiError } from "../lib/response.js";
import { mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

function genId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function agentRoutes(storage: any): Hono {
  const app = new Hono();

  // ── Agent CRUD ──────────────────────────────────────────────────────

  app.get("/v1/agents", async (c) => {
    const agents = await storage.listAgents();
    return ok(c, agents);
  });

  app.post("/v1/agents", async (c) => {
    const body = await c.req.json<{ name?: string; platform?: string; description?: string; metadata?: Record<string, unknown> }>();
    if (!body.name || !body.platform) {
      return apiError(c, 400, "invalid_request", "name and platform are required");
    }
    const now = new Date().toISOString();
    const agent = {
      id: genId("agt_"),
      name: body.name,
      platform: body.platform,
      description: body.description || "",
      metadata: body.metadata || {},
      created_at: now,
      updated_at: now,
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
    const body = await c.req.json<Record<string, unknown>>();
    const updated = {
      ...agent,
      ...body,
      id: agent.id,
      created_at: agent.created_at,
      updated_at: new Date().toISOString(),
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

  // ── Snapshot helpers ────────────────────────────────────────────────

  function snapshotsDir(agentId: string): string {
    return join(storage.dataDir, "agents", agentId, "snapshots");
  }

  function snapshotDir(agentId: string, snapId: string): string {
    return join(snapshotsDir(agentId), snapId);
  }

  async function readSnapshotMeta(agentId: string, snapId: string): Promise<any | null> {
    try {
      const data = await readFile(join(snapshotDir(agentId, snapId), "meta.json"), "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async function listSnapshotIds(agentId: string): Promise<string[]> {
    try {
      const dir = snapshotsDir(agentId);
      await mkdir(dir, { recursive: true });
      const entries = await readdir(dir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory() && e.name.startsWith("snp_")).map(e => e.name);
    } catch {
      return [];
    }
  }

  // ── Snapshot routes ─────────────────────────────────────────────────

  // POST /v1/agents/:id/snapshots — save snapshot (multipart)
  app.post("/v1/agents/:id/snapshots", async (c) => {
    const { id: agentId } = c.req.param();
    const agent = await storage.readAgent(agentId);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");

    const form = await c.req.parseBody({ all: true });

    // Parse metadata
    let metadata: Record<string, any> = {};
    const metaField = form["metadata"];
    if (metaField) {
      try {
        const raw = typeof metaField === "string" ? metaField : await (metaField as File).text();
        metadata = JSON.parse(raw);
      } catch { /* ignore parse errors */ }
    }

    // Collect files from file_0, file_1, etc.
    const files: Array<{ path: string; content: Buffer; hash: string }> = [];
    let totalSize = 0;
    for (let i = 0; i < 500; i++) {
      const field = form[`file_${i}`];
      if (!field) break;
      const file = field as File;
      const content = Buffer.from(await file.arrayBuffer());
      const hash = "sha256:" + createHash("sha256").update(content).digest("hex");
      totalSize += content.length;
      files.push({ path: file.name || `file_${i}`, content, hash });
    }

    if (files.length === 0) {
      return apiError(c, 400, "invalid_request", "No files provided");
    }

    // Create snapshot
    const snapId = genId("snp_");
    const now = new Date().toISOString();
    const snapDir = snapshotDir(agentId, snapId);
    const filesDir = join(snapDir, "files");
    await mkdir(filesDir, { recursive: true });

    // Write files and build manifest
    const fileManifest: Array<{ path: string; hash: string; size: number }> = [];
    for (const f of files) {
      await writeFile(join(filesDir, f.path.replace(/\//g, "__")), f.content);
      // Also store in blob store for content-addressable access
      await storage.writeBlob(f.hash, f.content);
      fileManifest.push({ path: f.path, hash: f.hash, size: f.content.length });
    }

    // Compute tree hash
    const treeContent = fileManifest
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(f => `${f.hash} ${f.path}`)
      .join("\n");
    const treeHash = "sha256:" + createHash("sha256").update(treeContent).digest("hex");

    const snapMeta = {
      id: snapId,
      snapshot_id: snapId,
      agent_id: agentId,
      version_tag: metadata.version_tag || null,
      description: metadata.description || null,
      tree_hash: treeHash,
      file_count: files.length,
      total_size: totalSize,
      files: fileManifest,
      snapshot_at: now,
      created_at: now,
    };

    await writeFile(join(snapDir, "meta.json"), JSON.stringify(snapMeta, null, 2));

    // Update agent's updated_at
    agent.updated_at = now;
    agent.snapshot_count = ((agent.snapshot_count || 0) + 1);
    await storage.writeAgent(agentId, agent);

    return ok(c, snapMeta);
  });

  // GET /v1/agents/:id/snapshots — list snapshots
  app.get("/v1/agents/:id/snapshots", async (c) => {
    const { id: agentId } = c.req.param();
    const agent = await storage.readAgent(agentId);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");

    const ids = await listSnapshotIds(agentId);
    const snapshots: any[] = [];
    for (const sid of ids) {
      const meta = await readSnapshotMeta(agentId, sid);
      if (meta) snapshots.push(meta);
    }

    // Sort newest first
    snapshots.sort((a, b) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime());

    const limit = parseInt(c.req.query("limit") || "20", 10);
    return ok(c, snapshots.slice(0, limit));
  });

  // GET /v1/agents/:id/snapshots/latest — get latest snapshot
  app.get("/v1/agents/:id/snapshots/latest", async (c) => {
    const { id: agentId } = c.req.param();
    const agent = await storage.readAgent(agentId);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");

    const ids = await listSnapshotIds(agentId);
    const snapshots: any[] = [];
    for (const sid of ids) {
      const meta = await readSnapshotMeta(agentId, sid);
      if (meta) snapshots.push(meta);
    }

    if (snapshots.length === 0) {
      return apiError(c, 404, "not_found", "No snapshots found");
    }

    snapshots.sort((a, b) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime());
    return ok(c, snapshots[0]);
  });

  // GET /v1/agents/:id/snapshots/:snapId — get specific snapshot
  app.get("/v1/agents/:id/snapshots/:snapId", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");
    return ok(c, meta);
  });

  // DELETE /v1/agents/:id/snapshots/:snapId — delete snapshot
  app.delete("/v1/agents/:id/snapshots/:snapId", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");

    await rm(snapshotDir(agentId, snapId), { recursive: true });

    // Update agent snapshot count
    const agent = await storage.readAgent(agentId);
    if (agent) {
      agent.snapshot_count = Math.max(0, (agent.snapshot_count || 1) - 1);
      agent.updated_at = new Date().toISOString();
      await storage.writeAgent(agentId, agent);
    }

    return ok(c, { deleted: true });
  });

  // GET /v1/agents/:id/snapshots/:snapId/files/* — get file content
  app.get("/v1/agents/:id/snapshots/:snapId/files/*", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");

    const filePath = c.req.path.split("/files/").slice(1).join("/files/");
    const fileEntry = meta.files?.find((f: any) => f.path === filePath);
    if (!fileEntry) return apiError(c, 404, "not_found", "File not found in snapshot");

    // Try reading from blob store
    const blob = await storage.readBlob(fileEntry.hash);
    if (!blob) return apiError(c, 404, "not_found", "File content not found");

    return new Response(blob, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  });

  // GET /v1/agents/:id/snapshots/tagged/:versionTag — get snapshot by version tag
  app.get("/v1/agents/:id/snapshots/tagged/:versionTag", async (c) => {
    const { id: agentId, versionTag } = c.req.param();
    const agent = await storage.readAgent(agentId);
    if (!agent) return apiError(c, 404, "not_found", "Agent not found");

    const ids = await listSnapshotIds(agentId);
    for (const sid of ids) {
      const meta = await readSnapshotMeta(agentId, sid);
      if (meta && meta.version_tag === versionTag) return ok(c, meta);
    }
    return apiError(c, 404, "not_found", `No snapshot with tag ${versionTag}`);
  });

  // GET /v1/agents/:id/snapshots/:snapId/download — download all files as zip
  app.get("/v1/agents/:id/snapshots/:snapId/download", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");

    // Return a JSON manifest with file contents (local server doesn't need real zip)
    const filesWithContent: Array<{ path: string; hash: string; size: number }> = [];
    for (const f of (meta.files || [])) {
      filesWithContent.push({ path: f.path, hash: f.hash, size: f.size });
    }
    return ok(c, { snapshot_id: snapId, files: filesWithContent });
  });

  // POST /v1/agents/:id/snapshots/:snapId/scan — scan snapshot (stub)
  app.post("/v1/agents/:id/snapshots/:snapId/scan", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");

    // Local server returns a placeholder scan report
    const report = {
      snapshot_id: snapId,
      agent_id: agentId,
      status: "clean",
      findings: [],
      scanned_at: new Date().toISOString(),
    };

    // Persist the scan report alongside the snapshot
    const reportPath = join(snapshotDir(agentId, snapId), "scan_report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    return ok(c, report);
  });

  // GET /v1/agents/:id/snapshots/:snapId/scan — get scan report
  app.get("/v1/agents/:id/snapshots/:snapId/scan", async (c) => {
    const { id: agentId, snapId } = c.req.param();
    const meta = await readSnapshotMeta(agentId, snapId);
    if (!meta) return apiError(c, 404, "not_found", "Snapshot not found");

    try {
      const reportPath = join(snapshotDir(agentId, snapId), "scan_report.json");
      const data = await readFile(reportPath, "utf-8");
      return ok(c, JSON.parse(data));
    } catch {
      return apiError(c, 404, "not_found", "No scan report for this snapshot");
    }
  });

  // GET /v1/agents/:id/diff — diff two snapshots
  app.get("/v1/agents/:id/diff", async (c) => {
    const { id: agentId } = c.req.param();
    const fromId = c.req.query("from");
    const toId = c.req.query("to");
    if (!fromId || !toId) {
      return apiError(c, 400, "invalid_request", "from and to query params required");
    }

    const fromMeta = await readSnapshotMeta(agentId, fromId);
    const toMeta = await readSnapshotMeta(agentId, toId);
    if (!fromMeta) return apiError(c, 404, "not_found", `Snapshot ${fromId} not found`);
    if (!toMeta) return apiError(c, 404, "not_found", `Snapshot ${toId} not found`);

    const fromFiles = new Map((fromMeta.files || []).map((f: any) => [f.path, f.hash]));
    const toFiles = new Map((toMeta.files || []).map((f: any) => [f.path, f.hash]));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    for (const [path, hash] of toFiles) {
      if (!fromFiles.has(path)) added.push(path);
      else if (fromFiles.get(path) !== hash) modified.push(path);
    }
    for (const [path] of fromFiles) {
      if (!toFiles.has(path)) removed.push(path);
    }

    return ok(c, {
      from: fromId,
      to: toId,
      added,
      removed,
      modified,
      unchanged: toFiles.size - added.length - modified.length,
    });
  });

  return app;
}
