export async function onRequest(context) {
  const userAgent = context.request.headers.get("user-agent") || "";
  const SECRET_HEADER = "FreeKiosk-PhotoFrame-AuthToken-drytown68";

  // If the request is from the photo frame, let it through
  if (userAgent.includes(SECRET_HEADER)) {
    return await context.next();
  }

  // Otherwise, block everyone else
  return new Response("Access Denied: Frame Only", { status: 403 });
}