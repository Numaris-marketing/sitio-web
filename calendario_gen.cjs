const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, Header, Footer, PageBreak
} = require('docx');
const fs = require('fs');

const C = {
  navy:    "012750",
  blue:    "1A5CB0",
  lightBlue: "DBEAFE",
  green:   "065F46",
  lightGreen: "D1FAE5",
  purple:  "4C1D95",
  lightPurple: "EDE9FE",
  orange:  "92400E",
  lightOrange: "FEF3C7",
  gray:    "6B7280",
  lightGray: "F3F4F6",
  midGray: "E5E7EB",
  white:   "FFFFFF",
  text:    "111827",
  subtext: "4B5563",
};

function thinBorder(color){ return { style: BorderStyle.SINGLE, size: 1, color }; }
function borders(color="CCCCCC"){ return { top:thinBorder(color), bottom:thinBorder(color), left:thinBorder(color), right:thinBorder(color) }; }
function noBorders(){ const b={style:BorderStyle.NONE,size:0,color:"FFFFFF"}; return {top:b,bottom:b,left:b,right:b}; }

function cell(children, opts={}){
  return new TableCell({
    width: opts.width ? {size:opts.width, type:WidthType.DXA} : undefined,
    shading: opts.fill ? {fill:opts.fill, type:ShadingType.CLEAR} : undefined,
    borders: opts.borders !== undefined ? opts.borders : borders(),
    verticalAlign: opts.va || VerticalAlign.CENTER,
    margins: {top:100, bottom:100, left:140, right:140},
    columnSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    children,
  });
}

function txt(text, opts={}){
  return new TextRun({ text, font:"Arial", size:opts.size||20, bold:opts.bold||false, color:opts.color||C.text, italics:opts.italic||false });
}

function para(children, opts={}){
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before:opts.before||0, after:opts.after||60 },
    children: Array.isArray(children) ? children : [children],
  });
}

function spacer(pts=120){ return new Paragraph({children:[new TextRun("")], spacing:{before:0,after:pts}}); }

function sectionTitle(label, color=C.navy){
  return new Paragraph({
    spacing:{before:240, after:120},
    border:{bottom:{style:BorderStyle.SINGLE, size:8, color, space:80}},
    children:[txt(label, {bold:true, size:28, color})],
  });
}

// ── CALENDAR DATA ─────────────────────────────────────────────────────────────
const PAGES = [
  { num:1, page:"Home",                   andrea:"1 Jun",  live:"6 Jun",   fill:C.lightBlue,   tag:"Base del Design System" },
  { num:2, page:"Rastreo Satelital",      andrea:"12 Jun", live:"19 Jun",  fill:C.lightGreen,  tag:"Template para productos" },
  { num:3, page:"Transporte Pesado",      andrea:"24 Jun", live:"1 Jul",   fill:C.lightBlue,   tag:"Template para sectores" },
  { num:4, page:"Caso de Exito — Bafar",  andrea:"8 Jul",  live:"15 Jul",  fill:C.lightGreen,  tag:"Template para casos" },
  { num:5, page:"Blog",                   andrea:"18 Jul", live:"25 Jul",  fill:C.lightBlue,   tag:"Index + articulo" },
  { num:6, page:"Contacto",               andrea:"28 Jul", live:"4 Ago",   fill:C.lightGreen,  tag:"Ventas + Soporte" },
  { num:7, page:"Nosotros",               andrea:"8 Ago",  live:"15 Ago",  fill:"FFF7ED",      tag:"Historia, equipo, valores" },
];

// ── TEAM ──────────────────────────────────────────────────────────────────────
const TEAM = [
  { name:"Andrea Pliego",   role:"Diseno UI/UX",        color:C.blue,   fill:C.lightBlue,   tasks:["Disena cada pagina en Claude Code con referencias", "Sube cambios a su rama andrea/diseno", "Comparte URL de preview con Patricio PO", "Arranca la siguiente pagina en paralelo mientras se implementa la anterior"] },
  { name:"Libni Flores",    role:"Redaccion y Copy SEO", color:C.green,  fill:C.lightGreen,  tasks:["Entra en cuanto Andrea entrega cada diseno", "Escribe copy, headlines y CTAs finales", "Optimiza meta titles y descripciones SEO", "Sube cambios a su rama libni/cambios"] },
  { name:"Angela Valverde", role:"Assets y Multimedia",  color:"7C3AED", fill:C.lightPurple, tasks:["Prepara imagenes WebP (max 300KB) por pagina", "Exporta logos en SVG con fondo transparente", "Sube videos MP4 al proyecto", "Entrega assets antes de que Andrea los necesite"] },
  { name:"Patricio Dev",    role:"Tech Lead",             color:"9F1239", fill:"FFE4E6",      tasks:["Implementa el diseno aprobado en HTML/Tailwind", "Revisa y hace merge de los Pull Requests", "Mantiene Vercel y GitHub funcionando", "Optimiza velocidad y Core Web Vitals"] },
  { name:"Patricio PO",     role:"Product Owner",         color:C.purple, fill:C.lightPurple, tasks:["Aprueba cada diseno de Andrea antes de implementar", "Da feedback de copy a Libni", "Coordina reuniones semanales de avance", "Sign-off final antes de cada publicacion"] },
];

