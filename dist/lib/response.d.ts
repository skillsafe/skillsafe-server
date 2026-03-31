import type { Context } from "hono";
export declare function ok(c: Context, data: unknown, meta?: Record<string, unknown>): Response & import("hono").TypedResponse<{
    ok: true;
    data: import("hono/utils/types").JSONValue;
    meta: {
        timestamp: string;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
export declare function apiError(c: Context, status: number, code: string, message: string, details?: Record<string, unknown>): Response & import("hono").TypedResponse<{
    ok: false;
    error: {
        details?: {
            [x: string]: import("hono/utils/types").JSONValue;
        } | undefined;
        code: string;
        message: string;
        status: number;
    };
    meta: {
        timestamp: string;
    };
}, any, "json">;
