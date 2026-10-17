function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(message, status = 503) {
  return json({ error: message }, status);
}

async function googleAccessToken(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("Google Calendar and Tasks are not configured");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("Google authorization failed");
  return (await response.json()).access_token;
}

async function googleApi(env, path, options = {}) {
  const token = await googleAccessToken(env);
  const headers = { Authorization: `Bearer ${token}` };
  const request = { method: options.method || "GET", headers };
  if (options.body) {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...request,
  });
  if (!response.ok) throw new Error("Google API request failed");
  return response.json();
}

function normalizeGoogleEvent(event) {
  const allDay = !!(event.start && event.start.date);
  return {
    id: event.id,
    title: event.summary || "Untitled event",
    start: allDay ? `${event.start.date}T00:00:00` : event.start.dateTime,
    end: allDay ? `${event.end.date}T00:00:00` : event.end.dateTime,
    allDay,
    people: ["family"],
    loc: event.location || "",
    notes: event.description || "",
    source: "google",
  };
}

async function googleCalendar(request, env) {
  const url = new URL(request.url);
  const start = new Date(url.searchParams.get("timeMin") || Date.now());
  const end = new Date(url.searchParams.get("timeMax") || Date.now() + 60 * 86400000);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start >= end) {
    return failure("Invalid calendar date range", 400);
  }
  const query = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });
  const data = await googleApi(env, `/calendar/v3/calendars/primary/events?${query}`);
  return json({
    events: (data.items || []).map(normalizeGoogleEvent),
  });
}

async function createGoogleEvent(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid event data", 400);
  }
  const start = new Date(body.start);
  const end = new Date(body.end);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || !Number.isFinite(+start) || !Number.isFinite(+end) || start >= end) {
    return failure("A title and valid event time range are required", 400);
  }
  const event = await googleApi(env, "/calendar/v3/calendars/primary/events", {
    method: "POST",
    body: {
      summary: title.slice(0, 200),
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      location: typeof body.location === "string" ? body.location.slice(0, 500) : "",
      description: typeof body.notes === "string" ? body.notes.slice(0, 8000) : "",
    },
  });
  return json({ event: normalizeGoogleEvent(event) }, 201);
}

