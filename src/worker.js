export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    const url = new URL(request.url);

    // 1. Allow optional query parameter token (e.g., https://your-site.workers.dev/?key=MySecretKey)
    const secretKey = url.searchParams.get("key");
    const VALID_KEY = "FreeKiosk-PhotoFrame-AuthToken-drytown68";

    if (secretKey !== VALID_KEY) {
      return new Response("403 Forbidden: Photo Frame Access Only", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // 2. Serve static assets if key matches
    return env.ASSETS.fetch(request);
  }
};