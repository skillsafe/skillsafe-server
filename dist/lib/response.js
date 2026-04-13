function ok(c, data, meta) {
  return c.json({
    ok: true,
    data,
    meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...meta }
  });
}
function apiError(c, status, code, message, details) {
  return c.json(
    {
      ok: false,
      error: { code, message, status, ...details ? { details } : {} },
      meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    },
    status
  );
}
export {
  apiError,
  ok
};
//# sourceMappingURL=response.js.map
