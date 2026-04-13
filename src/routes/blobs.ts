import { Hono } from "hono";
import { apiError } from "../lib/response.js";
import type { Storage } from "../storage.js";

export function blobRoutes(storage: Storage): Hono {
  const app = new Hono();

  // The CLI sends the full hash including "sha256:" prefix in the URL path
  // e.g. GET /v1/blobs/sha256:abcdef1234...
  app.get("/v1/blobs/:hash{.+}", async (c) => {
    const hash = c.req.param("hash");
    const content = await storage.readBlob(hash);
    if (!content) {
      return apiError(c, 404, "not_found", "Blob not found");
    }
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": content.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": `"${hash}"`,
      },
    });
  });

  return app;
}
