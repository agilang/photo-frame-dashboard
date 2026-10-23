# Home HQ

### A calm, glanceable family dashboard for Android photo frames

Home HQ brings the family calendar, weather, chores, shopping list, photos and optional cameras
together in a touch-friendly display designed to stay visible across the room.

<table>
  <tr>
    <td align="center"><img src="docs/images/home-hq-day.png" alt="Home HQ Today screen in day mode" width="100%"><br><em>Day mode</em></td>
    <td align="center"><img src="docs/images/home-hq-night.png" alt="Home HQ Today screen in night mode" width="100%"><br><em>Night mode</em></td>
  </tr>
</table>

<p align="center"><em>Today screen · example view with sample data (names and location are placeholders)</em></p>

## Day and night modes

- **Day:** a light, frosted-glass look with a graphite accent and the self-hosted Geist font. Cards,
  rail and hero share one palette, and the Today hero shows a landscape photo when nothing is scheduled.
- **Night:** a dark dashboard (`nightdash`) with dimmed cards for evening use. After a short idle time
  it falls back to the full-screen night clock, and the photo-frame ambient screen shows the same
  countdown for any running timer.
- **Always on:** the YouTube/Spotify player keeps playing while background syncs (calendar, weather,
  cameras) refresh, and the on-screen keyboard no longer shrinks the stage.

## Screenshots of every tab

<details>
<summary>Day and night views of all ten tabs (sample data)</summary>

<table>
  <tr>
    <td align="center"><img src="docs/images/tabs/home-day.png" alt="Today, day mode" width="100%"><br><sub>Today · day</sub></td>
    <td align="center"><img src="docs/images/tabs/home-night.png" alt="Today, night mode" width="100%"><br><sub>Today · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/calendar-day.png" alt="Calendar, day mode" width="100%"><br><sub>Calendar · day</sub></td>
    <td align="center"><img src="docs/images/tabs/calendar-night.png" alt="Calendar, night mode" width="100%"><br><sub>Calendar · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/tasks-day.png" alt="Chores, day mode" width="100%"><br><sub>Chores · day</sub></td>
    <td align="center"><img src="docs/images/tabs/tasks-night.png" alt="Chores, night mode" width="100%"><br><sub>Chores · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/shopping-day.png" alt="Shopping, day mode" width="100%"><br><sub>Shopping · day</sub></td>
    <td align="center"><img src="docs/images/tabs/shopping-night.png" alt="Shopping, night mode" width="100%"><br><sub>Shopping · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/photos-day.png" alt="Photos, day mode" width="100%"><br><sub>Photos · day</sub></td>
    <td align="center"><img src="docs/images/tabs/photos-night.png" alt="Photos, night mode" width="100%"><br><sub>Photos · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/control-day.png" alt="Cameras (no bridge configured), day mode" width="100%"><br><sub>Cameras (no bridge configured) · day</sub></td>
    <td align="center"><img src="docs/images/tabs/control-night.png" alt="Cameras (no bridge configured), night mode" width="100%"><br><sub>Cameras (no bridge configured) · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/agents-day.png" alt="Assistant, day mode" width="100%"><br><sub>Assistant · day</sub></td>
    <td align="center"><img src="docs/images/tabs/agents-night.png" alt="Assistant, night mode" width="100%"><br><sub>Assistant · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/stocks-day.png" alt="Stocks, day mode" width="100%"><br><sub>Stocks · day</sub></td>
    <td align="center"><img src="docs/images/tabs/stocks-night.png" alt="Stocks, night mode" width="100%"><br><sub>Stocks · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/music-day.png" alt="Music, day mode" width="100%"><br><sub>Music · day</sub></td>
    <td align="center"><img src="docs/images/tabs/music-night.png" alt="Music, night mode" width="100%"><br><sub>Music · night</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/tabs/timers-day.png" alt="Timers, day mode" width="100%"><br><sub>Timers · day</sub></td>
    <td align="center"><img src="docs/images/tabs/timers-night.png" alt="Timers, night mode" width="100%"><br><sub>Timers · night</sub></td>
  </tr>
</table>

</details>

