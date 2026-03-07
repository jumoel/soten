const securityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://api.github.com https://github.com",
    "worker-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname !== "preview.soten.pages.dev" && url.hostname.endsWith(".pages.dev")) {
    url.hostname = "soten.app";
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();
  const newHeaders = new Headers(response.headers);

  for (const [name, value] of Object.entries(securityHeaders)) {
    newHeaders.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
