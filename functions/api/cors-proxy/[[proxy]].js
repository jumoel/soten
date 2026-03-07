// Ref: https://github.com/isomorphic-git/cors-proxy/blob/main/middleware.js

const allowHeaders = [
  "accept-encoding",
  "accept-language",
  "accept",
  "access-control-allow-origin",
  "authorization",
  "cache-control",
  "connection",
  "content-length",
  "content-type",
  "dnt",
  "git-protocol",
  "pragma",
  "range",
  "referer",
  "user-agent",
  "x-authorization",
  "x-http-method-override",
  "x-requested-with",
];
const exposeHeaders = [
  "accept-ranges",
  "age",
  "cache-control",
  "content-length",
  "content-language",
  "content-type",
  "date",
  "etag",
  "expires",
  "last-modified",
  "location",
  "pragma",
  "server",
  "transfer-encoding",
  "vary",
  "x-github-request-id",
  "x-redirected-url",
];
const allowMethods = ["POST", "GET", "OPTIONS"];

const allowedOrigins = [
  "https://soten.app",
  /^https:\/\/[a-z0-9-]+\.soten\.pages\.dev$/,
  "http://localhost:5173",
  "http://localhost:8788",
];

const allowedTargetHosts = ["github.com", "api.github.com"];

function isAllowedOrigin(origin) {
  // Allow requests without an Origin header — these are same-origin requests
  // (e.g. from a web worker on the same domain) and are not a CORS abuse vector.
  if (!origin) return true;
  return allowedOrigins.some((allowed) =>
    typeof allowed === "string" ? origin === allowed : allowed.test(origin),
  );
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": allowMethods.join(", "),
    "access-control-allow-headers": allowHeaders.join(", "),
    "access-control-expose-headers": exposeHeaders.join(", "),
    "access-control-max-age": "86400",
  };
}

export async function onRequest(context) {
  const { request } = context;

  console.log("Received proxy request", request.method, request.url);

  if (!allowMethods.includes(request.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/cors-proxy/")) {
    return new Response("Not Found", { status: 404 });
  }

  const proxyUrl = url.toString().replace(/^.+\/cors-proxy\//, "https://");

  let parsed;
  try {
    parsed = new URL(proxyUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  if (!allowedTargetHosts.includes(parsed.hostname)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }

  const requestHeaders = new Headers();
  for (const [name, value] of request.headers) {
    if (allowHeaders.includes(name)) {
      requestHeaders.set(name, value);
    }
  }

  const response = await fetch(proxyUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
  });

  const responseHeaders = new Headers();
  for (const [name, value] of response.headers) {
    if (exposeHeaders.includes(name)) {
      responseHeaders.set(name, value);
    }
  }
  for (const [name, value] of Object.entries(corsHeaders(origin))) {
    responseHeaders.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