**Explore:** [Run the dashboard](#run-the-dashboard-locally) · [Supported frames](#working-frames) ·
[Find your setup guide](#which-frame-do-you-have) · [Credits](#credits-and-services)

This repository also documents how owners have unlocked and repurposed specific Android frames.
Hardware and firmware vary, so use the guide for your exact device and verify its model before
following any device-level instructions.

▶️ **Watch the frame setup video:** [YouTube](https://youtu.be/ZLycoUMltNI)

## Working frames

<a href="docs/devices.md"><img src="docs/images/devices/B0GHR65YYX.jpg" width="110" alt="10.1&quot; frame from the video (now often ships the PF1007L)" title="10.1&quot; frame from the video (now often ships the PF1007L)"></a>
<a href="docs/devices.md"><img src="docs/images/devices/B0FSZ86HTM.jpg" width="110" alt="Runxion 10.1&quot; Frameo" title="Runxion 10.1&quot; Frameo"></a>
<a href="docs/devices.md"><img src="docs/images/devices/B0GCCFPHZ4.jpg" width="110" alt="15.6&quot; Frameo" title="15.6&quot; Frameo"></a>
<a href="https://www.amazon.com/dp/B0CQN2PKQR"><img src="docs/images/devices/B0CQN2PKQR.jpg" width="110" alt="Pastigio FRAME156 15.6&quot; Frameo" title="Pastigio FRAME156 15.6&quot; Frameo"></a>
<a href="https://www.amazon.com/dp/B0D8J5PNFH"><img src="docs/images/devices/B0D8J5PNFH.jpg" width="110" alt="Dragon Touch Modern10 Charm" title="Dragon Touch Modern10 Charm"></a>
<a href="https://www.amazon.com/dp/B0C9V811L6"><img src="docs/images/devices/B0C9V811L6.jpg" width="110" alt="Skylight Calendar 15&quot;" title="Skylight Calendar 15&quot;"></a>
<a href="https://www.amazon.es/dp/B0GGB7LWX8"><img src="docs/images/devices/B0GGB7LWX8.jpg" width="110" alt="Humblestead 10.1&quot; (Amazon Spain, PF1007L)" title="Humblestead 10.1&quot; (Amazon Spain, PF1007L)"></a>
<a href="https://www.amazon.ca/dp/B0H4W1YPHH"><img src="docs/images/devices/B0H4W1YPHH.jpg" width="110" alt="Anna Bella 10.1&quot; (Amazon Canada, PF1007L)" title="Anna Bella 10.1&quot; (Amazon Canada, PF1007L)"></a>

Frames confirmed to work (product photos link to the device index). See the **[device index](docs/devices.md)** for every
frame, which board it has, and where to start.

## Community builds

30 people have shared their hacked frames in [Community builds](docs/community-builds.md): LCARS
interfaces, retro weather channels, chess puzzles, Linux on a frame, family dashboards and more.

<a href="docs/community-builds.md"><img src="docs/images/community/JesseWaites-11.jpg" height="90" alt="Star Trek LCARS interface" title="Star Trek LCARS interface"></a>
<a href="docs/community-builds.md"><img src="docs/images/community/derekparks-dev-14.jpg" height="90" alt="Retro weather-channel display" title="Retro weather-channel display"></a>
<a href="docs/community-builds.md"><img src="docs/images/community/tushargugnani-10.jpg" height="90" alt="Chess puzzles and analytics" title="Chess puzzles and analytics"></a>
<a href="docs/community-builds.md"><img src="docs/images/community/redp314-23.jpg" height="90" alt="Omarchy Linux on an A33 frame" title="Omarchy Linux on an A33 frame"></a>
<a href="docs/community-builds.md"><img src="docs/images/community/rida-18.jpg" height="90" alt="Family dashboard" title="Family dashboard"></a>
<a href="docs/community-builds.md"><img src="docs/images/community/onurceri-36.jpg" height="90" alt="FamilyOS" title="FamilyOS"></a>

Notes and scripts from getting full control of locked-down Android photo frames: getting ADB,
backing up the firmware, getting root, removing the vendor app, and running our own launcher,
browser and kiosk app. These are records of the units their owners tested, not universal flashing
guides.

## Which frame do you have?

Frames sold under the same name, even the same Amazon listing, can have different boards. Check
Settings → About before you follow any guide:

- **PF1007L / AiMOR** (firmware string contains `A33` and `PF1007L`): Allwinner A33. Many viewers of
  the video got this one. Use a **USB-A to USB-C** data cable; USB-C to USB-C gives no power or data.
  Start with [pf1007l-start-here.md](docs/pf1007l-start-here.md). It tests
  ADB over USB, then the network, and only then a boot patch. Its vendor app accepts root shell
  commands from the vendor's server, so read that page before the frame goes online.
- **BIUFRAME / Synergy 10X1** (Rockchip RK3126, ADB prompt on screen): the frame in the video. Follow
  [biuframe-setup-guide.md](docs/biuframe-setup-guide.md). `scripts/biuframe-setup.sh check`
  changes nothing and confirms the hardware matches; `backup` and `apply` do the rest.
- **Skylight Calendar 150-CAL** (Rockchip RK3566): start with [next-session.md](docs/next-session.md),
  then [app-analysis.md](docs/app-analysis.md) for the hidden menu. The manufacturer code is
  intentionally not published; the doc shows where the app checks it.
- **LOOFII C-3 21.5" calendar** (Allwinner A133, Android 10): root ADB over USB out of the box. See
  [allwinner-a133-loofii-c3.md](docs/allwinner-a133-loofii-c3.md); don't run the Rockchip or A33 scripts on it.
- **Frameo, Dragon Touch, Joyhong, Uhale, VESWWE, Pastigio and others:** see the
  [device index](docs/devices.md).
- **Something else:** work through the [phase map](#phase-map), create `docs/<device>.md`, and
  [send in what you find](#check-for-updates-and-send-back-what-you-find).

## The dashboard

[`dashboard/`](dashboard) is a Vite web app deployed to Cloudflare Workers, with useful sample data
when optional live services are not configured. Today has a next-event spotlight and a shared,
chronological family agenda, alongside the clock, weather, family presence, photo slideshow, chores,
shopping and camera status. Other screens include an editable calendar, locally saved chores and
shopping lists, voice-controlled multi-timers, optional camera playback, an AI assistant, interactive
hourly and 7-day weather, a personal stock watchlist, YouTube/Spotify embeds, and a low-glare night dashboard. Google
Calendar/Tasks, Home Assistant, live Eufy video, Workers AI, and Finnhub quotes are optional
integrations; each requires its own configuration described below.
Shopping-list edits, chore completion, and chore stars are saved in the browser on that device;
they are not shared across frames and can be removed by clearing the browser or kiosk app data.
Inactive screens refresh when opened rather than being rebuilt in the background after every data
update, keeping background work lighter on frame hardware.
`dashboard/kiosk/` is a small full-screen WebView Android app,
built without Gradle, that shows it. Hold two fingers still for 1.5 s to open a menu for the
launcher, Android settings, and reloading. On frames without system navigation, optional floating
**Back** and **Dashboard** buttons help; see the [kiosk guide](dashboard/kiosk/README.md).

### Run the dashboard locally

Install dependencies and start Vite from the `dashboard/` directory:

```sh
cd dashboard
npm install
npm run dev
```

Open the local URL printed by Vite (usually <http://localhost:5173>). This is the quickest way to
work on the UI. It serves the frontend directly, so it does not exercise the Cloudflare Worker or
its access-key check.

To test the built site without the Worker, run `npm run build` followed by `npm run preview` from
`dashboard/`; Vite prints the preview URL (usually <http://localhost:4173>).

To test the Worker and static-asset binding locally, build first, then start Wrangler from
`dashboard/`:

```sh
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your own values before starting Wrangler.
npm run build
npx wrangler dev
```

Set `DASHBOARD_ACCESS_KEY` to a random value first (for example, generate one with
`openssl rand -hex 32`). Open <http://localhost:8787/?key=YOUR_ACCESS_KEY> with that value; the
Worker exchanges it for an HttpOnly session cookie. Do not commit `.dev.vars`.

#### Live services

Live services are optional. Without their configuration the dashboard keeps its demo data. Add your
own values to the ignored `dashboard/.dev.vars` file; never put provider tokens in browser code or
commit them.

- **Google Calendar and Tasks:** create Google OAuth credentials, enable the Calendar API and Tasks
   API in the Google project, and provide a refresh token with the scopes
   `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/tasks`.
   The dashboard reads events for the previous 30 and next 90 days and can create new Calendar events.
   The Tasks view can add and complete Google Tasks. Chores remain available locally; use **Sync
   chores** in the Google Tasks view to create missing Google Tasks for them. Linked chore checkoffs
   update the matching Google Task. Use the Google Tasks view to complete standalone tasks.
- **AI chat:** the Assistant view uses Cloudflare Workers AI through the Worker's `AI` binding; no
   provider API key is required. The default is `@cf/meta/llama-3.1-8b-instruct-fp8-fast`; override it
   with `WORKERS_AI_MODEL`. Cloudflare's current Workers Free allowance is 10,000 Neurons per day
   across Workers AI, with model-dependent consumption; calls fail after the allowance on the free
   plan. Local `wrangler dev` uses a remote AI binding, so Wrangler must be authenticated to your
   Cloudflare account. The transcript stays in the current browser tab and is not persisted by this
   app. See [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).
- **Home Assistant:** provide an HTTPS URL reachable from Cloudflare and a Home Assistant long-lived
   access token. Add Kasa devices through Home Assistant's TP-Link integration and Eufy cameras through
   a compatible Eufy integration; camera snapshots appear for exposed `camera.*` entities, and
   `switch.*` / `light.*` entities can be toggled. Device compatibility depends on the Eufy model and
   Home Assistant integration. Never expose Home Assistant directly to the public internet without
   HTTPS and strong access controls.
- **Eufy live video:** use the maintained [`ha-eufy-sdk-bridge`](https://github.com/mega-yfue/ha-eufy-sdk-bridge)
   with go2rtc for live playback and snapshots. The dashboard connects directly to this bridge from
   the photo frame, so serve the Worker locally on the home network; a Cloudflare-hosted Worker
   cannot reach a private LAN address. Follow [the Eufy live-video setup](docs/eufy-live-video.md).
   Run only this one bridge per Eufy account, and never expose the bridge or go2rtc ports to the
   public internet.
- **Weather:** the dashboard requests current and hourly forecast data from
   [Open-Meteo](https://open-meteo.com/). Tap the weather card to switch between hourly and 7-day
   forecasts, change Celsius/Fahrenheit, search for cities, and choose the active forecast. These
   preferences are stored in that browser.
   The initial default is Austin, TX 78701 (`30.2672, -97.7431`); override it with
   `WEATHER_LOCATION`, `WEATHER_LAT`, and `WEATHER_LON` in `.dev.vars` if needed. It does not use
   browser geolocation. The clock uses the device's local time and timezone.
- **Stocks:** the Stocks screen uses Finnhub's quote endpoint through the Worker. Create a Finnhub
   API key and add `FINNHUB_API_KEY=...` to the ignored `dashboard/.dev.vars` for local Wrangler
   development. For deployment, run `npx wrangler secret put FINNHUB_API_KEY` from `dashboard/`.
   The frame stores up to 12 US-listed ticker symbols locally and requests quotes through the Worker;
   the key is never sent to the browser. Quote availability, delay, and rate limits depend on
   Finnhub's plan and exchange. This display is informational, not investment advice.
- **Photos:** copy image files into `dashboard/public/photos/` and list each one in
   `dashboard/public/photos/manifest.json`; only listed images are displayed. The photos folder is
   git-ignored except for the manifest, so your family pictures are not committed. Export or copy
   photos from Google Photos or Apple Photos into this folder yourself; there is no direct account
   connection or upload screen. Run `npm run deploy` from `dashboard/` on the computer containing
   the photos to publish them with the dashboard. Until you add your own images, the starter
   slideshow uses sample images from Picsum Photos; review that provider's terms before using the
   samples in a public deployment.
- **Music:** open **Music** and search for a song or artist, then tap a result to play it. Search
   requires a Google Cloud API key with **YouTube Data API v3** enabled. Add
   `YOUTUBE_API_KEY=...` to `dashboard/.dev.vars` for local Wrangler development, or run
   `npx wrangler secret put YOUTUBE_API_KEY` from `dashboard/` for deployment. Restrict the key to
   YouTube Data API v3; the key is used only by the Worker and is never sent to the browser. YouTube
   API quota applies. You can also paste a YouTube video/playlist or Spotify track, album, playlist,
   artist, or show URL as a fallback. Use **Expand player** for a larger player view within the
   dashboard; in the Home HQ kiosk, YouTube's own fullscreen control opens native fullscreen video.
   Choose a 15-, 30-, 45-, or 60-minute stop timer to end playback automatically. The timer continues
   while navigating to another dashboard screen; leaving Music without a timer stops playback. The
   player embeds the provider's own controls, and the selected link is saved only in that browser.
   Playback is not automatic. Ads, sign-in requirements, and content availability are controlled by
   YouTube or Spotify and can vary by content and region. Some Android WebViews may need network
   access and third-party cookies enabled for provider embeds.
- **Timers:** open **Timers** to run multiple independent countdowns. Use the microphone and say
   “Set a timer for 5 minutes” or “Set a 5-minute timer and a 10-minute timer”; type the same command
   or use the quick timer form if voice recognition is unavailable. Timers are stored in that
   browser and continue while Home HQ remains open. At the end, the dashboard shows an alert and
   plays a repeating chime until dismissed. Voice input requires microphone permission and a browser
   with speech recognition support; the kiosk asks for Android microphone permission the first time.
   To enable hands-free timers, open **Timers**, tap **Enable wake phrase**, and grant microphone
   access. Say “Hey Home,” then “set a timer for 5 minutes” within 10 seconds, or say the whole
   command in one sentence. Wake listening continues across dashboard sections while Home HQ is
   visible and the screen is on; its setting is saved in this browser and can be switched off on the
   Timers page. It uses the microphone continuously and speech recognition may use the browser
   provider's online service. If listening pauses or the dashboard is reopened, tap **Resume wake
   phrase**; browser speech recognition can stop or require a user gesture to restart. Listening
   pauses while the page is hidden and may need microphone permission or network access to resume.
   It cannot wake the screen while the display is off, or work when the browser or device is fully
   closed or powered off. Active timer countdowns also appear on Today and the dark Night clock.
   The alarm repeats a louder three-note chime; device media volume controls its audible level.
- **Night display:** the dim dashboard palette is applied when night dashboard mode is selected.
   It uses dark slate surfaces and softened teal highlights without inverting the colors of photos
   or camera video. The separate night clock remains available for a darker, glanceable screen.

For Cloudflare deployment, configure the same values as Worker secrets with `npx wrangler secret
put NAME` from `dashboard/` before running `npm run deploy`. At minimum, set
`DASHBOARD_ACCESS_KEY`; the other integrations need their corresponding values in `.dev.vars` or as
Worker secrets. Stop either local server with `Ctrl+C`.

Example photo manifest entry:

```json
{
   "photos": [
      { "src": "/photos/family-at-the-lake.jpg", "date": "2025-07-19", "place": "Lake", "o": "l" }
   ]
}
```

## For agents: start here

You are probably helping someone with a similar device plugged into a Mac over USB. Read this
section, then follow the links for the phase you are in. Do not run anything from a device
section unless the identity checks match exactly.

### Rules we learned the hard way

1. **Ask the owner before every write.** Reads are fine. Writing flash, a partition, `/system`,
   or sending a RAM payload to the SoC needs explicit approval for that specific action.
2. **No writes before a verified backup**: exact byte count, SHA-256, gzip readback, a check for
   `0xCC` filler, and independent re-reads of a few partitions that match.
3. **Don't trust `OKAY`.** Fastboot reported a successful boot write on the Skylight that never
   took effect. Verify writes by reading them back and checking the result on the device.
4. **Stop at the first mismatch** in a hash, model string, offset or size. Report it rather than
   working around it.
5. **One change at a time, undo recorded first.** Keep `.bak` copies next to edited files.
6. **Pin downloads by SHA-256** from official sources (vendor archives, F-Droid, LineageOS, GitHub releases).
7. **Keep dumps private.** They contain Wi-Fi passwords, tokens, serials, MAC addresses and
   copyrighted firmware. Use the ignored `backups/` and `diagnostics/` folders. Leave unique
   identifiers out of anything you commit.
8. **Write notes as you go.** Keep a per-device file in `docs/`, like the ones in the
   [device index](docs/devices.md), with
   observations kept separate from guesses.
9. **Prove the way back before you close the way in.** Before you disable the app or route your
   access came through, or end an access session, check by hand on the panel that your kiosk can
   reach Android Settings → Apps. An `input tap` or `screencap` over ADB does not prove it. A
   PF1007L was locked out this way; see
   [the lockout notes](docs/pf1007l-20260410-network-adb.md#6-lockout-after-disabling-aimor-and-offline-recovery). Some
   builds hide disabled apps in Settings, so keep a second way in, such as persistent ADB.

### Check for updates, and send back what you find

Many people are working on these frames at the same time. New hardware variants, fixes and
routes arrive as issues and pull requests, often before they are merged. Your local copy may be
out of date.

**Check before you start, and again before each write and at the start of each new session:**

```sh
git fetch origin && git log --oneline HEAD..origin/main   # new commits on main
gh issue list --repo wesbos/photo-frame-dashboard --state all --limit 30
gh pr list --repo wesbos/photo-frame-dashboard --state all --limit 30
gh pr view <number> --repo wesbos/photo-frame-dashboard   # read anything about your device
gh pr diff <number> --repo wesbos/photo-frame-dashboard
```

Without `gh`, use <https://github.com/wesbos/photo-frame-dashboard/issues> and
<https://github.com/wesbos/photo-frame-dashboard/pulls>. Read open PRs about your device, not only
merged docs. If newer information contradicts these docs, tell the owner and follow the newer
information only after its checks pass on your unit. Unmerged PRs are less reviewed, so treat their
scripts with extra care.

**Send a pull request when you learn something new** about a device that is already documented or
about a new one. Examples: a new board or firmware string, a different boot image hash, a cable or
port that does or does not work, a step that failed, a better route, or a correction. Failed
attempts are useful too.

1. Check open issues and PRs first. If one already covers your finding, comment there instead.
2. Create a branch, and add your observations to the device doc in `docs/`. For a new device,
   create `docs/<device>.md`. Keep observations separate from guesses, and say which host OS and
   which unit you used.
3. Remove private data: serials, MAC addresses, Wi-Fi details, eMMC CIDs, tokens, whole-disk
   hashes, dumps and vendor APKs. Firmware strings and boot image hashes are fine.
4. Show the owner the diff, because the PR is published under their GitHub account. Then open it
   with `gh pr create --repo wesbos/photo-frame-dashboard`.

For a PF1007L, include the [report template](docs/pf1007l-start-here.md#report-your-unit).

### Keep a private record of each frame

Keep what you changed on the owner's frame, where the backups are and how to undo it in the
ignored `frames/` folder, and read it at the start of the next session. Re-check the frame before
trusting it, and remember that a past approval is not permission for a new write. See
[frame-records.md](docs/frame-records.md).

### Phase map

| Phase                        | What to read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Identify** the hardware | USB IDs (Rockchip is VID `2207`), `adb shell getprop`, chip query in loader mode. See the hardware tables in [biuframe.md](docs/biuframe.md#hardware-and-ports) and [hardware-research.md](docs/hardware-research.md).                                                                                                                                                                                                                                                                                                                                                                           |
| **2. Get ADB**               | Try in this order: **(1) over USB** (`adb devices`; accept any "Allow USB debugging" prompt on the screen), **(2) over the network** (`adb connect <ip>:5555`), **(3) only then** a vendor-app trick or a boot patch. The PF1007L boot patch is written from an SD card, see [pf1007l-start-here.md](docs/pf1007l-start-here.md#test-sequence). Ideally no one needs (3). For a vendor-app trick, decompile the vendor app (jadx) and look for hidden tap counters and code dialogs: [app-analysis.md](docs/app-analysis.md). Gestures that did _not_ work are in [research-log.md](docs/research-log.md#ui-attempts-that-did-not-work).                                                                                                                                                                                                                                                                       |
| **3. Loader mode**           | Skylight: hold Volume − while connecting power. BIUFRAME: reset button at power-on (unconfirmed). Building `rkdeveloptool` on Apple silicon: [research-log.md](docs/research-log.md#loader-mode--successful).                                                                                                                                                                                                                                                                                                                                                                                    |
| **4. Back up**               | If loader reads past 32 MiB return `0xCC` filler, they are not a backup: [loader-research.md](docs/loader-research.md). Patched helper and full capture: `scripts/patch-usb-reader.py`, `scripts/load-usb-reader.py`, `scripts/probe-reader.py`, `scripts/backup-flash.py`, `scripts/inspect-backup.py`. With root, back up over ADB instead: `scripts/biuframe-setup.sh backup`.                                                                                                                                                                                                                |
| **5. Root**                  | First check for a shipped `su` (`adb shell su -c id`). On Android 10+ user builds, try the debug-ramdisk route: [debug-ramdisk-research.md](docs/debug-ramdisk-research.md), `scripts/build-debug-boot.py`. Fastboot write failures: [ram-boot-research.md](docs/ram-boot-research.md).                                                                                                                                                                                                                                                                                                          |
| **6. Make it useful**        | Launcher: [android-launcher.md](docs/android-launcher.md). Old Android (6.x) with a browser, WebView swap, CA roots, swap, nav bar and disabling vendor apps: [biuframe-setup-guide.md](docs/biuframe-setup-guide.md). Kiosk app and launcher database edits: [biuframe.md](docs/biuframe.md#custom-webview-kiosk-app-2026-09-30). A working example of a kiosk app and dashboard is in [`dashboard/`](dashboard). Build with `dashboard/kiosk/build.sh` (macOS/Linux) or `dashboard/kiosk/build.ps1` (Windows), change `DEFAULT_URL` in `MainActivity.java` to your own URL, and target the device's WebView version (see `dashboard/vite.config.js`). |
| **7. Networking**            | USB reverse tethering with gnirehtet: [usb-internet-sharing.md](docs/usb-internet-sharing.md). An app that requires Wi-Fi specifically: [onboarding-network-gate.md](docs/onboarding-network-gate.md). Dead onboard Wi-Fi and a USB dongle: [usb-wifi-dongle.md](docs/usb-wifi-dongle.md).                                                                                                                                                                                                                                                                                                       |
| **8. Vendor updates**        | Connecting the stock app to the internet can auto-install APK updates: [app-updates.md](docs/app-updates.md). Disable vendor updaters (FOTA etc.) before going online.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **9. Security hand-off**     | Tell the owner what they now have: [biuframe-setup-guide.md](docs/biuframe-setup-guide.md#read-this-first).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Other docs

- Skylight Wi-Fi investigation: [live-diagnostics.md](docs/live-diagnostics.md),
  [native-wifi-root-tests.md](docs/native-wifi-root-tests.md),
  [wifi-firmware-candidate.md](docs/wifi-firmware-candidate.md),
  [recovery-wifi-diagnostics.md](docs/recovery-wifi-diagnostics.md),
  [device-test-wifi.md](docs/device-test-wifi.md), [static-iw.md](docs/static-iw.md)
- Skylight boot and recovery: [boot-analysis.md](docs/boot-analysis.md),
  [recovery-analysis.md](docs/recovery-analysis.md)
- Replacing Android: [android-replacement.md](docs/android-replacement.md),
  [android14-dsu.md](docs/android14-dsu.md) (Android 14 GSI trial through DSU)
- [external-networking.md](docs/external-networking.md)

## Credits and services

- **Original project:** this is a fork of [wesbos/photo-frame-dashboard](https://github.com/wesbos/photo-frame-dashboard)
  by [Wes Bos](https://github.com/wesbos). The Home HQ dashboard, the frame unlock research in
  `docs/`, and the [community builds](docs/community-builds.md) come from his work and the
  contributors listed in the [original repository](https://github.com/wesbos/photo-frame-dashboard/graphs/contributors).
  Fork changes (modern restyle, timers and voice commands, lock-screen timer countdown, Eufy live
  bridge setup) are by [Agilan Gowthaman](https://github.com/agilang).
- **Inspiration:** the family-calendar-on-a-photo-frame idea follows commercial wall displays such as
  [Skylight Calendar](https://www.skylightframe.com/), rebuilt here as an open, self-hosted dashboard.

- [Open-Meteo](https://open-meteo.com/) provides weather forecasts and city geocoding.
- [Finnhub](https://finnhub.io/) provides stock quotes; availability, delay, and rate limits depend
  on the account and exchange.
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) runs the optional chat
  assistant. The default model is from [Meta Llama](https://www.llama.com/).
- [Google APIs](https://developers.google.com/) provide the optional Calendar and Tasks integration.
- [ha-eufy-sdk-bridge](https://github.com/mega-yfue/ha-eufy-sdk-bridge) and
  [go2rtc](https://github.com/AlexxIT/go2rtc) enable optional local-network Eufy camera playback.
- [Geist](https://vercel.com/font) and [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) are self-hosted (SIL Open Font License).
- The optional music screen embeds media using the official [YouTube](https://www.youtube.com/)
  and [Spotify](https://open.spotify.com/) players. Playback and account restrictions are set by
  those providers.
- The starter slideshow uses sample images from [Picsum Photos](https://picsum.photos/). Add your own
  images for a private family slideshow; see the [photo setup](#live-services).

## Privacy

`backups/`, `diagnostics/`, `log/`, loader query output and machine-local settings are excluded by
`.gitignore`. They hold full flash dumps, decompiled vendor code, signing keys, and the unit's
identifiers. Do not commit them, and do not publish dumps or vendor APKs.
