export const config = { runtime: "edge" };

function unauthorized() {
  return new Response("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Lavera"' },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);

  // Statik dosyaları (js/css/png) bypass et
  if (
    url.pathname.startsWith("/assets") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    return fetch(req);
  }

  const user = process.env.BASIC_AUTH_USER || "";
  const pass = process.env.BASIC_AUTH_PASS || "";

  // env yoksa koruma kapalı
  if (!user || !pass) return fetch(req);

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  const b64 = auth.split(" ")[1];
  const decoded = atob(b64 || "");
  const [u, p] = decoded.split(":");

  if (u === user && p === pass) return fetch(req);
  return unauthorized();
}