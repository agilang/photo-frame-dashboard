export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Verify the secret key query parameter
    const secretKey = url.searchParams.get("key");
    const VALID_KEY = "FreeKiosk-PhotoFrame-AuthToken-drytown68";

    if (secretKey !== VALID_KEY) {
      return new Response("403 Forbidden: Photo Frame Access Only", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. Strip query parameters so env.ASSETS matches static files cleanly
    const cleanUrl = new URL(request.url);
    cleanUrl.search = ""; // Removes ?key=...

    // 3. Serve static React/Vite assets cleanly
    return env.ASSETS.fetch(new Request(cleanUrl, request));
  },
};