import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Con Numaris logramos reducir el robo de combustible a cero en tres meses. El ROI fue inmediato — el sistema se pagó solo en el primer semestre.",
    name: "Carlos Mendoza",
    role: "Director de Operaciones",
    company: "Transportes del Norte",
    initials: "CM",
    color: "bg-primary/20 text-primary",
  },
  {
    quote:
      "Antes tardábamos horas en saber dónde estaban nuestros camiones. Ahora el gerente de flota ve todo en tiempo real desde su celular. Incrementamos la productividad 35%.",
    name: "Laura Vázquez",
    role: "Gerente de Logística",
    company: "Grupo Distribuciones MX",
    initials: "LV",
    color: "bg-green/20 text-green",
  },
  {
    quote:
      "El módulo de video-IA nos salvó de dos accidentes graves. El sistema detectó fatiga del conductor y nos alertó antes de que ocurriera algo irreversible.",
    name: "Roberto Sánchez",
    role: "Director de Seguridad Vial",
    company: "Fletes Industriales SA",
    initials: "RS",
    color: "bg-orange/20 text-orange",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-card/10">
      <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

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
              Casos de Éxito
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-hero-heading">
            Lo que dicen{" "}
            <span className="text-gradient-primary">nuestros clientes.</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="rounded-2xl border border-border/50 bg-card/60 p-7 flex flex-col gap-6 hover:border-border transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
