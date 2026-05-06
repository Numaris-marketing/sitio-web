const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, PageBreak, LevelFormat
} = require('docx');
const fs = require('fs');

// ─── Color palette ───────────────────────────────────────────────────────────
const C = {
  navy:    "012750",
  blue:    "1A5CB0",
  lightBlue: "D6E4F7",
  teal:    "0D7B6B",
  lightTeal: "D2EFE9",
  orange:  "D97C10",
  lightOrange: "FDEBD0",
  gray:    "6B7280",
  lightGray: "F3F4F6",
  midGray: "E5E7EB",
  white:   "FFFFFF",
  text:    "111827",
  subtext: "4B5563",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const border0 = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: border0, bottom: border0, left: border0, right: border0 };
const thinBorder = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const thinBorders = (color = "CCCCCC") => ({
  top: thinBorder(color), bottom: thinBorder(color),
  left: thinBorder(color), right: thinBorder(color)
});

function cell(children, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    borders: opts.borders !== undefined ? opts.borders : thinBorders(),
    verticalAlign: opts.va || VerticalAlign.TOP,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    rowSpan: opts.rowSpan,
    columnSpan: opts.colSpan,
    children,
  });
}

function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: "Arial",
    size: opts.size || 20,
    bold: opts.bold || false,
    color: opts.color || C.text,
    italics: opts.italic || false,
  });
}

function para(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 60 },
    children: Array.isArray(children) ? children : [children],
    heading: opts.heading,
  });
}

function spacer(pts = 120) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 0, after: pts } });
}

function sectionTitle(label, color = C.navy) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 80 } },
    children: [txt(label, { bold: true, size: 28, color })],
  });
}

// ─── PHASE colors ─────────────────────────────────────────────────────────────
const PHASES = [
  { label: "1. Design System",       owner: "Andrea Pliego",    fill: "C7D9F5", text: C.navy },
  { label: "2. Diseño de páginas",   owner: "Andrea + Libni",   fill: "DBEAFE", text: "1E3A8A" },
  { label: "3. Assets / Multimedia", owner: "Angela Valverde",  fill: "D1FAE5", text: "065F46" },
  { label: "4. Contenido & SEO",     owner: "Libni Flores",     fill: "FEF9C3", text: "713F12" },
  { label: "5. Desarrollo",          owner: "Patricio Dev",     fill: "FFE4E6", text: "9F1239" },
  { label: "6. QA & Testing",        owner: "Patricio PO + equipo", fill: "F3E8FF", text: "4C1D95" },
  { label: "7. Migración / Go-live", owner: "Patricio Dev + PO", fill: "FED7AA", text: "7C2D12" },
];

// ─── PAGES ────────────────────────────────────────────────────────────────────
const PAGES = [
  { url: "/  (Home)",                        type: "Core",      priority: 1 },
  { url: "/contacto",                         type: "Core",      priority: 1 },
  { url: "/nosotros",                         type: "Core",      priority: 2 },
  { url: "/blog",                             type: "Core",      priority: 3 },
  { url: "/historias-de-exito",               type: "Core",      priority: 2 },
  { url: "/soluciones/rastreo-satelital",     type: "Solución",  priority: 1 },
  { url: "/soluciones/monitoreo-inteligente", type: "Solución",  priority: 1 },
  { url: "/soluciones/monitoreo-de-licencia", type: "Solución",  priority: 2 },
  { url: "/soluciones/videotelemetria-ia",    type: "Solución",  priority: 1 },
  { url: "/soluciones/control-de-combustible",type: "Solución",  priority: 2 },
  { url: "/soluciones/telemetria-avanzada",   type: "Solución",  priority: 2 },
  { url: "/soluciones/remolques-inteligentes",type: "Solución",  priority: 3 },
  { url: "/soluciones/gestion-de-flotas",     type: "Solución",  priority: 3 },
  { url: "/soluciones/administracion-mantenimiento", type: "Solución", priority: 3 },
  { url: "/sectores/transporte-pesado",       type: "Sector",    priority: 1 },
  { url: "/sectores/distribucion-logistica",  type: "Sector",    priority: 1 },
  { url: "/sectores/movilidad",               type: "Sector",    priority: 2 },
  { url: "/sectores/servicios-financieros",   type: "Sector",    priority: 2 },
];

