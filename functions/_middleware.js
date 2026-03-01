export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname !== "preview.soten.pages.dev" && url.hostname.endsWith(".pages.dev")) {
    url.hostname = "soten.app";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
