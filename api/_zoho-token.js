import https from "https";

const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";
const TOKEN_TTL_MS = 54 * 60 * 1000; // 54 min

let _memCache = null;   // { token, expiresAt }
let _inFlight  = null;  // dedup: only one OAuth call at a time

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
        catch (e) { reject(new Error("OAuth JSON parse error")); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function fetchFreshToken() {
  const body = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type:    "refresh_token",
  }).toString();

  const d = await zohoPost("/oauth/v2/token", body);
  if (!d?.access_token) throw new Error(`OAuth failed: ${JSON.stringify(d)}`);

  _memCache = { token: d.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return d.access_token;
}

export async function getZohoToken() {
  // 0. Direct override — set ZOHO_ACCESS_TOKEN in Vercel env to bypass OAuth entirely
  if (process.env.ZOHO_ACCESS_TOKEN) return process.env.ZOHO_ACCESS_TOKEN;

  // 1. In-memory cache
  if (_memCache && _memCache.expiresAt > Date.now() + 60_000) return _memCache.token;

  // 2. Deduplicate: if an OAuth call is already in flight, wait for it
  if (_inFlight) return _inFlight;

  // 3. Single OAuth call
  _inFlight = fetchFreshToken().finally(() => { _inFlight = null; });
  return _inFlight;
}