// ─── RESPONSIBILITIES ─────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Libni Flores",
    role: "Redacción & Contenido SEO",
    color: C.blue,
    fill: "DBEAFE",
    tasks: [
      "Redactar copy hero, CTAs y body de las 18 páginas",
      "Investigación de keywords primarias y secundarias por URL",
      "Meta titles y meta descriptions (160 car. máx.)",
      "Títulos H1–H3 optimizados para SEO",
      "Textos de casos de éxito y testimonios",
      "Copy para sección IA/stats y métricas de pipeline",
      "Contenido de la sección Nosotros (historia, valores, equipo)",
      "Estructura de artículos del Blog (primeras 4 entradas)",
    ],
  },
  {
    name: "Andrea Pliego",
    role: "Diseño UI/UX (Figma)",
    color: "7C3AED",
    fill: "EDE9FE",
    tasks: [
      "Auditoría visual de numaris.com (benchmark + pain points)",
      "Definición del Design System: tipografía, colores, espaciados, componentes",
      "Figma tokens exportables para Tailwind CSS",
      "Wireframes y mockups de las 18 páginas (desktop + mobile)",
      "Diseño del nuevo Hero animado para Home",
      "Variantes de componentes: cards, modals, tablas comparativas",
      "Motion spec: animaciones de entrada, transiciones de página",
      "Entrega de assets exportados: SVG iconos, imágenes WebP, logos",
      "Revisión visual QA antes del go-live",
    ],
  },
  {
    name: "Angela Valverde",
    role: "Assets, Multimedia & Fotografía",
    color: "065F46",
    fill: "D1FAE5",
    tasks: [
      "Organizar y etiquetar biblioteca de fotos de clientes / flota",
      "Grabar o coordinar grabación de videos de producto (2–3 clips)",
      "Exportar logos de clientes en SVG con fondo transparente",
      "Optimizar imágenes para Web (WebP, max 200 KB)",
      "Crear thumbnails de casos de éxito (1200 × 630 px)",
      "Actualizar los 24 logos del marquee con versiones finales",
      "Testimonios en video o foto + nombre + empresa",
    ],
  },
  {
    name: "Patricio (Dev) — Tech Lead",
    role: "Desarrollo Frontend & Infraestructura",
    color: "9F1239",
    fill: "FFE4E6",
    tasks: [
      "Migrar de HTML estático a Next.js (o mantener Tailwind si aplica)",
      "Implementar Design System de Figma en código",
      "Programar las 18 rutas con vercel.json / file-based routing",
      "Integrar Google Analytics 4 + Search Console",
      "Configurar sitemap.xml automático y robots.txt",
      "Optimizar Core Web Vitals (LCP < 2.5 s, CLS < 0.1)",
      "Implementar 301 redirects desde numaris.com para SEO",
      "Deploy final en tecnocontrolv.com (migración DNS)",
      "Configurar OG tags para redes sociales",
    ],
  },
  {
    name: "Patricio (PO) — Product Owner",
    role: "Visión de producto, aprobaciones y QA",
    color: "4C1D95",
    fill: "F3E8FF",
    tasks: [
      "Definir prioridad de páginas y features por sprint",
      "Aprobar wireframes y mockups de Figma antes de desarrollo",
      "Revisar y aprobar copy final de Libni antes de publicar",
      "Sign-off en Design System (colores, voz de marca)",
      "QA funcional: formularios, links, responsive, videos",
      "Coordinar reuniones de revisión semanales del equipo",
      "Validar métricas de GA4 post-go-live (bounce rate, conversiones)",
      "Comunicación con cliente / stakeholders",
    ],
  },
];

// ─── GANTT data ────────────────────────────────────────────────────────────────
// Mayo = semanas 1-4, Junio = semanas 5-8, Julio = semanas 9-12
const GANTT = [
  { phase: "1. Design System",        weeks: [1,2],   mayo: "●●○○", junio: "○○○○", julio: "○○○○" },
  { phase: "2. Diseño de páginas",    weeks: [2,6],   mayo: "○●●●", junio: "●●○○", julio: "○○○○" },
  { phase: "3. Assets / Multimedia",  weeks: [3,7],   mayo: "○○●●", junio: "●●●○", julio: "○○○○" },
  { phase: "4. Contenido & SEO",      weeks: [2,8],   mayo: "○●●●", junio: "●●●●", julio: "○○○○" },
  { phase: "5. Desarrollo",           weeks: [5,10],  mayo: "○○○○", junio: "●●●●", julio: "●●○○" },
  { phase: "6. QA & Testing",         weeks: [9,11],  mayo: "○○○○", junio: "○○○○", julio: "●●●○" },
  { phase: "7. Migración / Go-live",  weeks: [11,12], mayo: "○○○○", junio: "○○○○", julio: "○○●●" },
];

