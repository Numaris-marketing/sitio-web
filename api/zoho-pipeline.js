// Vercel Serverless Function — Zoho CRM Pipeline Marketing
// GET /api/zoho-pipeline
// Returns real-time pipeline metrics for Marketing-sourced opportunities

const https = require("https");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ZOHO_BASE = "www.zohoapis.com";
const ZOHO_ACCOUNTS_URL = "accounts.zoho.com";

// Active pipeline stages — nuevos negocios (Prospecto)
const ACTIVE_STAGES = new Set([
  "Levantamiento de necesidades",
  "Presentación con enfoque a solicitud",
  "Prueba Demo",
  "Negociación",
  "Formalización",
  "Contrato firmado",
]);

// Accounts to exclude (Tip, Mstar — though they're Clientes, exclude explicitly)
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
function zohoGet(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: ZOHO_BASE,
      path,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON parse error: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
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

  return new Promise((resolve, reject) => {
    const options = {
      hostname: ZOHO_ACCOUNTS_URL,
      path: `/oauth/v2/token?${params.toString()}`,
      method: "POST",
      headers: { "Content-Length": 0 },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (!data.access_token)
            throw new Error(`No access_token: ${body.slice(0, 200)}`);
          resolve(data.access_token);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function fetchAllPages(module, fields, token) {
  const results = [];
  let page = 1;
  while (true) {
    const path = `/crm/v2/${module}?per_page=200&page=${page}&fields=${fields}`;
    const data = await zohoGet(path, token);
    const batch = data.data || [];
    results.push(...batch);
    if (!data.info?.more_records) break;
    page++;
    // Small delay to respect Zoho rate limits (10 req/s per org)
    await new Promise((r) => setTimeout(r, 120));
  }
  return results;
}

function dealValue(d) {
  return d.Annual_Contract_Value || d.Amount || 0;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5 min cache

  try {
    // 1. Get fresh access token
    const token = await refreshAccessToken();

    // 2. Fetch Deals + Accounts in parallel
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

    // 3. Build account index
    const marketingAccIds = new Set(); // marketing + Prospecto
    const accountById = {};
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

    // 4. Filter active deals:
    //    - Stage must be in ACTIVE_STAGES (nuevos negocios activos)
    //    - Account_Type must be Prospecto
    //    - Exclude Tip / Mstar accounts
    const activeDeals = allDeals.filter((d) => {
      if (!ACTIVE_STAGES.has(d.Stage || "")) return false;
      const accId =
        typeof d.Account_Name === "object" ? d.Account_Name?.id : null;
      if (EXCLUDED_ACCOUNT_IDS.has(accId)) return false;
      const acc = accountById[accId];
      if (acc && acc.Account_Type !== "Prospecto") return false;
      return true;
    });

    // 5. Filter marketing deals from active deals
    const marketingDeals = activeDeals.filter((d) => {
      const accId =
        typeof d.Account_Name === "object" ? d.Account_Name?.id : null;
      return marketingAccIds.has(accId) || d.Campa_a;
    });

    // 6. Aggregate metrics
    const totalPipeline = activeDeals.reduce((s, d) => s + dealValue(d), 0);
    const mktPipeline = marketingDeals.reduce((s, d) => s + dealValue(d), 0);
    const mktPct = totalPipeline > 0 ? (mktPipeline / totalPipeline) * 100 : 0;

    // 7. By stage
    const byStage = {};
    for (const d of marketingDeals) {
      const stage = d.Stage || "Sin etapa";
      if (!byStage[stage])
        byStage[stage] = { count: 0, value: 0, subs: 0 };
      byStage[stage].count++;
      byStage[stage].value += dealValue(d);
      byStage[stage].subs += d.Cantidad_de_suscripciones || 0;
    }

    // 8. By source
    const bySource = {};
    for (const d of marketingDeals) {
      const accId =
        typeof d.Account_Name === "object" ? d.Account_Name?.id : null;
      const src = accountById[accId]?.Se_obtuvo_por || "Campaña";
      if (!bySource[src]) bySource[src] = { count: 0, value: 0 };
      bySource[src].count++;
      bySource[src].value += dealValue(d);
    }

    // 9. Total pipeline by stage (for all active deals — for reference)
    const totalByStage = {};
    for (const d of activeDeals) {
      const stage = d.Stage || "Sin etapa";
      if (!totalByStage[stage])
        totalByStage[stage] = { count: 0, value: 0 };
      totalByStage[stage].count++;
      totalByStage[stage].value += dealValue(d);
    }

    // 10. Respond
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveDeals: activeDeals.length,
        totalPipelineValue: Math.round(totalPipeline),
        marketingDeals: marketingDeals.length,
        marketingPipelineValue: Math.round(mktPipeline),
        marketingPct: Math.round(mktPct * 10) / 10,
      },
      byStage,
      totalByStage,
      bySource,
    });
  } catch (err) {
    console.error("zoho-pipeline error:", err);
    res.status(500).json({ error: err.message });
  }
};
