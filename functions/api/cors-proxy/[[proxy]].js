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

export async function onRequest(context) {
  const { request } = context;

  console.log("Received proxy request", request.method, request.url);

  if (!allowMethods.includes(request.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(request.url);

  // Check if the request is at the proper path
  if (!url.pathname.startsWith("/api/cors-proxy/")) {
    return new Response("Not Found", { status: 404 });
  }

  let proxyUrl = url.toString().replace(/^.+\/cors-proxy\//, "https://");

  try {
    new URL(proxyUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
    });
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

  return new Response(
    response.body,
    Object.assign(
      {
        status: response.status,
        statusText: response.statusText,
      },
      responseHeaders,
    ),
  );
}