// ─── MILESTONES ────────────────────────────────────────────────────────────────
const MILESTONES = [
  { date: "16 Mayo",   label: "Design System aprobado (tokens, tipografía, colores)" },
  { date: "30 Mayo",   label: "Wireframes Home + 3 Soluciones prioritarias aprobados" },
  { date: "13 Junio",  label: "Mockups finales de las 18 páginas entregados" },
  { date: "20 Junio",  label: "Todos los assets (videos, imágenes, logos) listos" },
  { date: "27 Junio",  label: "Contenido SEO completo y aprobado (las 18 páginas)" },
  { date: "11 Julio",  label: "Desarrollo completo — sitio en staging" },
  { date: "18 Julio",  label: "QA finalizado — cero bugs críticos" },
  { date: "25 Julio",  label: "🚀 Go-live en tecnocontrolv.com + migración SEO" },
];

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const KPIS = [
  { metric: "LCP (Core Web Vitals)",    target: "< 2.5 segundos",   owner: "Patricio Dev" },
  { metric: "CLS",                       target: "< 0.1",            owner: "Patricio Dev" },
  { metric: "Indexación en Google",      target: "18/18 URLs",       owner: "Patricio Dev" },
  { metric: "Traffic orgánico (90 días)","target": "+30% vs. baseline","owner": "Libni + PO" },
  { metric: "Tasa de conversión demo",   target: "> 2%",             owner: "Andrea + PO" },
  { metric: "Páginas sin errores 404",   target: "100%",             owner: "Patricio Dev" },
  { metric: "Bounce rate Home",          target: "< 55%",            owner: "Andrea + Libni" },
];

// ─── DOCUMENT BODY ────────────────────────────────────────────────────────────
const children = [];

// ══ COVER ══
children.push(
  spacer(600),
  para([txt("NUMARIS", { bold: true, size: 52, color: C.navy })], { align: AlignmentType.CENTER }),
  para([txt("Roadmap de Rediseño Web", { bold: true, size: 36, color: C.blue })], { align: AlignmentType.CENTER }),
  spacer(80),
  para([txt("Mayo – Julio 2026", { size: 24, color: C.gray })], { align: AlignmentType.CENTER }),
  para([txt("Versión 1.0  ·  Confidencial", { size: 20, color: C.gray, italic: true })], { align: AlignmentType.CENTER }),
  spacer(500),
  new Paragraph({ children: [new PageBreak()] }),
);

// ══ 1. RESUMEN EJECUTIVO ══
children.push(sectionTitle("1. Resumen Ejecutivo"));
children.push(
  para([txt("Este documento define el plan de trabajo para rediseñar completamente el sitio web de Numaris (tecnocontrolv.com) durante los meses de mayo, junio y julio de 2026. El proyecto comprende 18 URLs, un equipo de 5 personas y 7 fases de trabajo que van desde la construcción del Design System en Figma hasta la migración final en producción.", { size: 20 })], { after: 80 }),
  para([txt("Objetivo principal:", { bold: true, size: 20 }), txt(" Generar un sitio de clase mundial que posicione a Numaris como el líder tecnológico en telemática y rastreo satelital en México y Latinoamérica, con foco en conversión, SEO y experiencia de usuario.", { size: 20 })], { after: 80 }),
);

// Quick stats table
children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [
      new TableRow({
        children: [
          cell([para([txt("18", { bold: true, size: 36, color: C.navy }), txt(""), txt("Páginas totales", { size: 18, color: C.subtext })])], { fill: C.lightBlue, borders: noBorders, width: 2340 }),
          cell([para([txt("5", { bold: true, size: 36, color: C.navy }), txt(""), txt("Personas en el equipo", { size: 18, color: C.subtext })])], { fill: C.lightBlue, borders: noBorders, width: 2340 }),
          cell([para([txt("7", { bold: true, size: 36, color: C.navy }), txt(""), txt("Fases de trabajo", { size: 18, color: C.subtext })])], { fill: C.lightBlue, borders: noBorders, width: 2340 }),
          cell([para([txt("12", { bold: true, size: 36, color: C.navy }), txt(""), txt("Semanas de ejecución", { size: 18, color: C.subtext })])], { fill: C.lightBlue, borders: noBorders, width: 2340 }),
        ],
      }),
    ],
  }),
  spacer(200),
);

