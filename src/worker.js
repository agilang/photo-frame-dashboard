import { handleIntegrationApi } from "./integrations.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const secretKey = env.DASHBOARD_ACCESS_KEY;
    const queryKey = url.searchParams.get("key");
    const cookies = request.headers.get("Cookie") || "";
    const sessionKey = cookies.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith("dashboard_session="))?.slice("dashboard_session=".length);
    const hasSession = !!secretKey && sessionKey === secretKey;
    const hasQueryKey = !!secretKey && queryKey === secretKey;
    const isApi = url.pathname.startsWith("/api/");
    const isPrivatePhoto = url.pathname.startsWith("/photos/");
    const isStaticAsset = !isApi && !isPrivatePhoto && (url.pathname.startsWith("/assets/") || url.pathname.includes("."));

    if (!secretKey && !isStaticAsset) {
      return new Response("Dashboard access is not configured", { status: 503 });
    }

    if (isApi && !hasSession) {
      return new Response("403 Forbidden: Dashboard Session Required", { status: 403 });
    }

    if (!isApi && !isStaticAsset && !hasSession && !hasQueryKey) {
      return new Response("403 Forbidden: Photo Frame Access Only", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (hasQueryKey || queryKey) {
      url.searchParams.delete("key");
      const headers = new Headers({ Location: url.toString() });
      if (hasQueryKey) {
        const secure = url.protocol === "https:" ? "; Secure" : "";
        headers.append("Set-Cookie", `dashboard_session=${secretKey}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`);
      }
      return new Response(null, { status: 302, headers });
    }

    if (isApi) return handleIntegrationApi(request, env, url);

    // 2. Build asset request preserving path (e.g. /assets/index.js), stripping ONLY query params
    const assetUrl = new URL(request.url);
    assetUrl.search = ""; // Strip ?key=...

    // 3. Serve asset from Cloudflare static storage
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));

    // Fallback to index.html if a subroute is requested directly
    if (response.status === 404 && !isStaticAsset) {
      const indexUrl = new URL("/index.html", request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return response;
  },
};