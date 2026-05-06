import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Calendar, Phone, Check } from "lucide-react";

const TRUST = [
  "Sin tarjeta de crédito",
  "Implementación en 48 h",
  "Soporte en español 24/7",
  "Contrato flexible",
];

export function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[400px] rounded-full bg-primary/12 blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Empieza hoy
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-hero-heading leading-[1.05] mb-6">
            Controla tu flota con{" "}
            <span className="text-gradient-primary">inteligencia real.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-5 mb-10 leading-relaxed">
            Únete a más de 5,000 empresas que ya confían en Numaris para operar
            de forma más segura, eficiente y rentable.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" className="px-8 py-4 text-base gap-2">
              <Calendar size={16} />
              Solicitar demo gratis
              <ArrowRight size={16} />
            </Button>
            <Button variant="heroSecondary" className="px-8 py-4 text-base gap-2">
              <Phone size={16} />
              Hablar con ventas
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST.map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-green/20 border border-green/40 flex items-center justify-center">
                  <Check size={9} className="text-green" strokeWidth={3} />
                </span>
                {t}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
