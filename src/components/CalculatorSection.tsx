import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CalculatorSection() {
  const [units,   setUnits]   = useState(50);
  const [litres,  setLitres]  = useState(120);   // L/day per unit
  const [priceLt, setPriceLt] = useState(23.5);  // MXN per litre

  const savings = useMemo(() => {
    const annualFuel    = units * litres * 365 * priceLt;
    const fuelSaving    = annualFuel * 0.28;          // 28% fuel reduction
    const maintenanceSav = units * 8_500;              // ~$8,500/unit/year
    const incidentSav   = units * 4_200;               // accident/theft prevention
    const total         = fuelSaving + maintenanceSav + incidentSav;
    return { fuelSaving, maintenanceSav, incidentSav, total };
  }, [units, litres, priceLt]);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[100px] pointer-events-none" />

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
            <Calculator size={12} className="text-primary" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Calculadora de Ahorro
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-hero-heading">
            ¿Cuánto puedes{" "}
            <span className="text-gradient-primary">ahorrar con Numaris?</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Ajusta los parámetros de tu flota y calcula el ahorro potencial anual.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-2xl border border-border/50 bg-card/60 p-8 flex flex-col gap-8"
          >
            {[
              {
                label: "Número de vehículos",
                value: units,
                setter: setUnits,
                min: 1, max: 500, step: 1,
                display: String(units),
                unit: "unidades",
              },
              {
                label: "Consumo promedio diario",
                value: litres,
                setter: setLitres,
                min: 20, max: 500, step: 5,
                display: String(litres),
                unit: "litros / día",
              },
              {
                label: "Precio del combustible",
                value: priceLt,
                setter: setPriceLt,
                min: 18, max: 35, step: 0.5,
                display: `$${priceLt.toFixed(1)}`,
                unit: "MXN / litro",
              },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">{field.label}</label>
                  <span className="text-sm font-bold text-primary">
                    {field.display}{" "}
                    <span className="text-xs font-normal text-muted-foreground">{field.unit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={field.value}
                  onChange={(e) => field.setter(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${
                      ((field.value - field.min) / (field.max - field.min)) * 100
                    }%, hsl(var(--border)) 0%)`,
                  }}
                />
              </div>
            ))}
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            {/* Total */}
            <div className="rounded-2xl border border-primary/30 bg-primary/8 p-8 text-center glow-primary">
              <p className="text-sm text-primary font-semibold tracking-wide uppercase mb-2">
                Ahorro anual estimado
              </p>
              <motion.p
                key={savings.total}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-5xl font-extrabold text-primary"
              >
                {fmt(savings.total)}
              </motion.p>
              <p className="text-sm text-muted-foreground mt-2">
                {fmt(savings.total / 12)} / mes promedio
              </p>
            </div>

            {/* Breakdown */}
            {[
              { label: "Ahorro en combustible (28%)",   value: savings.fuelSaving,    color: "bg-primary" },
              { label: "Reducción en mantenimiento",    value: savings.maintenanceSav, color: "bg-green" },
              { label: "Prevención de incidentes",      value: savings.incidentSav,   color: "bg-orange" },
            ].map((row) => (
              <div key={row.label} className="rounded-xl border border-border/40 bg-card/50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${row.color} flex-shrink-0`} />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{fmt(row.value)}</span>
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-center px-4">
              * Estimación basada en promedios de clientes Numaris. El ahorro real puede variar.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
