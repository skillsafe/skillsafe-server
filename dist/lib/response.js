export function ok(c, data, meta) {
    return c.json({
        ok: true,
        data,
        meta: { timestamp: new Date().toISOString(), ...meta },
    });
}
export function apiError(c, status, code, message, details) {
    return c.json({
        ok: false,
        error: { code, message, status, ...(details ? { details } : {}) },
        meta: { timestamp: new Date().toISOString() },
    }, status);
}
//# sourceMappingURL=response.js.map