async function googleTasks(env) {
  const lists = await googleApi(env, "/tasks/v1/users/@me/lists?maxResults=100");
  const results = await Promise.all((lists.items || []).map(async (list) => {
    const query = new URLSearchParams({ maxResults: "100", showCompleted: "true", showHidden: "true" });
    const data = await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?${query}`);
    return (data.items || []).map((task) => {
      const notes = task.notes || "";
      const marker = notes.match(/\[dashboard-chore:([a-z0-9_-]+)\]/i);
      return {
      id: task.id,
      listId: list.id,
      title: task.title || "Untitled task",
      notes: notes.replace(/\s*\[dashboard-chore:[a-z0-9_-]+\]/ig, "").trim(),
      choreId: marker ? marker[1] : null,
      due: task.due || null,
      completed: task.status === "completed",
      list: list.title || "Google Tasks",
      };
    });
  }));
  return json({ tasks: results.flat() });
}

async function createGoogleTask(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid task data", 400);
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return failure("A task title is required", 400);
  const lists = await googleApi(env, "/tasks/v1/users/@me/lists?maxResults=100");
  const listId = body.listId || (lists.items || [])[0]?.id;
  if (!listId) return failure("No Google Tasks list is available", 400);
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 8000) : "";
  const task = await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {
    method: "POST",
    body: { title: title.slice(0, 500), notes, ...(body.due ? { due: body.due } : {}) },
  });
  return json({ task: { id: task.id, listId, title: task.title, notes: task.notes || "", completed: false } }, 201);
}

async function updateGoogleTask(request, env, url) {
  const match = /^\/api\/google\/tasks\/([^/]+)\/([^/]+)$/.exec(url.pathname);
  if (!match) return failure("Invalid task URL", 400);
  const listId = decodeURIComponent(match[1]);
  const taskId = decodeURIComponent(match[2]);
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid task update", 400);
  }
  if (typeof body.completed !== "boolean") return failure("Task completion must be true or false", 400);
  const task = await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: { status: body.completed ? "completed" : "needsAction" },
  });
  return json({ completed: task.status === "completed" });
}

async function syncGoogleChores(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid chore list", 400);
  }
  if (!Array.isArray(body.chores) || body.chores.length > 100) return failure("A chore list of at most 100 items is required", 400);
  const lists = await googleApi(env, "/tasks/v1/users/@me/lists?maxResults=100");
  const listId = body.listId || (lists.items || [])[0]?.id;
  if (!listId) return failure("No Google Tasks list is available", 400);
  const existingData = await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks?maxResults=100&showCompleted=true&showHidden=true`);
  const existing = new Set((existingData.items || []).map((task) => {
    const marker = (task.notes || "").match(/\[dashboard-chore:([a-z0-9_-]+)\]/i);
    return marker ? marker[1] : null;
  }).filter(Boolean));
  let created = 0;
  for (const chore of body.chores) {
    if (!chore || !/^[a-z0-9_-]+$/i.test(chore.id || "") || typeof chore.title !== "string" || !chore.title.trim()) continue;
    if (existing.has(chore.id)) continue;
    const notes = [chore.notes || "", `[dashboard-chore:${chore.id}]`].filter(Boolean).join("\n").slice(0, 8000);
    await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {
      method: "POST",
      body: { title: chore.title.slice(0, 500), notes, status: chore.done ? "completed" : "needsAction" },
    });
    created++;
  }
  return json({ created, tasks: await googleTasksData(env) });
}

async function googleTasksData(env) {
  const lists = await googleApi(env, "/tasks/v1/users/@me/lists?maxResults=100");
  const results = await Promise.all((lists.items || []).map(async (list) => {
    const query = new URLSearchParams({ maxResults: "100", showCompleted: "true", showHidden: "true" });
    const data = await googleApi(env, `/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?${query}`);
    return (data.items || []).map((task) => {
      const notes = task.notes || "";
      const marker = notes.match(/\[dashboard-chore:([a-z0-9_-]+)\]/i);
      return {
        id: task.id,
        listId: list.id,
        title: task.title || "Untitled task",
        notes: notes.replace(/\s*\[dashboard-chore:[a-z0-9_-]+\]/ig, "").trim(),
        choreId: marker ? marker[1] : null,
        due: task.due || null,
        completed: task.status === "completed",
        list: list.title || "Google Tasks",
      };
    });
  }));
  return results.flat();
}

function homeAssistant(env) {
  if (!env.HOME_ASSISTANT_URL || !env.HOME_ASSISTANT_TOKEN) {
    throw new Error("Home Assistant is not configured");
  }
  return {
    base: env.HOME_ASSISTANT_URL.replace(/\/$/, ""),
    headers: { Authorization: `Bearer ${env.HOME_ASSISTANT_TOKEN}` },
  };
}

async function homeAssistantStates(env) {
  const { base, headers } = homeAssistant(env);
  const response = await fetch(`${base}/api/states`, { headers });
  if (!response.ok) throw new Error("Home Assistant state request failed");
  const states = await response.json();
  return json({
    entities: states.filter((item) => /^(switch|light|camera)\./.test(item.entity_id)).map((item) => ({
      entityId: item.entity_id,
      domain: item.entity_id.split(".")[0],
      name: item.attributes.friendly_name || item.entity_id,
      state: item.state,
      brightness: item.attributes.brightness,
    })),
  });
}

async function homeAssistantService(request, env) {
  const { base, headers } = homeAssistant(env);
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid request body", 400);
  }
  const match = /^(switch|light)\.([a-z0-9_]+)$/.exec(body.entityId || "");
  if (!match || !["on", "off"].includes(body.state)) {
    return failure("Only light and switch on/off commands are allowed", 400);
  }
  const service = body.state === "on" ? "turn_on" : "turn_off";
  const response = await fetch(`${base}/api/services/${match[1]}/${service}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ entity_id: body.entityId }),
  });
  if (!response.ok) throw new Error("Home Assistant service call failed");
  return json({ ok: true });
}

async function homeAssistantCamera(request, env) {
  const { base, headers } = homeAssistant(env);
  const entityId = new URL(request.url).searchParams.get("entity_id") || "";
  if (!/^camera\.[a-z0-9_]+$/.test(entityId)) return failure("Invalid camera entity", 400);
  const response = await fetch(`${base}/api/camera_proxy/${entityId}`, { headers });
  if (!response.ok) throw new Error("Home Assistant camera request failed");
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}

async function legacyEufyBridge(request, env, url) {
  if (!env.EUFY_BRIDGE_URL || !env.EUFY_BRIDGE_TOKEN) {
    throw new Error("Eufy local bridge is not configured");
  }
  const base = new URL(env.EUFY_BRIDGE_URL);
  let path;
  if (url.pathname === "/api/eufy/cameras" && request.method === "GET") {
    path = "/api/cameras";
  } else {
    const match = /^\/api\/eufy\/cameras\/([a-f0-9]{20})\/snapshot$/.exec(url.pathname);
    if (!match || request.method !== "GET") return failure("Not found", 404);
    path = `/api/cameras/${match[1]}/snapshot`;
    if (url.searchParams.get("live") === "1") path += "?live=1";
  }
  const response = await fetch(new URL(path, base), {
    headers: { Authorization: `Bearer ${env.EUFY_BRIDGE_TOKEN}` },
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function eufyBridgeConfig(env) {
  const bridgeUrl = env.EUFY_LIVE_BRIDGE_BROWSER_URL;
  const go2rtcUrl = env.EUFY_GO2RTC_BROWSER_URL;
  if (!bridgeUrl || !go2rtcUrl) throw new Error("Eufy live bridge browser URLs are not configured");
  const parseUrl = (value) => {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error("Eufy bridge URLs must be HTTP(S) URLs without embedded credentials");
    }
    return parsed.origin;
  };
  return json({ bridgeUrl: parseUrl(bridgeUrl), go2rtcUrl: parseUrl(go2rtcUrl) });
}

async function eufyLiveBridge(request, env, url) {
  if (url.pathname === "/api/eufy/config" && request.method === "GET") {
    return eufyBridgeConfig(env);
  }
  const match = /^\/api\/eufy\/cameras\/([A-Za-z0-9_-]{1,64})\/snapshot$/.exec(url.pathname);
  if (!match || request.method !== "GET") return failure("Not found", 404);
  if (!env.EUFY_LIVE_BRIDGE_URL) throw new Error("Eufy live bridge URL is not configured");

  const base = new URL(env.EUFY_LIVE_BRIDGE_URL);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("Eufy live bridge URL must be HTTP(S) without embedded credentials");
  }
  const mode = url.searchParams.get("mode") || "auto";
  if (!["auto", "live", "stored"].includes(mode)) return failure("Invalid snapshot mode", 400);
  const upstreamUrl = new URL(`/snapshot/${encodeURIComponent(match[1])}`, base);
  upstreamUrl.searchParams.set("mode", mode);
  const response = await fetch(upstreamUrl);
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function weather(env, url) {
  const hasLatitude = url.searchParams.has("latitude");
  const hasLongitude = url.searchParams.has("longitude");
  if (hasLatitude !== hasLongitude) return failure("Latitude and longitude must be provided together", 400);
  const latitude = hasLatitude ? Number(url.searchParams.get("latitude")) : Number(env.WEATHER_LAT || "33.16262");
  const longitude = hasLongitude ? Number(url.searchParams.get("longitude")) : Number(env.WEATHER_LON || "-96.93751");
  const location = (url.searchParams.get("location") || env.WEATHER_LOCATION || "Little Elm, TX 75068").trim();
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !location || location.length > 100) {
    return failure("Invalid weather location", 400);
  }
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    forecast_days: "7",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!response.ok) throw new Error("Weather request failed");
  return json({ ...(await response.json()), location });
}

async function weatherGeocode(url) {
  const name = (url.searchParams.get("q") || "").trim();
  if (name.length < 2 || name.length > 100) return failure("Enter a city name between 2 and 100 characters", 400);
  const query = new URLSearchParams({ name, count: "8", language: "en", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`);
  if (!response.ok) throw new Error("City search failed");
  const data = await response.json();
  return json({
    results: (data.results || []).map((place) => ({
      name: place.name,
      admin1: place.admin1 || "",
      country: place.country || "",
      latitude: place.latitude,
      longitude: place.longitude,
    })),
  });
}

