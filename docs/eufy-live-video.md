# Eufy live video on the photo frame

Use the maintained [`ha-eufy-sdk-bridge`](https://github.com/mega-yfue/ha-eufy-sdk-bridge), which exposes
camera discovery and snapshots and bundles go2rtc for browser playback.

This setup is for a dashboard served locally on your home network and viewed by the photo frame.
The Cloudflare-hosted Worker cannot reach a private home-LAN address, and a browser cannot play a
LAN WebRTC stream from a remote Cloudflare page without a separately secured network path.

## Start the bridge

Eufy generally allows one active account session. Run only this bridge on the account; a second
client logging in disconnects it and triggers a new verification code.

On macOS, Docker containers use Docker Desktop's VM network. Publish the bridge and go2rtc ports
explicitly so both the Mac and the photo frame can reach them.

Create a private working directory and `.env` file:

```sh
mkdir -p ~/eufy-live-bridge/data
cd ~/eufy-live-bridge
```

Create `.env` with your Eufy account login and the country where that account was registered:

```dotenv
EUFY_EMAIL=your-eufy-email
EUFY_PASSWORD=your-eufy-password
EUFY_COUNTRY=US
BRIDGE_HOST=0.0.0.0
BRIDGE_PORT=8791
BRIDGE_SELF_HOST=127.0.0.1
GO2RTC_ENABLE=1
```

Restrict access to the bridge ports to your trusted home LAN and **do not port-forward them to the
internet**. The bridge's HTTP and go2rtc interfaces do not provide the dashboard's access-key
protection; anyone who can reach them may be able to view/control cameras.

Run the bridge:

```sh
docker run -d --name eufy-live-bridge-lan --restart unless-stopped \
  -p 8791:8791 \
  -p 1984:1984 \
  -p 8554:8554 \
  -p 8555:8555/tcp \
  -p 8555:8555/udp \
  --env-file "$PWD/.env" \
  -v "$PWD/data:/app/data" \
  ghcr.io/mega-yfue/ha-eufy-sdk-bridge:0.5.0
```

Check startup with `docker logs -f eufy-live-bridge-lan`. If the bridge logs `auth required: require_2fa`, complete the challenge from a browser on the home
network. Open the dashboard, then open its browser developer console and run this after replacing the
address with your Mac's LAN IP:

```js
const eufyAuthSocket = new WebSocket("ws://192.168.1.253:8791/ws");
eufyAuthSocket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  console.log(message);
  if (message.event === "hello" && message.auth?.state === "require_2fa") {
    const code = prompt("Enter the Eufy verification code");
    if (code) eufyAuthSocket.send(JSON.stringify({ id: 1, cmd: "auth.submit", code }));
  }
};
```

Wait for the response to show `auth.state: "ok"`. If it requests a CAPTCHA instead, follow the
bridge's [deployment guide](https://github.com/mega-yfue/ha-eufy-sdk-bridge/blob/main/docs/docker-compose.md).

### Configure the LAN WebRTC candidate

Docker Desktop can make go2rtc advertise an address that the frame cannot reach. After the bridge is
authenticated and go2rtc is running, set the Mac's LAN IP as its WebRTC candidate (replace the
example address). Reapply this after restarting the bridge, because it regenerates `go2rtc.yaml`:

```sh
curl -X PATCH -H 'Content-Type: application/yaml' \
  --data-binary @- http://127.0.0.1:1984/api/config <<'YAML'
webrtc:
  candidates:
    - 192.168.1.10:8555
YAML
curl -X POST http://127.0.0.1:1984/api/restart
```

The second command restarts go2rtc so new WebRTC sessions use the candidate. Keep TCP and UDP port
`8555` published in Docker and allowed through the Mac firewall.

If the old `eufy-live-bridge` container already exists, stop it so it does not log into the same
Eufy account concurrently. Keep that container; the new container uses the same `data` directory so
the bridge can reuse its saved session:

```sh
docker stop eufy-live-bridge
```

Then run the `docker run` command above from the same directory.

## Connect the dashboard and frame

Find the Mac's LAN IP address (for example, `192.168.1.10`). Set these values in the ignored
`dashboard/.dev.vars`, replacing the example address:

```dotenv
EUFY_LIVE_BRIDGE_URL=http://192.168.1.10:8791
EUFY_LIVE_BRIDGE_BROWSER_URL=http://192.168.1.10:8791
EUFY_GO2RTC_BROWSER_URL=http://192.168.1.10:1984
```

The first URL is used by the local Worker for still images. The browser URLs let the frame connect
directly to the bridge's WebSocket camera list and go2rtc's WebRTC player. Keep the dashboard access
key configured too.

Build and serve the Worker on the LAN from `dashboard/`:

```sh
npm run build
npx wrangler dev --ip 0.0.0.0 --port 8788
```

Open `http://<mac-lan-ip>:8788/?key=<DASHBOARD_ACCESS_KEY>` on the frame. The Control view should
list all cameras advertised by `devices.list`. Selecting a camera opens the go2rtc live player and a
separate snapshot with a **Refresh snapshot** action.

The dashboard still-image route supports the bridge's `auto`, `stored`, and `live` snapshot modes.
An Eufy battery camera may return a saved event image in `auto` mode rather than waking for a live
still. Live video starts when the go2rtc player connects and can wake the camera.

This local-LAN setup is not suitable for a Cloudflare-hosted dashboard: its Worker cannot fetch the
Mac's private address. Remote access needs a separately designed, authenticated tunnel for the
bridge, go2rtc HTTP API, and WebRTC media ports; do not expose those ports directly to the internet.