// ── FLUJO ─────────────────────────────────────────────────────────────────────
const FLUJO = [
  { step:"1", who:"Andrea",      what:"Disena la pagina en Claude Code y sube a su rama" },
  { step:"2", who:"Patricio PO", what:"Revisa la URL de preview y aprueba el diseno" },
  { step:"3", who:"Libni",       what:"Escribe copy y SEO en paralelo (mismos dias)" },
  { step:"4", who:"Patricio Dev",what:"Implementa el diseno aprobado con el copy de Libni" },
  { step:"5", who:"Patricio PO", what:"QA final — revisa en preview antes de publicar" },
  { step:"6", who:"Patricio Dev",what:"Merge a main — pagina publicada en tecnocontrolv.com" },
];

// ── BUILD DOCUMENT ────────────────────────────────────────────────────────────
const children = [];

// COVER
children.push(
  spacer(500),
  para([txt("NUMARIS", {bold:true, size:52, color:C.navy})], {align:AlignmentType.CENTER}),
  para([txt("Calendario de Entregas — Sitio Web", {bold:true, size:34, color:C.blue})], {align:AlignmentType.CENTER}),
  spacer(80),
  para([txt("Junio — Agosto 2026", {size:24, color:C.gray})], {align:AlignmentType.CENTER}),
  para([txt("Version 1.0  •  Confidencial", {size:20, color:C.gray, italic:true})], {align:AlignmentType.CENTER}),
  spacer(500),
  new Paragraph({children:[new PageBreak()]}),
);

// 1. CALENDARIO PRINCIPAL
children.push(sectionTitle("1. Calendario de Entregas"));

