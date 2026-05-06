import { motion } from "framer-motion";
import { MapPin, Zap, TrendingDown } from "lucide-react";

// Truck/fleet photo from Drive
const TRUCK_IMG =
  "https://drive.google.com/thumbnail?id=1LYcvkJII3P68pfSZ9H6Yobgvg6CQDPwt&sz=w2000";

const CARDS = [
  {
    icon: MapPin,
    color: "text-green",
    bg: "bg-green/10",
    border: "border-green/30",
    title: "Rastreo en vivo",
    body: "Cada unidad visible en el mapa con posición actualizada cada 10 segundos.",
  },
  {
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    title: "Alertas instantáneas",
    body: "Exceso de velocidad, geocercas y mantenimiento predictivo notificados al momento.",
  },
  {
    icon: TrendingDown,
    color: "text-orange",
    bg: "bg-orange/10",
    border: "border-orange/30",
    title: "Reducción de costos",
    body: "Clientes reportan 28% de ahorro en combustible y 40% menos incidentes el primer año.",
  },
];

export function FleetSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Full-bleed truck background */}
      <div className="absolute inset-0">
        <img
          src={TRUCK_IMG}
          alt="Flota de vehículos Numaris"
          className="w-full h-full object-cover object-center"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green/30 bg-green/8 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="text-xs font-semibold text-green tracking-widest uppercase">
                Flota en Control
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-hero-heading leading-tight mb-6">
              Tu flota, visible y{" "}
              <span className="text-gradient-primary">protegida las 24 horas.</span>
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Numaris te da visibilidad completa sobre cada unidad, conductor y ruta —
              desde camiones de carga hasta vehículos ligeros y maquinaria especial.
            </p>

            {/* Mini metric bar */}
            <div className="flex gap-8 pt-2">
              {[
                { value: "12,000+", label: "unidades rastreadas" },
                { value: "99.9%",   label: "uptime garantizado" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-2xl font-extrabold text-primary">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                  className="liquid-glass rounded-2xl border border-border/50 p-5 flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl border ${card.bg} ${card.border} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={card.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
