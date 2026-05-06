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

// Industry classification by Account Owner (Propietario de la cuenta)
// Exact names as they appear in Zoho CRM
const OWNER_TO_INDUSTRY = {
  // Transporte Pesado
  "Jose Guadalupe Castillo Olvera": "Transporte Pesado",
  "Lorena Bolaños Cacho":           "Transporte Pesado",
  "Mario Rincón":                   "Transporte Pesado",
  "Daniel Ocampo":                  "Transporte Pesado",
  "Uriel San Pedro Lopez":          "Transporte Pesado",

  // Logística y Distribución
  "Karen Andrea Gonzalez Ramirez":      "Logística y Distribución",
  "Diana Aylin Rodriguez Ornelas":      "Logística y Distribución",
  "Andrea Quinones":                    "Logística y Distribución",
  "Elizabeth Alejandra Pineda Gonzalez":"Logística y Distribución",
  "Joel Araiza":                        "Logística y Distribución",
  "Juan Alejandro Duarte Delgadillo":   "Logística y Distribución",

  // Servicios Financieros y Movilidad
  "Orlak Efrain Castañeda Diaz":  "Servicios Financieros y Movilidad",
  "Marleem Hernandez Martinez":   "Servicios Financieros y Movilidad",
  "Hanna Vazquez":                "Servicios Financieros y Movilidad",
  "Alan Badillo":                 "Servicios Financieros y Movilidad",
  "Guillermo Quijano":            "Servicios Financieros y Movilidad",

  // Administración de Flota
  "David Urieta":                  "Administración de Flota",
  "Lorena Ruiz":                   "Administración de Flota",
  "Iris Morales":                  "Administración de Flota",
  "Abigail Juarez":                "Administración de Flota",
  "Gabriela Abigail Juarez Perez": "Administración de Flota", // nombre exacto en CRM
};

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

