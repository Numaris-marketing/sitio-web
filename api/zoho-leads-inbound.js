import https from "https";

const ZOHO_BASE          = "www.zohoapis.com";
const ZOHO_ACCOUNTS_HOST = "accounts.zoho.com";

const MAX_OWNER          = "Maximiliano Mireles Escobar";
const WEEKS_BACK         = 12;
const PENDING_DAYS       = 60; // show pending leads from last N days

const INBOUND_SOURCES = new Set([
  "Google Ads - Pauta",
  "Calendly",
  "Formulario website",
  "Formulario Website",
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
      res.on("data", c => (data += c));
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
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type:    "refresh_token",
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
    results.push(...batch);
    if (!d.info?.more_records) break;
    page++;
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// ─── WEEK HELPERS ─────────────────────────────────────────────────────────────
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1);
  return d;
}

function weekKey(date) {
  return mondayOf(date).toISOString().slice(0, 10);
}

function weekLabel(mondayStr) {
  const mon = new Date(mondayStr + "T12:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  if (mon.getMonth() === sun.getMonth()) {
    return `${months[mon.getMonth()]} ${mon.getDate()}–${sun.getDate()}`;
  }
  return `${months[mon.getMonth()]} ${mon.getDate()} – ${months[sun.getMonth()]} ${sun.getDate()}`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const token = await refreshToken();

    // Fetch leads from the 3 inbound sources
    const criteria = encodeURIComponent(
      "((Lead_Source:equals:Google Ads - Pauta)or" +
      "(Lead_Source:equals:Calendly)or" +
      "(Lead_Source:equals:Formulario website)or" +
      "(Lead_Source:equals:Formulario Website))"
    );

    const leads = await fetchFiltered("Leads",
      "id,First_Name,Last_Name,Lead_Source,Lead_Status,Owner,Created_Time,Modified_Time",
      criteria, token);

    // Filter to Maximiliano only
    const myLeads = leads.filter(l => {
      const owner = typeof l.Owner === "object" ? (l.Owner?.name || "") : (l.Owner || "");
      return owner === MAX_OWNER;
    });

    // Compute per-lead metrics
    const now = Date.now();
    const pendingCutoff = now - PENDING_DAYS * 24 * 60 * 60 * 1000;

    const enriched = myLeads.map(l => {
      const created  = new Date(l.Created_Time);
      const modified = new Date(l.Modified_Time);
      const diffMs   = modified.getTime() - created.getTime();
      const diffMin  = Math.round(diffMs / 60000);
      const attended = diffMs > 0; // any modification after creation = attended
      const name     = `${l.First_Name || ""} ${l.Last_Name || ""}`.trim() || "Sin nombre";
      const src      = l.Lead_Source === "Formulario Website" ? "Formulario website" : (l.Lead_Source || "Otro");
      return {
        id:          l.id,
        name,
        source:      src,
        status:      l.Lead_Status || null,
        createdAt:   l.Created_Time,
        modifiedAt:  l.Modified_Time,
        diffMin,
        attended,
        week:        weekKey(created),
      };
    });

    // ── Week buckets (last WEEKS_BACK weeks) ──────────────────────────────
    const todayMonday = mondayOf(new Date());
    const weekKeys = [];
    for (let i = WEEKS_BACK - 1; i >= 0; i--) {
      const d = new Date(todayMonday);
      d.setDate(todayMonday.getDate() - i * 7);
      weekKeys.push(d.toISOString().slice(0, 10));
    }

    const weekMap = {};
    for (const wk of weekKeys) {
      weekMap[wk] = { weekStart: wk, label: weekLabel(wk), total: 0, attended: 0, pending: 0, sumMin: 0 };
    }

    for (const l of enriched) {
      if (!weekMap[l.week]) continue; // older than WEEKS_BACK, skip
      const w = weekMap[l.week];
      w.total++;
      if (l.attended) {
        w.attended++;
        w.sumMin += l.diffMin;
      } else {
        w.pending++;
      }
    }

    const byWeek = weekKeys.map(wk => {
      const w = weekMap[wk];
      return {
        weekStart:      w.weekStart,
        label:          w.label,
        total:          w.total,
        attended:       w.attended,
        pending:        w.pending,
        avgResponseMin: w.attended > 0 ? Math.round(w.sumMin / w.attended) : null,
        attendedPct:    w.total > 0 ? Math.round(w.attended / w.total * 100) : null,
      };
    });

    // ── Summary (all time) ────────────────────────────────────────────────
    const totalAll    = enriched.length;
    const attendedAll = enriched.filter(l => l.attended).length;
    const pendingAll  = totalAll - attendedAll;
    const sumMinAll   = enriched.filter(l => l.attended).reduce((s, l) => s + l.diffMin, 0);
    const avgMinAll   = attendedAll > 0 ? Math.round(sumMinAll / attendedAll) : null;

    // ── This week summary ─────────────────────────────────────────────────
    const thisWeek = weekMap[todayMonday.toISOString().slice(0, 10)];

    // ── Pending leads (last PENDING_DAYS) ─────────────────────────────────
    const pendingLeads = enriched
      .filter(l => !l.attended && new Date(l.createdAt).getTime() >= pendingCutoff)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // oldest first
      .map(l => ({
        name:      l.name,
        source:    l.source,
        status:    l.status,
        createdAt: l.createdAt,
        ageHr:     Math.round((now - new Date(l.createdAt)) / 3600000 * 10) / 10,
      }));

    // ── By source ─────────────────────────────────────────────────────────
    const bySource = {};
    for (const l of enriched) {
      if (!bySource[l.source]) bySource[l.source] = { total: 0, attended: 0, sumMin: 0 };
      bySource[l.source].total++;
      if (l.attended) {
        bySource[l.source].attended++;
        bySource[l.source].sumMin += l.diffMin;
      }
    }
    const sourceStats = Object.entries(bySource).map(([src, v]) => ({
      source:         src,
      total:          v.total,
      attended:       v.attended,
      pending:        v.total - v.attended,
      attendedPct:    v.total > 0 ? Math.round(v.attended / v.total * 100) : 0,
      avgResponseMin: v.attended > 0 ? Math.round(v.sumMin / v.attended) : null,
    })).sort((a, b) => b.total - a.total);

    res.status(200).json({
      generatedAt:       new Date().toISOString(),
      owner:             MAX_OWNER,
      attendedCriteria: "Modified_Time > Created_Time",
      summary: {
        total:          totalAll,
        attended:       attendedAll,
        pending:        pendingAll,
        attendedPct:    totalAll > 0 ? Math.round(attendedAll / totalAll * 100) : 0,
        avgResponseMin: avgMinAll,
      },
      thisWeek: {
        weekStart:      thisWeek.weekStart,
        label:          thisWeek.label,
        total:          thisWeek.total,
        attended:       thisWeek.attended,
        pending:        thisWeek.pending,
        avgResponseMin: thisWeek.attended > 0
          ? Math.round(weekMap[thisWeek.weekStart].sumMin / thisWeek.attended)
          : null,
      },
      byWeek,
      bySource: sourceStats,
      pendingLeads,
    });

  } catch (err) {
    console.error("zoho-leads-inbound:", err.message);
    res.status(500).json({ error: err.message });
  }
}
