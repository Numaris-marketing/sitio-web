// Vercel Serverless Function — Zoho CRM Pipeline Marketing
// GET /api/zoho-pipeline
// Uses pre-filtered Zoho search to stay within 30s timeout

import https from "https";

const ZOHO_BASE = "www.zohoapis.com";
const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";

// Excluded accounts (Tip, Mstar)
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

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────
function zohoRequest(hostname, path, method = "GET", body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON: ${data.slice(0, 300)}`)); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function refreshToken() {
  const body = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  }).toString();
  const d = await zohoRequest(ZOHO_ACCOUNTS_HOST, "/oauth/v2/token", "POST", body);
  if (!d.access_token) throw new Error(`OAuth: ${JSON.stringify(d)}`);
  return d.access_token;
}

// Fetch with pre-filter criteria — much faster than fetching all records
async function fetchFiltered(module, fields, criteria, token) {
  const results = [];
  let page = 1;
  while (true) {
    const qs = `per_page=200&page=${page}&fields=${fields}&criteria=${criteria}`;
    const d = await zohoRequest(ZOHO_BASE, `/crm/v2/${module}/search?${qs}`, "GET", null, token);
    const batch = d.data || [];
    results.push(...batch);
    if (!d.info?.more_records) break;
    page++;
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}

function dealValue(d) {
  return d.Annual_Contract_Value || d.Amount || 0;
}
function getAccId(d) {
  return typeof d.Account_Name === "object" ? d.Account_Name?.id : null;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const token = await refreshToken();

    // Pre-filter at Zoho API level — only fetch what we need
    // Deals: active stages only
    const dealCriteria = encodeURIComponent(
      "((Stage:equals:Levantamiento de necesidades)or" +
      "(Stage:equals:Presentación con enfoque a solicitud)or" +
      "(Stage:equals:Prueba Demo)or" +
      "(Stage:equals:Negociación)or" +
      "(Stage:equals:Formalización)or" +
      "(Stage:equals:Contrato firmado))"
    );
    // Accounts: Prospecto type only
    const accCriteria = encodeURIComponent("(Account_Type:equals:Prospecto)");

    const [activeDealsRaw, prospAccounts] = await Promise.all([
      fetchFiltered("Deals",
        "Deal_Name,Stage,Amount,Annual_Contract_Value,Account_Name,Campa_a,Cantidad_de_suscripciones",
        dealCriteria, token),
      fetchFiltered("Accounts",
        "id,Account_Name,Account_Type,Se_obtuvo_por,Sector,Vertical,Industry",
        accCriteria, token),
    ]);

    // Build account index (Prospecto only)
    const accountById = {};
    const marketingAccIds = new Set();
    for (const acc of prospAccounts) {
      accountById[acc.id] = acc;
      if (MARKETING_SOURCES.has(acc.Se_obtuvo_por) && !EXCLUDED_ACCOUNT_IDS.has(acc.id)) {
        marketingAccIds.add(acc.id);
      }
    }

    // Further filter deals: must be Prospecto account and not excluded
    const activeDeals = activeDealsRaw.filter((d) => {
      const accId = getAccId(d);
      if (EXCLUDED_ACCOUNT_IDS.has(accId)) return false;
      const acc = accountById[accId];
      // If account found and not Prospecto → exclude
      // If account not in our Prospecto list → it's a different type → exclude
      if (!acc) return false; // unknown account not in Prospecto list
      return true;
    });

    // Marketing deals
    const marketingDeals = activeDeals.filter(
      (d) => marketingAccIds.has(getAccId(d)) || d.Campa_a
    );

    // Metrics
    const totalPipeline = activeDeals.reduce((s, d) => s + dealValue(d), 0);
    const mktPipeline = marketingDeals.reduce((s, d) => s + dealValue(d), 0);
    const oppPct = activeDeals.length > 0
      ? (marketingDeals.length / activeDeals.length) * 100 : 0;
    const valPct = totalPipeline > 0 ? (mktPipeline / totalPipeline) * 100 : 0;

    // By stage
    const byStage = {};
    for (const d of marketingDeals) {
      const s = d.Stage || "Sin etapa";
      if (!byStage[s]) byStage[s] = { count: 0, value: 0, subs: 0 };
      byStage[s].count++;
      byStage[s].value += dealValue(d);
      byStage[s].subs += d.Cantidad_de_suscripciones || 0;
    }

    // By source
    const bySource = {};
    for (const d of marketingDeals) {
      const src = accountById[getAccId(d)]?.Se_obtuvo_por || "Campaña";
      if (!bySource[src]) bySource[src] = { count: 0, value: 0 };
      bySource[src].count++;
      bySource[src].value += dealValue(d);
    }

    // Total by stage
    const totalByStage = {};
    for (const d of activeDeals) {
      const s = d.Stage || "Sin etapa";
      if (!totalByStage[s]) totalByStage[s] = { count: 0, value: 0 };
      totalByStage[s].count++;
      totalByStage[s].value += dealValue(d);
    }

    // By industry — total active deals grouped by Account Industry field
    const totalByIndustry = {};
    for (const d of activeDeals) {
      const ind = accountById[getAccId(d)]?.Industry || "Sin industria";
      if (!totalByIndustry[ind]) totalByIndustry[ind] = { count: 0, value: 0 };
      totalByIndustry[ind].count++;
      totalByIndustry[ind].value += dealValue(d);
    }

    // By industry — marketing deals
    const mktByIndustry = {};
    for (const d of marketingDeals) {
      const ind = accountById[getAccId(d)]?.Industry || "Sin industria";
      if (!mktByIndustry[ind]) mktByIndustry[ind] = { count: 0, value: 0 };
      mktByIndustry[ind].count++;
      mktByIndustry[ind].value += dealValue(d);
    }

    // Combined industry view: each industry with total + mkt + participation %
    const byIndustry = {};
    for (const ind of new Set([...Object.keys(totalByIndustry), ...Object.keys(mktByIndustry)])) {
      const tot = totalByIndustry[ind] || { count: 0, value: 0 };
      const mkt = mktByIndustry[ind] || { count: 0, value: 0 };
      byIndustry[ind] = {
        totalCount: tot.count,
        totalValue: Math.round(tot.value),
        mktCount: mkt.count,
        mktValue: Math.round(mkt.value),
        oppPct: tot.count > 0 ? Math.round((mkt.count / tot.count) * 1000) / 10 : 0,
        valPct: tot.value > 0 ? Math.round((mkt.value / tot.value) * 1000) / 10 : 0,
      };
    }

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveDeals: activeDeals.length,
        totalPipelineValue: Math.round(totalPipeline),
        marketingDeals: marketingDeals.length,
        marketingPipelineValue: Math.round(mktPipeline),
        marketingPct: Math.round(oppPct * 10) / 10,
        marketingValPct: Math.round(valPct * 10) / 10,
      },
      byStage,
      totalByStage,
      bySource,
      byIndustry,
    });

  } catch (err) {
    console.error("zoho-pipeline:", err.message);
    res.status(500).json({ error: err.message });
  }
}
