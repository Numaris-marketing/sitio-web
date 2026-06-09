// api/pipeline-snapshot.js
// Stores and retrieves daily Pipeline ACV snapshots
//
// GET  /api/pipeline-snapshot          → returns last 90 days of snapshots
// POST /api/pipeline-snapshot          → takes snapshot from Zoho (called by Vercel Cron)
//
// Requires Vercel KV connected in your project dashboard:
//   vercel.com → project → Storage → Connect KV store
//   Env vars injected automatically: KV_REST_API_URL, KV_REST_API_TOKEN

import { kv } from "@vercel/kv";
import https from "https";

export const config = { maxDuration: 30 };

const SNAPSHOT_PREFIX = "pipeline:snap:";
const MAX_DAYS = 90;

// Stage label mapping — Zoho names → display names
const STAGE_DISPLAY = {
  "Levantamiento de necesidades":          "Levantamiento",
  "Presentación con enfoque a solicitud":  "Presentación",
  "Prueba Demo":                           "Prueba Demo",
  "Negociación":                           "Negociación",
  "Formalización":                         "Formalización",
  "Contrato firmado":                      "Contrato firmado",
};

// ─── helpers ────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function dateLabel(isoDate) {
  const [, m, d] = isoDate.split("-");
  const months = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[+m]} ${+d}`;
}

// ─── Zoho token ─────────────────────────────────────────────────────────────
function fetchZohoToken() {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    });
    const req = https.request(
      { hostname: "accounts.zoho.com", path: `/oauth/v2/token?${params}`, method: "POST" },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve(JSON.parse(raw).access_token); } catch { reject(new Error(raw)); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// ─── Zoho deals fetch ────────────────────────────────────────────────────────
function fetchDeals(token, criteria, fields) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      criteria,
      fields,
      per_page: "200",
      page: "1",
    });
    const req = https.request(
      {
        hostname: "www.zohoapis.com",
        path: `/crm/v2/Deals/search?${params}`,
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(raw);
            resolve(j.data || []);
          } catch { resolve([]); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// ─── Build snapshot from Zoho data ──────────────────────────────────────────
async function buildTodaySnapshot() {
  const token = await fetchZohoToken();
  const stages = Object.keys(STAGE_DISPLAY);
  const criteria =
    "(" +
    stages.map((s) => `(Stage:equals:${s})`).join("or") +
    ")";

  const deals = await fetchDeals(
    token,
    criteria,
    "Deal_Name,Stage,Amount,Annual_Contract_Value"
  );

  const byStage = {};
  for (const s of stages) byStage[s] = 0;

  for (const d of deals) {
    const v = (d.Annual_Contract_Value || d.Amount || 0);
    if (byStage[d.Stage] !== undefined) byStage[d.Stage] += v;
  }

  // Convert to MX$M rounded to 1 decimal, keyed by display name
  const result = {};
  for (const [zohoStage, displayStage] of Object.entries(STAGE_DISPLAY)) {
    result[displayStage] = Math.round((byStage[zohoStage] / 1e6) * 10) / 10;
  }
  return result;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  // ── GET: return historical snapshots ──────────────────────────────────────
  if (req.method === "GET") {
    const keys = [];
    for (let i = MAX_DAYS - 1; i >= 0; i--) keys.push(SNAPSHOT_PREFIX + dateKey(i));

    let snapMap = {};
    try {
      // Batch get all keys
      const values = await kv.mget(...keys);
      keys.forEach((k, idx) => {
        if (values[idx]) snapMap[k] = values[idx];
      });
    } catch (e) {
      return res.status(500).json({ error: "KV read failed: " + e.message });
    }

    // Build ordered timeline (only dates that have data)
    const timeline = [];
    for (let i = MAX_DAYS - 1; i >= 0; i--) {
      const iso = dateKey(i);
      const val = snapMap[SNAPSHOT_PREFIX + iso];
      if (val) timeline.push({ date: iso, label: dateLabel(iso), stages: val });
    }

    return res.json({ timeline });
  }

  // ── POST: take snapshot (called by Vercel Cron or manual trigger) ─────────
  if (req.method === "POST") {
    // Verify cron secret header (Vercel sets Authorization: Bearer <CRON_SECRET>)
    const authHeader = req.headers["authorization"] || "";
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const snapshot = await buildTodaySnapshot();
      const key = SNAPSHOT_PREFIX + todayKey();
      await kv.set(key, snapshot, { ex: MAX_DAYS * 24 * 3600 }); // expire after MAX_DAYS
      return res.json({ ok: true, date: todayKey(), snapshot });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
