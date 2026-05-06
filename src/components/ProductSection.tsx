import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DASHBOARD_IMG =
  "https://drive.google.com/thumbnail?id=11bHdaH9oLWBBpjoqt0R0iSmefixJFGun&sz=w1600";
const PLATFORM_IMG =
  "https://drive.google.com/thumbnail?id=1up3gQLtdMJPiK7WicZ0pbBkuo_VwIHvx&sz=w1600";

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Vista ejecutiva de toda tu flota: consumos, alertas, KPIs y rutas activas en tiempo real.",
    img: PLATFORM_IMG,
    fallback: DASHBOARD_IMG,
    stats: [
      { label: "Unidades activas", value: "247" },
      { label: "Ahorro del mes",   value: "$183K" },
      { label: "Alertas resueltas", value: "98.2%" },
    ],
  },
  {
    id: "rastreo",
    label: "Rastreo GPS",
    description: "Mapa en vivo de cada unidad con rutas optimizadas, historial de movimientos y geocercas.",
    img: DASHBOARD_IMG,
    fallback: PLATFORM_IMG,
    stats: [
      { label: "Precisión GPS",    value: "±3 m" },
      { label: "Actualización",    value: "10 seg" },
      { label: "Cobertura",        value: "MX + USA" },
    ],
  },
  {
    id: "combustible",
    label: "Combustible",
    description: "Reportes detallados de consumo por unidad, conductor y ruta. Detecta huachicol al instante.",
    img: PLATFORM_IMG,
    fallback: DASHBOARD_IMG,
    stats: [
      { label: "Ahorro promedio",  value: "28%" },
      { label: "Desvíos detectados", value: "99%" },
      { label: "Integración CFDI",  value: "Nativa" },
    ],
  },
];

export function ProductSection() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <section className="relative py-24 overflow-hidden bg-card/20">
      <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 mb-6">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Plataforma
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-hero-heading">
            El software que tu equipo{" "}
            <span className="text-gradient-primary">realmente usa.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Diseñado para operadores, gerentes y directivos — cada módulo muestra
            exactamente lo que necesitas ver.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                active === t.id
                  ? "bg-primary text-primary-foreground border-primary glow-primary"
                  : "liquid-glass border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: screenshot */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              className="relative rounded-2xl border-2 border-border/60 bg-card overflow-hidden shadow-2xl"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 h-9 bg-card/80 border-b border-border/40">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                  <span className="w-3 h-3 rounded-full bg-green/70" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  app.numaris.io/{tab.id}
                </span>
              </div>

              <div className="aspect-[16/10] relative bg-background/80">
                <img
                  src={tab.img}
                  onError={(e) => { (e.target as HTMLImageElement).src = tab.fallback; }}
                  alt={tab.label}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: description + stats */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active + "_text"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{tab.label}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{tab.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {tab.stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
                    <p className="text-xl font-extrabold text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              <a
                href="#demo"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                Ver demo en vivo →
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