// ══ 2. EQUIPO ══
children.push(sectionTitle("2. Equipo del Proyecto"));

// Team table header
const teamHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("Persona", { bold: true, size: 20, color: C.white })])], { fill: C.navy, borders: noBorders, width: 2400 }),
    cell([para([txt("Rol", { bold: true, size: 20, color: C.white })])], { fill: C.navy, borders: noBorders, width: 3000 }),
    cell([para([txt("Responsabilidades clave", { bold: true, size: 20, color: C.white })])], { fill: C.navy, borders: noBorders, width: 3960 }),
  ],
});

const teamDataRows = TEAM.map((m, i) =>
  new TableRow({
    children: [
      cell([para([txt(m.name, { bold: true, size: 20, color: m.color })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 2400 }),
      cell([para([txt(m.role, { size: 19 })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 3000 }),
      cell(m.tasks.slice(0, 3).map(t => para([txt("• " + t, { size: 18 })])), { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 3960 }),
    ],
  })
);

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 3000, 3960],
    rows: [teamHeaderRow, ...teamDataRows],
  }),
  spacer(120),
);

// ══ 3. PÁGINAS ══
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  sectionTitle("3. Inventario de Páginas (18 URLs)"),
);

const pageHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("#", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 480 }),
    cell([para([txt("URL", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 5000 }),
    cell([para([txt("Tipo", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 1880 }),
    cell([para([txt("Prioridad", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 2000 }),
  ],
});

const typeColors = { "Core": "DBEAFE", "Solución": "D1FAE5", "Sector": "FEF3C7" };
const prioLabels = { 1: "🔴 Alta", 2: "🟡 Media", 3: "🟢 Normal" };

const pageDataRows = PAGES.map((p, i) =>
  new TableRow({
    children: [
      cell([para([txt(String(i+1), { size: 18 })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 480 }),
      cell([para([txt(p.url, { size: 18, color: C.blue })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 5000 }),
      cell([para([txt(p.type, { size: 18 })])], { fill: typeColors[p.type] || C.white, borders: thinBorders("DDDDDD"), width: 1880 }),
      cell([para([txt(prioLabels[p.priority], { size: 18 })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 2000 }),
    ],
  })
);

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [480, 5000, 1880, 2000],
    rows: [pageHeaderRow, ...pageDataRows],
  }),
  spacer(120),
);

// ══ 4. FASES ══
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  sectionTitle("4. Fases del Proyecto"),
);

const phaseDescs = [
  "Definir tokens de diseño (colores, tipografía, espaciados), componentes base y guía de estilo en Figma. Base para todas las páginas.",
  "Wireframes y mockups de alta fidelidad para las 18 URLs, incluyendo versiones desktop y mobile. Revisión y aprobación antes de pasar a desarrollo.",
  "Recopilar, producir y optimizar todos los assets: fotos, videos, logos, íconos SVG e imágenes WebP listos para producción.",
  "Redactar el copy definitivo con keywords SEO para las 18 páginas. Incluye meta titles, descripciones y estructura H1–H3.",
  "Implementar el diseño aprobado en código (Next.js / Tailwind). Integrar GA4, sitemap.xml, redirects 301 y optimización de velocidad.",
  "Pruebas funcionales y visuales: formularios, links, videos, responsive en iOS/Android/Mac/Windows. Lista de bugs y correcciones.",
  "Publicación en tecnocontrolv.com, migración DNS, verificación de redirects SEO y monitoreo de primeras 48 h post-lanzamiento.",
];

PHASES.forEach((ph, i) => {
  const weeksText = GANTT[i] ? ` — Semanas ${GANTT[i].weeks[0]}–${GANTT[i].weeks[1]}` : "";
  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({
          children: [
            cell([
              para([
                txt(ph.label + weeksText, { bold: true, size: 22, color: ph.text }),
              ], { after: 40 }),
              para([txt("Responsable: ", { bold: true, size: 18, color: ph.text }), txt(ph.owner, { size: 18, color: ph.text })], { after: 40 }),
              para([txt(phaseDescs[i], { size: 18, color: "374151" })], { after: 0 }),
            ], { fill: ph.fill, borders: noBorders, width: 9360 }),
          ],
        }),
      ],
    }),
    spacer(100),
  );
});

// ══ 5. CALENDARIO ══
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  sectionTitle("5. Calendario — Gantt por Semanas"),
  para([txt("M = Mayo  ·  J = Junio  ·  Jl = Julio  ·  ██ = Activo  ·  ░░ = Inactivo", { size: 17, color: C.gray, italic: true })], { after: 120 }),
);

// Gantt table
const ganttCols = [2800, 840, 840, 840, 840, 840, 840, 840, 840, 840, 840, 840, 840];
const ganttHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("Fase", { bold: true, size: 17, color: C.white })])], { fill: C.navy, borders: noBorders, width: 2800 }),
    ...[...Array(4)].map((_, i) => cell([para([txt(`M${i+1}`, { bold: true, size: 15, color: C.white })])], { fill: C.blue, borders: thinBorders("FFFFFF"), width: 840 })),
    ...[...Array(4)].map((_, i) => cell([para([txt(`J${i+1}`, { bold: true, size: 15, color: C.white })])], { fill: "0D7B6B", borders: thinBorders("FFFFFF"), width: 840 })),
    ...[...Array(4)].map((_, i) => cell([para([txt(`Jl${i+1}`, { bold: true, size: 15, color: C.white })])], { fill: "7C3AED", borders: thinBorders("FFFFFF"), width: 840 })),
  ],
});

