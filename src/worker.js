export default {
  async fetch(request, env, ctx) {
    const userAgent = request.headers.get("user-agent") || "";
    const SECRET_TOKEN = "FreeKiosk-PhotoFrame-AuthToken-drytown68";

    // 1. If the request does NOT contain your secret token, block it immediately
    if (!userAgent.includes(SECRET_TOKEN)) {
      return new Response("403 Forbidden: Photo Frame Access Only", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // 2. If the secret token matches, serve the static Vite/React app assets
    return env.ASSETS.fetch(request);
  }
};