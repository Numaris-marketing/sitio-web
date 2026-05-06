import { motion } from "framer-motion";
import { Fuel, MapPin, FileText, Shield } from "lucide-react";

const PILLARS = [
  {
    icon: Fuel,
    accent: "hsl(var(--primary))",
    accentBg: "bg-primary/10",
    accentBorder: "border-primary/30",
    title: "Control de Combustible",
    description:
      "Monitorea consumos en tiempo real, detecta desvíos y reduce hasta 30% el gasto en combustible con alertas automáticas.",
    features: ["Sensores de nivel", "Alertas de desvío", "Reportes CFDI"],
  },
  {
    icon: MapPin,
    accent: "hsl(var(--green))",
    accentBg: "bg-green/10",
    accentBorder: "border-green/30",
    title: "Rastreo Satelital",
    description:
      "GPS de alta precisión con historial de rutas, geocercas configurables y seguimiento de conductores en vivo.",
    features: ["GPS en tiempo real", "Geocercas", "Historial 90 días"],
  },
  {
    icon: FileText,
    accent: "hsl(var(--orange))",
    accentBg: "bg-orange/10",
    accentBorder: "border-orange/30",
    title: "Control y Registro",
    description:
      "Centraliza bitácoras, órdenes de servicio, checklist de operador y documentación de cada unidad en un solo lugar.",
    features: ["Bitácora digital", "Checklist NOM-087", "Órdenes de trabajo"],
  },
  {
    icon: Shield,
    accent: "hsl(262 60% 70%)",
    accentBg: "bg-accent/10",
    accentBorder: "border-accent/30",
    title: "Video-IA y Seguridad",
    description:
      "Cámaras con inteligencia artificial que detectan fatiga, distracción y eventos de riesgo antes de que ocurran accidentes.",
    features: ["Detección de fatiga", "Evento en segundos", "Evidencia en nube"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export function SolutionsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

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
              Soluciones
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-hero-heading">
            Todo lo que tu flota necesita,{" "}
            <span className="text-gradient-primary">en una plataforma.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Desde el control de combustible hasta la seguridad vial con IA, Numaris
            unifica cada aspecto de la gestión de flotillas.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                variants={item}
                className="group relative rounded-2xl border border-border/50 bg-card/60 p-6 overflow-hidden transition-all duration-300 hover:border-border hover:bg-card"
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ background: p.accent }}
                />

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl border ${p.accentBg} ${p.accentBorder} flex items-center justify-center mb-5`}
                >
                  <Icon size={18} style={{ color: p.accent }} />
                </div>

                <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {p.description}
                </p>

                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