const ganttDataRows = GANTT.map((g, i) => {
  const all12 = [
    ...g.mayo.split(""), ...g.junio.split(""), ...g.julio.split("")
  ];
  return new TableRow({
    children: [
      cell([para([txt(g.phase, { size: 17, bold: true, color: PHASES[i].text })])], { fill: PHASES[i].fill, borders: thinBorders("DDDDDD"), width: 2800 }),
      ...all12.map((c, wi) => {
        const active = c === "●";
        const monthFills = ["DBEAFE","DBEAFE","DBEAFE","DBEAFE","D1FAE5","D1FAE5","D1FAE5","D1FAE5","EDE9FE","EDE9FE","EDE9FE","EDE9FE"];
        const activeFills = ["1A5CB0","1A5CB0","1A5CB0","1A5CB0","0D7B6B","0D7B6B","0D7B6B","0D7B6B","7C3AED","7C3AED","7C3AED","7C3AED"];
        return cell([para([txt(active ? "█" : "░", { size: 16, color: active ? C.white : "BBBBBB" })])], {
          fill: active ? activeFills[wi] : monthFills[wi],
          borders: thinBorders("CCCCCC"),
          width: 840,
        });
      }),
    ],
  });
});

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: ganttCols,
    rows: [ganttHeaderRow, ...ganttDataRows],
  }),
  spacer(200),
);

// ══ 6. HITOS ══
children.push(sectionTitle("6. Hitos y Fechas Clave"));

const hitoHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("Fecha", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 1600 }),
    cell([para([txt("Hito", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 7760 }),
  ],
});

const hitoDataRows = MILESTONES.map((m, i) =>
  new TableRow({
    children: [
      cell([para([txt(m.date, { bold: true, size: 18, color: C.blue })])], { fill: i % 2 === 0 ? C.lightBlue : C.white, borders: thinBorders("CCCCCC"), width: 1600 }),
      cell([para([txt(m.label, { size: 18 })])], { fill: i % 2 === 0 ? C.lightBlue : C.white, borders: thinBorders("CCCCCC"), width: 7760 }),
    ],
  })
);

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 7760],
    rows: [hitoHeaderRow, ...hitoDataRows],
  }),
  spacer(200),
);

// ══ 7. RESPONSABILIDADES DETALLADAS ══
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  sectionTitle("7. Responsabilidades Detalladas por Persona"),
);

TEAM.forEach((m, ti) => {
  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({
          children: [
            cell([para([
              txt(m.name, { bold: true, size: 22, color: m.color }),
              txt("  —  " + m.role, { size: 20, color: "4B5563" }),
            ])], { fill: m.fill, borders: noBorders, width: 9360 }),
          ],
        }),
        ...m.tasks.map((task, i) => new TableRow({
          children: [
            cell([para([txt("  " + (i+1) + ".  " + task, { size: 18 })])], {
              fill: i % 2 === 0 ? C.white : C.lightGray,
              borders: thinBorders("DDDDDD"),
              width: 9360,
            }),
          ],
        })),
      ],
    }),
    spacer(160),
  );
});

