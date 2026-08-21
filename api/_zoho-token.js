// Shared Zoho OAuth token — stored in Vercel KV so all lambda instances reuse it.
// If KV is unavailable, falls back to in-memory cache (same-instance only).

import https from "https";

const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";
const TOKEN_KEY  = "zoho_access_token";
const TOKEN_TTL  = 55 * 60;        // 55 min (tokens last 60 min)

let _memCache = null; // { token, expiresAt } — warm-lambda fallback

function zohoPost(path, body) {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    };
    const req = https.request({ hostname: ZOHO_ACCOUNTS_HOST, path, method: "POST", headers }, res => {
      let data = "";
      res.on("data", c => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON: ${data.slice(0, 200)}`)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Vercel KV REST helpers (Upstash-compatible) ───────────────────────────────
function kvUrl() { return process.env.KV_REST_API_URL; }
function kvToken() { return process.env.KV_REST_API_TOKEN; }
function kvAvailable() { return !!(kvUrl() && kvToken()); }

function kvRequest(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(kvUrl());
    const headers = { Authorization: `Bearer ${kvToken()}` };
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = https.request(
      { hostname: url.hostname, path: url.pathname + path, method, headers },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    if (body) req.write(body);
    req.end();
  });
}

async function kvGet(key) {
  const r = await kvRequest(`/get/${encodeURIComponent(key)}`);
  return r?.result ?? null;
}

async function kvSet(key, value, ttlSecs) {
  const body = JSON.stringify([key, value, "EX", ttlSecs]);
  await kvRequest("/pipeline", "POST", body);
}

// ── Public: getZohoToken() ────────────────────────────────────────────────────
export async function getZohoToken() {
  const now = Date.now();

  // 1. In-memory cache (same lambda instance)
  if (_memCache && _memCache.expiresAt > now + 60_000) return _memCache.token;

  // 2. Vercel KV (shared across all instances)
  if (kvAvailable()) {
    const cached = await kvGet(TOKEN_KEY);
    if (cached) {
      _memCache = { token: cached, expiresAt: now + TOKEN_TTL * 1000 };
      return cached;
    }
  }

  // 3. Fetch a fresh token from Zoho with retry on rate-limit
  const body = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type:    "refresh_token",
  }).toString();

  let d;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000));
    d = await zohoPost("/oauth/v2/token", body);
    if (d.access_token) break;
    if (!d.error_description?.includes("too many")) throw new Error(`OAuth: ${JSON.stringify(d)}`);
  }
  if (!d?.access_token) throw new Error(`OAuth rate-limited: ${JSON.stringify(d)}`);

  // Store in KV + memory
  if (kvAvailable()) await kvSet(TOKEN_KEY, d.access_token, TOKEN_TTL);
  _memCache = { token: d.access_token, expiresAt: now + TOKEN_TTL * 1000 };

  return d.access_token;
}