// Fetch all records from a module without search criteria (uses list endpoint)
async function zohoGetAll(module, fields, token) {
  const results = [];
  let page = 1;
  while (true) {
    const qs = `per_page=200&page=${page}&fields=${fields}`;
    const d = await zohoRequest(ZOHO_BASE, `/crm/v2/${module}?${qs}`, "GET", null, token);
    const batch = d.data || [];
    if (batch.length === 0) break;
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

    // Separate criteria for campaign deals — includes ALL stages (active + won + lost)
    // so we capture expo deals regardless of their current stage
    const campDealCriteria = encodeURIComponent(
      "((Stage:equals:Levantamiento de necesidades)or" +
      "(Stage:equals:Presentación con enfoque a solicitud)or" +
      "(Stage:equals:Prueba Demo)or" +
      "(Stage:equals:Negociación)or" +
      "(Stage:equals:Formalización)or" +
      "(Stage:equals:Contrato firmado)or" +
      "(Stage:equals:Venta realizada))"
    );

    const [activeDealsRaw, prospAccounts, campDealsRaw] = await Promise.all([
      fetchFiltered("Deals",
        "Deal_Name,Stage,Amount,Annual_Contract_Value,Account_Name,Campa_a,Cantidad_de_suscripciones",
        dealCriteria, token),
      fetchFiltered("Accounts",
        "id,Account_Name,Account_Type,Se_obtuvo_por,Owner",
        accCriteria, token),
      fetchFiltered("Deals",
        "Deal_Name,Stage,Amount,Annual_Contract_Value,Account_Name,Campa_a,Campaign_Source,Cantidad_de_suscripciones,Closing_Date",
        campDealCriteria, token),
    ]);

    // No campaigns module fetch needed — derive campaign catalog from deal Campa_a objects
    const campaigns = [];

    // Build campaign lookup by id (empty — derived from deals)
    const campaignById = {};

    // Build account index (Prospecto only)
    const accountById = {};
    const marketingAccIds = new Set();
    const accountIndustry = {}; // acc.id → industry label via owner mapping
    for (const acc of prospAccounts) {
      accountById[acc.id] = acc;
      const ownerName = typeof acc.Owner === "object" ? (acc.Owner?.name || "") : (acc.Owner || "");
      accountIndustry[acc.id] = OWNER_TO_INDUSTRY[ownerName] || "Sin asignar";
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
      if (!totalByStage[s]) totalByStage[s] = { count: 0, value: 0, subs: 0 };
      totalByStage[s].count++;
      totalByStage[s].value += dealValue(d);
      totalByStage[s].subs += d.Cantidad_de_suscripciones || 0;
    }

    // By industry — total active deals grouped by Account Owner → industry mapping
    const totalByIndustry = {};
    for (const d of activeDeals) {
      const accId = getAccId(d);
      const ind = accountIndustry[accId] || "Sin asignar";
      if (!totalByIndustry[ind]) totalByIndustry[ind] = { count: 0, value: 0 };
      totalByIndustry[ind].count++;
      totalByIndustry[ind].value += dealValue(d);
    }

    // By industry — marketing deals
    const mktByIndustry = {};
    for (const d of marketingDeals) {
      const accId = getAccId(d);
      const ind = accountIndustry[accId] || "Sin asignar";
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

    // By campaign — uses campDealsRaw which includes ALL stages (active + Venta realizada)
    // so expo deals are captured regardless of current stage.
    // Campaign catalog is derived directly from Campa_a objects on deals (no module fetch needed).
    const ACTIVE_STAGES = new Set([
      "Levantamiento de necesidades",
      "Presentación con enfoque a solicitud",
      "Prueba Demo",
      "Negociación",
      "Formalización",
      "Contrato firmado",
    ]);

    const byCampaign = {};
    for (const d of campDealsRaw) {
      const accId = getAccId(d);
      if (EXCLUDED_ACCOUNT_IDS.has(accId)) continue;

      // Check both the custom lookup field (Campa_a) and the standard Zoho campaign field (Campaign_Source)
      const camp = d.Campa_a || d.Campaign_Source;
      if (!camp) continue;
      const campId   = typeof camp === "object" ? camp.id   : camp;
      const campName = typeof camp === "object" ? camp.name : camp;
      if (!campId) continue;

      const isActive = ACTIVE_STAGES.has(d.Stage);
      const isWon    = d.Stage === "Venta realizada";

      if (!byCampaign[campId]) {
        byCampaign[campId] = {
          name:         campName,
          count:        0, value:      0, subs:     0,  // active pipeline
          wonCount:     0, wonValue:   0,                 // closed/won
          totalCount:   0, totalValue: 0,                 // all combined
        };
      }

      const v = dealValue(d);
      const s = d.Cantidad_de_suscripciones || 0;

      byCampaign[campId].totalCount++;
      byCampaign[campId].totalValue += v;

      if (isActive) {
        byCampaign[campId].count++;
        byCampaign[campId].value += v;
        byCampaign[campId].subs  += s;
      } else if (isWon) {
        byCampaign[campId].wonCount++;
        byCampaign[campId].wonValue += v;
      }
    }

    // Debug — check both campaign fields
    const dealsWithCamp = campDealsRaw.filter(d => (d.Campa_a || d.Campaign_Source) && !EXCLUDED_ACCOUNT_IDS.has(getAccId(d))).length;
    const wonDealsWithCamp = campDealsRaw.filter(d => (d.Campa_a || d.Campaign_Source) && d.Stage === "Venta realizada" && !EXCLUDED_ACCOUNT_IDS.has(getAccId(d))).length;
    const sampleCampSrc = campDealsRaw.find(d => d.Campaign_Source) || null;
    const sampleCampa   = campDealsRaw.find(d => d.Campa_a) || null;

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveDeals: activeDeals.length,
        totalPipelineValue: Math.round(totalPipeline),
        marketingDeals: marketingDeals.length,
        marketingPipelineValue: Math.round(mktPipeline),
        marketingPct: Math.round(oppPct * 10) / 10,
        marketingValPct: Math.round(valPct * 10) / 10,
        marketingSubs: Object.values(byStage).reduce((acc, s) => acc + (s.subs || 0), 0),
        totalSubs: activeDeals.reduce((acc, d) => acc + (d.Cantidad_de_suscripciones || 0), 0),
      },
      byStage,
      totalByStage,
      bySource,
      byIndustry,
      byCampaign,
      debug: {
        dealsWithCampaign:    dealsWithCamp,
        wonDealsWithCampaign: wonDealsWithCamp,
        campDealsRawTotal:    campDealsRaw.length,
        activeDealsRawTotal:  activeDealsRaw.length,
        sampleCampa_aDeal:    sampleCampa,
        sampleCampaignSrcDeal: sampleCampSrc,
      },
    });

  } catch (err) {
    console.error("zoho-pipeline:", err.message);
    res.status(500).json({ error: err.message });
  }
}