// ══ 8. KPIs ══
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  sectionTitle("8. KPIs de Éxito (Post Go-live)"),
);

const kpiHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("Métrica", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 3600 }),
    cell([para([txt("Meta", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 3000 }),
    cell([para([txt("Responsable", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 2760 }),
  ],
});

const kpiDataRows = KPIS.map((k, i) =>
  new TableRow({
    children: [
      cell([para([txt(k.metric, { size: 18 })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 3600 }),
      cell([para([txt(k.target, { bold: true, size: 18, color: C.teal })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 3000 }),
      cell([para([txt(k.owner, { size: 18, color: C.subtext })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 2760 }),
    ],
  })
);

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 3000, 2760],
    rows: [kpiHeaderRow, ...kpiDataRows],
  }),
  spacer(240),
);

// ══ 9. HERRAMIENTAS ══
children.push(sectionTitle("9. Herramientas y Stack Tecnológico"));

const TOOLS = [
  { cat: "Diseño",        tools: "Figma — Design System, mockups, componentes, specs de motion" },
  { cat: "Frontend",      tools: "HTML / Tailwind CSS (o Next.js en iteración futura)" },
  { cat: "Deploy",        tools: "Vercel — CI/CD automático, preview deployments, edge CDN" },
  { cat: "Dominio",       tools: "tecnocontrolv.com vía GoDaddy — A record → 76.76.21.21" },
  { cat: "Analytics",     tools: "Google Analytics 4 + Google Search Console" },
  { cat: "SEO técnico",   tools: "sitemap.xml auto-generado + robots.txt + meta OG tags" },
  { cat: "Assets",        tools: "WebP para imágenes, SVG para logos, MP4 para videos" },
  { cat: "Contenido",     tools: "Google Docs para drafts → Copy pasa a HTML final" },
  { cat: "Comunicación",  tools: "Slack para alineación de equipo + reuniones Zoom semanales" },
];

const toolHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    cell([para([txt("Categoría", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 2000 }),
    cell([para([txt("Herramientas", { bold: true, size: 18, color: C.white })])], { fill: C.navy, borders: noBorders, width: 7360 }),
  ],
});

const toolDataRows = TOOLS.map((t, i) =>
  new TableRow({
    children: [
      cell([para([txt(t.cat, { bold: true, size: 18, color: C.blue })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 2000 }),
      cell([para([txt(t.tools, { size: 18 })])], { fill: i % 2 === 0 ? C.lightGray : C.white, borders: thinBorders("DDDDDD"), width: 7360 }),
    ],
  })
);

children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: [toolHeaderRow, ...toolDataRows],
  }),
  spacer(240),
);

// ══ CLOSING NOTE ══
children.push(
  sectionTitle("Nota de cierre"),
  para([txt("Este roadmap es un documento vivo. Las fechas y prioridades pueden ajustarse con previo acuerdo del equipo. Se recomienda una revisión semanal de avance cada lunes para detectar bloqueos a tiempo.", { size: 20, italic: true, color: C.subtext })]),
  spacer(80),
  para([txt("tecnocontrolv.com  ·  Numaris  ·  Confidencial  ·  Mayo 2026", { size: 17, color: C.gray })], { align: AlignmentType.CENTER }),
);

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 60 } },
            spacing: { after: 0 },
            children: [
              txt("Numaris  —  Roadmap de Rediseño Web  |  Mayo–Julio 2026", { size: 16, color: C.gray }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.midGray, space: 60 } },
            spacing: { before: 0 },
            children: [
              txt("tecnocontrolv.com  ·  Confidencial  ·  Página ", { size: 16, color: C.gray }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: C.gray }),
              txt(" de ", { size: 16, color: C.gray }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: C.gray }),
            ],
          }),
        ],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(
    '/Users/patricionavarrohermosillo/Documents/Claude/numaris-site/Numaris_Roadmap_Mayo-Julio_2026.docx',
    buffer
  );
  console.log('✅ Done');
}).catch(e => { console.error(e); process.exit(1); });
