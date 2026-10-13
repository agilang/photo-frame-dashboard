export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Validate Secret Key
    const secretKey = url.searchParams.get("key");
    const VALID_KEY = "FreeKiosk-PhotoFrame-AuthToken-drytown68";

    // Allow requests that have the key OR sub-asset requests (JS, CSS, images) from the loaded page
    const isStaticAsset = url.pathname.startsWith("/assets/") || url.pathname.includes(".");
    
    if (secretKey !== VALID_KEY && !isStaticAsset) {
      return new Response("403 Forbidden: Photo Frame Access Only", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

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