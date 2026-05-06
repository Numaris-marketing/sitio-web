// Vercel Serverless Function — Zoho CRM Conversion Funnel
// GET /api/zoho-funnel
//
// Criteria (per Zoho Analytics screenshot):
// Generados  : Leads where Source IN [3 digital] AND Owner ≠ Ricardo, Created in year
// Calificados: Generados where Status NOT IN [disqualified list]
// Citas      : Leads CONVERTED to Accounts ($converted=true), Owner ≠ Ricardo, Created in year
// Cierres    : Converted accounts with Deal Stage = "Venta realizada", Closing in year

import https from "https";

const ZOHO_BASE = "www.zohoapis.com";
const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";

const DIGITAL_SOURCES = [
  "Google Ads - Pauta",
  "Meta - Pauta",
  "Formulario website",
];

const ALL_MARKETING_SOURCES = new Set([
  "Google Ads - Pauta",
  "Meta - Pauta",
  "Formulario website",
  "LinkedIn Sales Navigator",
  "Prospección LinkedIn",
  "Expo como expositor (agregar etiqueta de Expo)",
  "Expo como visitante (agregar etiqueta de Expo)",
  "WhatsApp - Numaris",
  "Campaña de mailing",
  "Prospección Facebook",
  "Prospección Instagram",
  "Newsletter LinkedIn",
  "Linkedin - Pauta",
]);

const EXCLUDED_ACCOUNT_IDS = new Set([
  "5991927000007362830", // TIP AUTO
  "5991927000065276241", // MSTAR INNOVATION
]);

const EXCLUDED_OWNER = "Ricardo Edil Velazquez Diaz";

const DISQUALIFIED_STATUSES = new Set([
  "3. Lead no calificado",
  "5. Junk",
  "Descalificado",
  "Prospecto a futuro",
]);

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────
function zohoRequest(hostname, path, method = "GET", body = null, token = null) {
  return new Promise((resolve) => {
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
        catch { resolve({ data: [] }); }
      });
    });
    req.on("error", () => resolve({ data: [] }));
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

