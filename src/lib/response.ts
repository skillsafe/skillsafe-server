import type { Context } from "hono";

export function ok(c: Context, data: unknown, meta?: Record<string, unknown>) {
  return c.json({
    ok: true,
    data,
    meta: { timestamp: new Date().toISOString(), ...meta },
  });
}

export function apiError(
  c: Context,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return c.json(
    {
      ok: false,
      error: { code, message, status, ...(details ? { details } : {}) },
      meta: { timestamp: new Date().toISOString() },
    },
    status as any
  );
}