const calHeader = new TableRow({
  tableHeader:true,
  children:[
    cell([para([txt("#", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:480}),
    cell([para([txt("Pagina", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:3200}),
    cell([para([txt("Andrea entrega", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:1680}),
    cell([para([txt("En vivo", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:1680}),
    cell([para([txt("Nota", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:2320}),
  ]
});

const calRows = PAGES.map((p,i)=>{
  const isLast = p.num===7;
  return new TableRow({
    children:[
      cell([para([txt(String(p.num), {bold:true, size:18, color:C.blue})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("DDDDDD"), width:480}),
      cell([para([txt(p.page, {bold:true, size:18})])], {fill:p.fill, borders:borders("DDDDDD"), width:3200}),
      cell([para([txt(p.andrea, {size:18, color:C.subtext})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("DDDDDD"), width:1680}),
      cell([para([txt(p.live, {bold:true, size:18, color: isLast?"9F1239":C.green})])], {fill:isLast?"FFF7ED":C.lightGreen, borders:borders("DDDDDD"), width:1680}),
      cell([para([txt(p.tag, {size:17, color:C.subtext, italic:true})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("DDDDDD"), width:2320}),
    ]
  });
});

// Go-live row
const goliveRow = new TableRow({
  children:[
    cell([para([txt("🚀", {size:20})])], {fill:C.navy, borders:borders(C.navy), width:480}),
    cell([para([txt("GO-LIVE — tecnocontrolv.com completo", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:borders(C.navy), width:3200, colSpan:2}),
    cell([para([txt("", {size:18})])], {fill:C.navy, borders:borders(C.navy), width:1680}),
    cell([para([txt("15 Agosto 2026", {bold:true, size:20, color:C.white})])], {fill:"1A5CB0", borders:borders(C.navy), width:1680}),
    cell([para([txt("QA + lanzamiento", {size:17, color:"AABBCC"})])], {fill:C.navy, borders:borders(C.navy), width:2320}),
  ]
});

children.push(
  new Table({
    width:{size:9360, type:WidthType.DXA},
    columnWidths:[480,3200,1680,1680,2320],
    rows:[calHeader, ...calRows, goliveRow],
  }),
  spacer(200),
);

// 2. FLUJO POR ENTREGA
children.push(new Paragraph({children:[new PageBreak()]}));
children.push(sectionTitle("2. Flujo por Cada Entrega"));
children.push(para([txt("Este ciclo se repite para cada una de las 7 paginas.", {size:19, color:C.subtext, italic:true})], {after:140}));

const flujoHeader = new TableRow({
  tableHeader:true,
  children:[
    cell([para([txt("Paso", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:600}),
    cell([para([txt("Quien", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:2200}),
    cell([para([txt("Que hace", {bold:true, size:18, color:C.white})])], {fill:C.navy, borders:noBorders(), width:6560}),
  ]
});

const flujoRows = FLUJO.map((f,i)=>new TableRow({
  children:[
    cell([para([txt(f.step, {bold:true, size:20, color:C.blue})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("DDDDDD"), width:600}),
    cell([para([txt(f.who, {bold:true, size:18})])], {fill:i%2===0?C.lightBlue:C.white, borders:borders("DDDDDD"), width:2200}),
    cell([para([txt(f.what, {size:18})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("DDDDDD"), width:6560}),
  ]
}));

children.push(
  new Table({
    width:{size:9360, type:WidthType.DXA},
    columnWidths:[600,2200,6560],
    rows:[flujoHeader, ...flujoRows],
  }),
  spacer(200),
);

// 3. RESPONSABILIDADES
children.push(sectionTitle("3. Responsabilidades del Equipo"));

TEAM.forEach((m,ti)=>{
  children.push(
    new Table({
      width:{size:9360, type:WidthType.DXA},
      columnWidths:[9360],
      rows:[
        new TableRow({ children:[
          cell([para([txt(m.name, {bold:true, size:22, color:m.color}), txt("  —  "+m.role, {size:19, color:C.subtext})])], {fill:m.fill, borders:noBorders(), width:9360})
        ]}),
        ...m.tasks.map((task,i)=>new TableRow({ children:[
          cell([para([txt("  "+(i+1)+".  "+task, {size:18})])], {fill:i%2===0?C.white:C.lightGray, borders:borders("DDDDDD"), width:9360})
        ]})),
      ],
    }),
    spacer(140),
  );
});

// 4. REGLAS DE COLABORACION
children.push(new Paragraph({children:[new PageBreak()]}));
children.push(sectionTitle("4. Reglas de Colaboracion"));

const REGLAS = [
  { titulo:"Ramas de GitHub", desc:"Cada persona trabaja en su propia rama. Andrea: andrea/diseno — Libni: libni/cambios — Angela: angela/assets. Nunca se sube directo a main sin aprobacion de Patricio PO." },
  { titulo:"URL de preview",  desc:"Vercel genera automaticamente una URL de prueba por cada rama. Andrea comparte su link con Patricio PO para aprobacion antes de implementar. URL fija: numaris-site-git-andrea-diseno-patricionavarro-2243s-projects.vercel.app" },
  { titulo:"Pull Requests",   desc:"Todos los cambios entran a main via Pull Request en github.com/Numaris-marketing/sitio-web/pulls. Patricio PO revisa y aprueba antes del merge." },
  { titulo:"Paralelo",        desc:"Mientras Patricio Dev implementa una pagina, Andrea ya disena la siguiente. Libni entra en el mismo dia que Andrea entrega, no espera al desarrollo." },
  { titulo:"Assets primero",  desc:"Angela debe tener listos los assets (logos, fotos, videos) antes de que Andrea los necesite en cada pagina. Coordinacion via WhatsApp del equipo." },
  { titulo:"No tocar main",   desc:"La rama main es produccion (tecnocontrolv.com). Solo Patricio Dev hace merge a main, siempre con aprobacion de Patricio PO." },
];

REGLAS.forEach((r,i)=>{
  children.push(
    new Table({
      width:{size:9360, type:WidthType.DXA},
      columnWidths:[2200, 7160],
      rows:[new TableRow({ children:[
        cell([para([txt(r.titulo, {bold:true, size:18, color:C.blue})])], {fill:i%2===0?C.lightBlue:"EFF6FF", borders:borders("CCCCCC"), width:2200}),
        cell([para([txt(r.desc, {size:18})])], {fill:i%2===0?C.lightGray:C.white, borders:borders("CCCCCC"), width:7160}),
      ]})],
    }),
  );
});

children.push(spacer(200));

// Closing
children.push(
  para([txt("tecnocontrolv.com  •  Numaris  •  Confidencial  •  Mayo 2026", {size:17, color:C.gray})], {align:AlignmentType.CENTER})
);

// ── DOCUMENT ──────────────────────────────────────────────────────────────────
const doc = new Document({
  styles:{ default:{ document:{ run:{ font:"Arial", size:20 } } } },
  sections:[{
    properties:{
      page:{
        size:{ width:12240, height:15840 },
        margin:{ top:1080, right:1080, bottom:1080, left:1080 },
      }
    },
    headers:{ default: new Header({ children:[
      new Paragraph({
        alignment:AlignmentType.RIGHT,
        border:{bottom:{style:BorderStyle.SINGLE, size:4, color:C.blue, space:60}},
        spacing:{after:0},
        children:[txt("Numaris  —  Calendario de Entregas  |  Jun–Ago 2026", {size:16, color:C.gray})],
      })
    ]})},
    footers:{ default: new Footer({ children:[
      new Paragraph({
        alignment:AlignmentType.CENTER,
        border:{top:{style:BorderStyle.SINGLE, size:4, color:C.midGray, space:60}},
        spacing:{before:0},
        children:[
          txt("tecnocontrolv.com  •  Pagina ", {size:16, color:C.gray}),
          new TextRun({children:[PageNumber.CURRENT], font:"Arial", size:16, color:C.gray}),
          txt(" de ", {size:16, color:C.gray}),
          new TextRun({children:[PageNumber.TOTAL_PAGES], font:"Arial", size:16, color:C.gray}),
        ],
      })
    ]})},
    children,
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync('/Users/patricionavarrohermosillo/Documents/Claude/numaris-site/Numaris_Calendario_Jun-Ago_2026.docx', buf);
  console.log('✅ Done');
}).catch(e=>{ console.error(e); process.exit(1); });