async function fetchFiltered(module, fields, criteria, token) {
  const results = [];
  let page = 1;
  while (true) {
    const qs = `per_page=200&page=${page}&fields=${fields}&criteria=${criteria}`;
    const d = await zohoRequest(ZOHO_BASE, `/crm/v2/${module}/search?${qs}`, "GET", null, token);
    const batch = d.data || [];
    if (batch.length === 0) break;
    results.push(...batch);
    if (!d.info?.more_records) break;
    page++;
    await new Promise((r) => setTimeout(r, 200));
  }
  return results;
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

    // ── Fetch in parallel ───────────────────────────────────────────────────
    // 1. Digital leads — single OR query
    const leadCrit = encodeURIComponent(
      "((Lead_Source:equals:Google Ads - Pauta)" +
      "or(Lead_Source:equals:Meta - Pauta)" +
      "or(Lead_Source:equals:Formulario website))"
    );

    // 2. Closing deals — "Venta realizada" only (Zoho date filters unreliable in search API)
    const dealCrit = encodeURIComponent("(Stage:equals:Venta realizada)");

    // 3. Prospecto accounts — for citas count and source/owner lookup
    const prospCrit = encodeURIComponent("(Account_Type:equals:Prospecto)");

    const [allLeadsRaw, closingDeals, prospAccounts] = await Promise.all([
      fetchFiltered("Leads",    "Lead_Source,Lead_Status,Owner,Created_Time", leadCrit, token),
      fetchFiltered("Deals",    "Deal_Name,Stage,Account_Name,Closing_Date,Amount,Annual_Contract_Value", dealCrit, token),
      fetchFiltered("Accounts", "id,Account_Name,Se_obtuvo_por,Owner,Created_Time", prospCrit, token),
    ]);

    // Build Prospecto account lookup
    const prospAccountIds = new Set(prospAccounts.map((a) => a.id));
    const accountById = Object.fromEntries(prospAccounts.map((a) => [a.id, a]));

    // Cierres filter: Prospecto accounts only, excluding Ricardo + excluded IDs
    // (Some won accounts may have changed type to "Cliente" — small unavoidable gap vs Zoho)
    const prospOrClienteIds = new Set(
      prospAccounts
        .filter((a) => !EXCLUDED_ACCOUNT_IDS.has(a.id) && a.Owner?.name !== EXCLUDED_OWNER)
        .map((a) => a.id)
    );


    // ─── Build funnel per year ──────────────────────────────────────────────
    const YEARS = ["2026", "2025"];
    const funnel = {};

    for (const yr of YEARS) {

      // ── Generados: digital leads in year, excl. Ricardo ──────────────────
      const yearLeads = allLeadsRaw.filter(
        (l) => l.Created_Time?.startsWith(yr) && l.Owner?.name !== EXCLUDED_OWNER
      );

      // ── Calificados: generados minus disqualified statuses ───────────────
      const yearCalif = yearLeads.filter((l) => !DISQUALIFIED_STATUSES.has(l.Lead_Status));

      // ── Citas: Prospecto accounts created in year, Owner ≠ Ricardo ──────
      // ($converted is always 0 in this Zoho setup — using Prospecto accounts as proxy)
      const yearCitas = prospAccounts.filter(
        (a) =>
          a.Created_Time?.startsWith(yr) &&
          !EXCLUDED_ACCOUNT_IDS.has(a.id) &&
          a.Owner?.name !== EXCLUDED_OWNER
      );

      // ── Cierres: Venta realizada deals closing in year ───────────────────
      // Criteria: "Prospecto Convertidos a Cuentas Que contiene Oportunidades, Fase = Venta realizada"
      // → account must be Prospecto OR Cliente (accounts move to Cliente after closing)
      // → EXCLUDED_ACCOUNT_IDS and Ricardo already filtered out in prospOrClienteIds
      const yearClienteDeals = closingDeals.filter((d) => {
        const accId = getAccId(d);
        const dateStr = d.Closing_Date || "";
        if (!dateStr.startsWith(yr)) return false;
        if (!prospOrClienteIds.has(accId)) return false;
        return true;
      });

      // Deduplicate by account — keep highest-ACV deal per account
      const bestDealByAcc = {};
      for (const d of yearClienteDeals) {
        const accId = getAccId(d) || d.Deal_Name; // fallback key if no accId
        if (!accId) continue;
        const acv = d.Annual_Contract_Value || d.Amount || 0;
        if (!bestDealByAcc[accId] || acv > bestDealByAcc[accId].acv) {
          const acc = accountById[getAccId(d)];
          bestDealByAcc[accId] = {
            accId: getAccId(d),
            accountName: typeof d.Account_Name === "object"
              ? d.Account_Name?.name
              : (d.Account_Name || "—"),
            dealName: d.Deal_Name || "—",
            stage: d.Stage,
            closingDate: d.Closing_Date || "",
            acv,
            source: acc?.Se_obtuvo_por || "Otro",
            owner: acc?.Owner?.name || "—",
          };
        }
      }

      const clientesList = Object.values(bestDealByAcc).sort((a, b) => b.acv - a.acv);
      const totalACV = clientesList.reduce((s, c) => s + c.acv, 0);

      funnel[yr] = {
        byChannel: {},
        total: {
          generados: yearLeads.length,
          calificados: yearCalif.length,
          citas: yearCitas.length,
          clientes: clientesList.length,
          totalACV,
        },
        clientesBySource: {},
        clientesList,
      };

      // ── Per digital channel breakdown ─────────────────────────────────────
      for (const src of DIGITAL_SOURCES) {
        const srcLeads = yearLeads.filter((l) => l.Lead_Source === src);
        const srcCalif = srcLeads.filter((l) => !DISQUALIFIED_STATUSES.has(l.Lead_Status));

        // Citas per channel: Prospecto accounts created this year from this source
        const srcCitas = yearCitas.filter((a) => a.Se_obtuvo_por === src);

        // Clientes per channel: deals where account source = this channel
        const srcClientes = clientesList.filter((c) => c.source === src);
        const cl = srcClientes.length;
        const srcACV = srcClientes.reduce((s, c) => s + c.acv, 0);

        const g = srcLeads.length;
        const q = srcCalif.length;
        const c = srcCitas.length;

        funnel[yr].byChannel[src] = {
          generados: g,
          calificados: q,
          citas: c,
          clientes: cl,
          acv: srcACV,
          tasaCalificacion: g ? Math.round((q / g) * 1000) / 10 : 0,
          tasaCita: g ? Math.round((c / g) * 1000) / 10 : 0,
          tasaCierre: c ? Math.round((cl / c) * 1000) / 10 : 0,
          tasaTotal: g ? Math.round((cl / g) * 1000) / 10 : 0,
        };
      }

      // ── Clientes by source (all marketing channels) ───────────────────────
      for (const c of clientesList) {
        const src = c.source;
        if (!funnel[yr].clientesBySource[src]) {
          funnel[yr].clientesBySource[src] = { count: 0, acv: 0 };
        }
        funnel[yr].clientesBySource[src].count++;
        funnel[yr].clientesBySource[src].acv += c.acv;
      }

      // ── Total conversion rates ────────────────────────────────────────────
      const t = funnel[yr].total;
      t.tasaCalificacion = t.generados ? Math.round((t.calificados / t.generados) * 1000) / 10 : 0;
      t.tasaCita        = t.generados ? Math.round((t.citas       / t.generados) * 1000) / 10 : 0;
      t.tasaCierre      = t.citas     ? Math.round((t.clientes    / t.citas)     * 1000) / 10 : 0;
      t.tasaTotal       = t.generados ? Math.round((t.clientes    / t.generados) * 1000) / 10 : 0;
    }

    // ── Year-over-year deltas ──────────────────────────────────────────────
    const yoy = {};
    for (const key of ["generados", "calificados", "citas", "clientes"]) {
      const v26 = funnel["2026"]?.total?.[key] || 0;
      const v25 = funnel["2025"]?.total?.[key] || 0;
      yoy[key] = { delta: v26 - v25, prev: v25, curr: v26 };
    }

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      debug: {
        closingDealsTotal: closingDeals.length,
        digitalLeadsTotal: allLeadsRaw.length,
        prospAccountsTotal: prospAccounts.length,
        eligibleProspectoIds: prospOrClienteIds.size,
      },
      funnel,
      yoy,
    });
  } catch (err) {
    console.error("zoho-funnel:", err.message);
    res.status(500).json({ error: err.message });
  }
}
