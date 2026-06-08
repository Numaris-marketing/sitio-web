// Vercel Serverless Function — Facturación por Canal
// GET /api/billing
// Lee Google Sheets (hoja pública) y agrega facturación por canal, plataforma y top clientes.
// Requiere env var: GOOGLE_SHEETS_API_KEY

import https from "https";

const SHEET_ID = "1ZtLdMDRp5zcoZSufboj8cO0R9Kdb2EuAUzpkyKeShVg";

// Mapeo de canal individual → grupo para el dashboard
const CANAL_GRUPO = {
  "Linkedin":                         "Digital",
  "Meta - Pauta":                     "Digital",
  "Google Ads - Pauta":               "Digital",
  "Formulario website":               "Digital",
  "Google +":                         "Digital",
  "Cartera de clientes del vendedor": "Ventas directas",
  "Llamada o Visita en Frio Vendedor":"Ventas directas",
  "Prospección vendedor":             "Ventas directas",
  "Prospección libre (otros)":        "Ventas directas",
  "Cliente Historico":                "Histórico / Base",
  "Base de datos":                    "Histórico / Base",
  "Directorio empresarial web":       "Histórico / Base",
  "Bolsas de empleo":                 "Histórico / Base",
  "Recomendacion de Cliente":         "Referidos",
  "Referido de Proveedor":            "Referidos",
  "Referido Interno":                 "Referidos",
  "Referido de Prospecto":            "Referidos",
  "Referido Numaris":                 "Referidos",
  "Subcliente":                       "Referidos",
};

function sheetsGet(path, apiKey) {
  return new Promise((resolve, reject) => {
    const fullPath = `${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`;
    const req = https.request(
      { hostname: "sheets.googleapis.com", path: fullPath, method: "GET" },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 300)}`)); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// Descubre automáticamente qué tab tiene la columna empresa_numaris
async function findBillingSheet(apiKey) {
  const meta = await sheetsGet(
    `/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`,
    apiKey
  );
  const sheetNames = (meta.sheets || []).map((s) => s.properties?.title).filter(Boolean);

  for (const name of sheetNames) {
    const encoded = encodeURIComponent(name);
    const firstRow = await sheetsGet(
      `/v4/spreadsheets/${SHEET_ID}/values/${encoded}!1:1`,
      apiKey
    );
    const headers = (firstRow.values || [[]])[0] || [];
    if (headers.includes("empresa_numaris")) {
      return { name, headers };
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Cache 1 hora (datos se actualizan ~1 vez al día)
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_SHEETS_API_KEY no configurado en Vercel");

    // 1. Encontrar el tab con datos de canal
    const sheetInfo = await findBillingSheet(apiKey);
    if (!sheetInfo) throw new Error("No se encontró ningún tab con columna empresa_numaris");

    const { name: tabName, headers } = sheetInfo;

    // 2. Leer todos los datos de ese tab
    const encoded = encodeURIComponent(tabName);
    const rangeData = await sheetsGet(
      `/v4/spreadsheets/${SHEET_ID}/values/${encoded}`,
      apiKey
    );
    const rows = rangeData.values || [];

    // Encontrar índices de columnas por nombre
    const idx = (col) => headers.indexOf(col);
    const companyCol    = idx("Company Name") !== -1 ? idx("Company Name") : 1;
    const amountCol     = idx("subtotal_bcy");
    const empresaCol    = idx("empresa_numaris");
    const canalCol      = idx("clasificacion_origen");
    const primeraCol    = idx("primera_factura");

    if (amountCol === -1 || empresaCol === -1 || canalCol === -1) {
      throw new Error(`Columnas faltantes en tab "${tabName}". Headers: ${headers.join(", ")}`);
    }

    // 3. Agregar datos (saltar header + línea de separadores si existe)
    const dataStart = rows[1]?.[0]?.includes(":") ? 2 : 1;

    const byCanal   = {};
    const byEmpresa = {};
    const byGrupo   = {};
    const clients   = [];
    let total = 0;

    for (let i = dataStart; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length <= empresaCol) continue;

      const amountRaw = (row[amountCol] || "").replace(/,/g, "").trim();
      const empresa   = (row[empresaCol] || "").trim();
      const canal     = (row[canalCol]   || "").trim();
      const company   = (row[companyCol] || "").replace(/"/g, "").trim();
      const primera   = row[primeraCol]  || "";

      if (!amountRaw || !empresa || !canal) continue;
      const amount = parseFloat(amountRaw);
      if (isNaN(amount) || amount < 1) continue;

      const grupo = CANAL_GRUPO[canal] || "Otros";

      if (!byCanal[canal])   byCanal[canal]   = { amount: 0, clients: 0, grupo };
      if (!byEmpresa[empresa]) byEmpresa[empresa] = { amount: 0, clients: 0 };
      if (!byGrupo[grupo])   byGrupo[grupo]   = { amount: 0, clients: 0 };

      byCanal[canal].amount   += amount;
      byCanal[canal].clients  += 1;
      byEmpresa[empresa].amount  += amount;
      byEmpresa[empresa].clients += 1;
      byGrupo[grupo].amount   += amount;
      byGrupo[grupo].clients  += 1;

      clients.push({ company, amount, empresa, canal, grupo, primera });
      total += amount;
    }

    // Redondear todos los amounts
    for (const k of Object.keys(byCanal))   byCanal[k].amount   = Math.round(byCanal[k].amount);
    for (const k of Object.keys(byEmpresa)) byEmpresa[k].amount = Math.round(byEmpresa[k].amount);
    for (const k of Object.keys(byGrupo))   byGrupo[k].amount   = Math.round(byGrupo[k].amount);

    clients.sort((a, b) => b.amount - a.amount);
    clients.forEach((c) => { c.amount = Math.round(c.amount); });

    res.status(200).json({
      generatedAt:  new Date().toISOString(),
      sourceTab:    tabName,
      total:        Math.round(total),
      clientCount:  clients.length,
      byGrupo,
      byCanal,
      byEmpresa,
      topClients:   clients.slice(0, 20),
    });

  } catch (err) {
    console.error("billing:", err.message);
    res.status(500).json({ error: err.message });
  }
}