async function stockQuote(url, env) {
  const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) return failure("Enter a valid stock symbol", 400);
  if (!env.FINNHUB_API_KEY) return failure("Finnhub is not configured", 503);
  const query = new URLSearchParams({ symbol, token: env.FINNHUB_API_KEY });
  const response = await fetch(`https://finnhub.io/api/v1/quote?${query}`);
  if (response.status === 401 || response.status === 403) return failure("Finnhub rejected its API key", 502);
  if (response.status === 429) return failure("Finnhub rate limit reached; try again later", 429);
  if (!response.ok) return failure("Finnhub quote request failed", 502);
  let quote;
  try {
    quote = await response.json();
  } catch {
    return failure("Finnhub returned invalid quote data", 502);
  }
  if (!quote || !Number.isFinite(quote.c) || quote.c <= 0 || !Number.isFinite(quote.t) || quote.t <= 0) {
    return failure("No current quote is available for this symbol", 404);
  }
  return json({
    symbol,
    price: quote.c,
    change: Number.isFinite(quote.d) ? quote.d : null,
    percentChange: Number.isFinite(quote.dp) ? quote.dp : null,
    high: Number.isFinite(quote.h) ? quote.h : null,
    low: Number.isFinite(quote.l) ? quote.l : null,
    previousClose: Number.isFinite(quote.pc) ? quote.pc : null,
    timestamp: quote.t,
  });
}

