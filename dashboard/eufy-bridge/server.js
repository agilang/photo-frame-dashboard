import { createHash, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { EufyMega, FileSessionStore, LoginStatus, StoredSnapshotUnavailableError } from "@mega-yfue/eufy-sdk";

const port = Number(process.env.EUFY_BRIDGE_PORT || 8791);
const host = process.env.EUFY_BRIDGE_HOST || "127.0.0.1";
const token = process.env.EUFY_BRIDGE_TOKEN || "";
const devices = new Map();

if (!process.env.EUFY_EMAIL || !process.env.EUFY_PASSWORD || token.length < 32) {
  throw new Error("Set EUFY_EMAIL, EUFY_PASSWORD, and a 32+ character EUFY_BRIDGE_TOKEN in .env");
}

const client = new EufyMega({
  email: process.env.EUFY_EMAIL,
  password: process.env.EUFY_PASSWORD,
  store: new FileSessionStore("./.eufy-session.json"),
  ...(process.env.EUFY_FFMPEG_PATH ? { ffmpegPath: process.env.EUFY_FFMPEG_PATH } : {}),
});

async function login() {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    let result = await client.login();
    while (result.status !== LoginStatus.Ok) {
      if (result.status === LoginStatus.Captcha) {
        const image = /^data:image\/png;base64,(.+)$/.exec(result.image || "");
        if (!image) throw new Error("Eufy requested a CAPTCHA image in an unsupported format");
        await writeFile("./.eufy-captcha.png", Buffer.from(image[1], "base64"), { mode: 0o600 });
        console.log("Eufy requested a CAPTCHA. Open dashboard/eufy-bridge/.eufy-captcha.png.");
        result = await client.solveCaptcha(await terminal.question("CAPTCHA answer: "));
      } else if (result.status === LoginStatus.TwoFactor) {
        result = await client.submitVerifyCode(await terminal.question(`Eufy verification code (${result.method}): `));
      } else {
        throw new Error(`Eufy login stopped with status ${String(result.status)}`);
      }
    }
  } finally {
    terminal.close();
  }
}

async function refreshDevices() {
  const roster = await client.getDevices();
  const next = new Map();
  for (const entry of roster) {
    if (!entry.sn) continue;
    const device = await client.getDevice(entry.sn);
    if (!device.camera?.()) continue;
    const id = createHash("sha256").update(entry.sn).digest("hex").slice(0, 20);
    const info = device.info?.();
    next.set(id, {
      id,
      serial: entry.sn,
      name: info?.name || entry.name || "Eufy camera",
    });
  }
  devices.clear();
  next.forEach((device, id) => devices.set(id, device));
}

function authorized(request) {
  const supplied = Buffer.from(request.headers.authorization || "");
  const expected = Buffer.from(`Bearer ${token}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function handle(request, response) {
  if (!authorized(request)) return sendJson(response, 403, { error: "Forbidden" });
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/cameras") {
    return sendJson(response, 200, {
      cameras: Array.from(devices.values(), ({ id, name }) => ({ id, name })),
    });
  }

  const match = /^\/api\/cameras\/([a-f0-9]{20})\/snapshot$/.exec(url.pathname);
  if (request.method !== "GET" || !match) return sendJson(response, 404, { error: "Not found" });
  const device = devices.get(match[1]);
  if (!device) return sendJson(response, 404, { error: "Camera not found" });

  try {
    const bound = await client.getDevice(device.serial);
    const camera = bound.camera?.();
    if (!camera) return sendJson(response, 404, { error: "Camera capability unavailable" });
    let jpeg;
    if (url.searchParams.get("live") === "1") {
      jpeg = (await camera.snapshotLive?.())?.jpeg;
    } else {
      jpeg = await camera.snapshotStored?.();
    }
    if (!jpeg) return sendJson(response, 404, { error: "No snapshot available" });
    response.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(jpeg);
  } catch (error) {
    if (error instanceof StoredSnapshotUnavailableError) {
      return sendJson(response, 404, { error: "No stored motion snapshot available" });
    }
    sendJson(response, 503, { error: "Camera snapshot unavailable" });
  }
}

await login();
await refreshDevices();
client.on("deviceAdded", () => { void refreshDevices().catch(() => {}); });
client.on("deviceRemoved", () => { void refreshDevices().catch(() => {}); });

const server = createServer((request, response) => {
  void handle(request, response).catch(() => {
    if (!response.headersSent) sendJson(response, 500, { error: "Bridge request failed" });
    else response.destroy();
  });
});

server.listen(port, host, () => {
  console.log(`Eufy bridge listening on http://${host}:${port}`);
  console.log(`${devices.size} camera(s) available; credentials and session remain local.`);
});

function shutdown() {
  server.close();
  void client.disconnect();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);