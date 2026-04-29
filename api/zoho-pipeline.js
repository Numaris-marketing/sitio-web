// Vercel Serverless Function — Zoho CRM Pipeline Marketing
// GET /api/zoho-pipeline

import https from "https";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ZOHO_BASE = "www.zohoapis.com";
const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";

// Active pipeline stages for nuevos negocios (Prospecto)
const ACTIVE_STAGES = new Set([
  "Levantamiento de necesidades",
  "Presentación con enfoque a solicitud",
  "Prueba Demo",
  "Negociación",
  "Formalización",
  "Contrato firmado",
]);

// Accounts to exclude explicitly (Tip, Mstar)
const EXCLUDED_ACCOUNT_IDS = new Set([
  "5991927000007362830", // TIP AUTO
  "5991927000065276241", // MSTAR INNOVATION
]);

const MARKETING_SOURCES = new Set([
  "Google Ads - Pauta",
  "LinkedIn Sales Navigator",
  "Prospección LinkedIn",
  "Expo como expositor (agregar etiqueta de Expo)",
  "Expo como visitante (agregar etiqueta de Expo)",
  "WhatsApp - Numaris",
  "Campaña de mailing",
  "Meta - Pauta",
  "Formulario website",
  "Prospección Facebook",
  "Prospección Instagram",
  "Newsletter LinkedIn",
  "Linkedin - Pauta",
]);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function httpsGet(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse: ${body.slice(0, 200)}`)); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function httpsPost(hostname, path, params) {
  return new Promise((resolve, reject) => {
    const body = params.toString();
    const options = {
      hostname,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse: ${data.slice(0, 200)}`)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function refreshAccessToken() {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const data = await httpsPost(ZOHO_ACCOUNTS_HOST, "/oauth/v2/token", params);
  if (!data.access_token)
    throw new Error(`No access_token: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function fetchAllPages(module, fields, token) {
  const results = [];
  let page = 1;
  while (true) {
    const path = `/crm/v2/${module}?per_page=200&page=${page}&fields=${encodeURIComponent(fields)}`;
    const data = await httpsGet(ZOHO_BASE, path, token);
    const batch = data.data || [];
    results.push(...batch);
    if (!data.info?.more_records) break;
    page++;
    await new Promise((r) => setTimeout(r, 120));
  }
  return results;
}

function dealValue(d) {
  return d.Annual_Contract_Value || d.Amount || 0;
}

function getAccId(d) {
  return typeof d.Account_Name === "object" ? d.Account_Name?.id : null;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const token = await refreshAccessToken();

    // Fetch Deals + Accounts in parallel
    const [allDeals, allAccounts] = await Promise.all([
      fetchAllPages(
        "Deals",
        "Deal_Name,Stage,Amount,Annual_Contract_Value,Account_Name,Campa_a,Cantidad_de_suscripciones",
        token
      ),
      fetchAllPages(
        "Accounts",
        "id,Account_Name,Account_Type,Se_obtuvo_por,Sector,Vertical",
        token
      ),
    ]);

    // Build account index
    const accountById = {};
    const marketingAccIds = new Set();
    for (const acc of allAccounts) {
      accountById[acc.id] = acc;
      if (
        MARKETING_SOURCES.has(acc.Se_obtuvo_por) &&
        acc.Account_Type === "Prospecto" &&
        !EXCLUDED_ACCOUNT_IDS.has(acc.id)
      ) {
        marketingAccIds.add(acc.id);
      }
    }

    // Filter active deals: active stage + Prospecto + not excluded
    const activeDeals = allDeals.filter((d) => {
      if (!ACTIVE_STAGES.has(d.Stage || "")) return false;
      const accId = getAccId(d);
      if (EXCLUDED_ACCOUNT_IDS.has(accId)) return false;
      const acc = accountById[accId];
      if (acc && acc.Account_Type !== "Prospecto") return false;
      return true;
    });

    // Filter marketing deals
    const marketingDeals = activeDeals.filter(
      (d) => marketingAccIds.has(getAccId(d)) || d.Campa_a
    );

    // Aggregate
    const totalPipeline = activeDeals.reduce((s, d) => s + dealValue(d), 0);
    const mktPipeline = marketingDeals.reduce((s, d) => s + dealValue(d), 0);
    const oppPct = activeDeals.length > 0
      ? (marketingDeals.length / activeDeals.length) * 100 : 0;
    const valPct = totalPipeline > 0 ? (mktPipeline / totalPipeline) * 100 : 0;

    // By stage
    const byStage = {};
    for (const d of marketingDeals) {
      const stage = d.Stage || "Sin etapa";
      if (!byStage[stage]) byStage[stage] = { count: 0, value: 0, subs: 0 };
      byStage[stage].count++;
      byStage[stage].value += dealValue(d);
      byStage[stage].subs += d.Cantidad_de_suscripciones || 0;
    }

    // By source
    const bySource = {};
    for (const d of marketingDeals) {
      const accId = getAccId(d);
      const src = accountById[accId]?.Se_obtuvo_por || "Campaña";
      if (!bySource[src]) bySource[src] = { count: 0, value: 0 };
      bySource[src].count++;
      bySource[src].value += dealValue(d);
    }

    // Total by stage
    const totalByStage = {};
    for (const d of activeDeals) {
      const stage = d.Stage || "Sin etapa";
      if (!totalByStage[stage]) totalByStage[stage] = { count: 0, value: 0 };
      totalByStage[stage].count++;
      totalByStage[stage].value += dealValue(d);
    }

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveDeals: activeDeals.length,
        totalPipelineValue: Math.round(totalPipeline),
        marketingDeals: marketingDeals.length,
        marketingPipelineValue: Math.round(mktPipeline),
        marketingPct: Math.round(oppPct * 10) / 10,   // % by count
        marketingValPct: Math.round(valPct * 10) / 10, // % by value
      },
      byStage,
      totalByStage,
      bySource,
    });

  } catch (err) {
    console.error("zoho-pipeline error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