async function youtubeSearch(url, env) {
  const queryText = (url.searchParams.get("q") || "").trim();
  if (queryText.length < 2 || queryText.length > 100) {
    return failure("Enter a song or artist between 2 and 100 characters", 400);
  }
  if (!env.YOUTUBE_API_KEY) return failure("YouTube search is not configured", 503);
  const query = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    maxResults: "8",
    q: queryText,
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${query}`);
  if (response.status === 403) return failure("YouTube search is unavailable. Check the API key, API access, and quota.", 502);
  if (!response.ok) return failure("YouTube search failed. Try again later.", 502);
  let data;
  try {
    data = await response.json();
  } catch {
    return failure("YouTube returned invalid search results", 502);
  }
  return json({
    results: (data.items || []).filter((item) => (
      typeof item?.id?.videoId === "string" &&
      typeof item?.snippet?.title === "string"
    )).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: typeof item.snippet.channelTitle === "string" ? item.snippet.channelTitle : "",
    })),
  });
}

const DEFAULT_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

async function workersAiStatus(env) {
  return json({ configured: !!env.AI, model: env.WORKERS_AI_MODEL || DEFAULT_AI_MODEL });
}

async function workersAiChat(request, env) {
  if (!env.AI) return failure("Workers AI binding is not configured", 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid chat request", 400);
  }
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 12) {
    return failure("Send between 1 and 12 messages", 400);
  }
  const messages = [];
  for (const message of body.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
      return failure("Invalid chat message", 400);
    }
    const content = message.content.trim();
    if (!content || content.length > 4000) return failure("Messages must be 1 to 4000 characters", 400);
    messages.push({ role: message.role, content });
  }
  if (messages[messages.length - 1].role !== "user") return failure("The last message must be from the user", 400);

  const model = env.WORKERS_AI_MODEL || DEFAULT_AI_MODEL;
  const result = await env.AI.run(model, {
    messages: [
      { role: "system", content: "You are a helpful, direct, concise assistant in a private family dashboard." },
      ...messages,
    ],
    max_tokens: 1024,
  });
  const text = typeof result?.response === "string" ? result.response.trim() : "";
  if (!text) return failure("Workers AI returned no text", 502);
  return json({ text, model });
}

export async function handleIntegrationApi(request, env, url) {
  try {
    if (url.pathname === "/api/google/calendar" && request.method === "GET") return await googleCalendar(request, env);
    if (url.pathname === "/api/google/calendar/events" && request.method === "POST") return await createGoogleEvent(request, env);
    if (url.pathname === "/api/google/tasks" && request.method === "GET") return await googleTasks(env);
    if (url.pathname === "/api/google/tasks" && request.method === "POST") return await createGoogleTask(request, env);
    if (/^\/api\/google\/tasks\/[^/]+\/[^/]+$/.test(url.pathname) && request.method === "PATCH") return await updateGoogleTask(request, env, url);
    if (url.pathname === "/api/google/tasks/sync-chores" && request.method === "POST") return await syncGoogleChores(request, env);
    if (url.pathname === "/api/home-assistant/states" && request.method === "GET") return await homeAssistantStates(env);
    if (url.pathname === "/api/home-assistant/service" && request.method === "POST") return await homeAssistantService(request, env);
    if (url.pathname === "/api/home-assistant/camera" && request.method === "GET") return await homeAssistantCamera(request, env);
    if (url.pathname.startsWith("/api/eufy/")) return await eufyLiveBridge(request, env, url);
    if (url.pathname === "/api/weather" && request.method === "GET") return await weather(env, url);
    if (url.pathname === "/api/weather/geocode" && request.method === "GET") return await weatherGeocode(url);
    if (url.pathname === "/api/stocks/status" && request.method === "GET") {
      return json({ configured: !!env.FINNHUB_API_KEY, provider: "Finnhub" });
    }
    if (url.pathname === "/api/stocks/quote" && request.method === "GET") return await stockQuote(url, env);
    if (url.pathname === "/api/music/search" && request.method === "GET") return await youtubeSearch(url, env);
    if (url.pathname === "/api/ai/status" && request.method === "GET") return await workersAiStatus(env);
    if (url.pathname === "/api/ai/chat" && request.method === "POST") return await workersAiChat(request, env);
    return failure("Not found", 404);
  } catch (error) {
    return failure(error.message || "Integration request failed");
  }
}