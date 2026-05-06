const LINKS = {
  Soluciones: [
    "Control de Combustible",
    "Rastreo GPS",
    "Video-IA",
    "Mantenimiento",
    "Control de Acceso",
  ],
  Empresa: ["Nosotros", "Blog", "Casos de Éxito", "Prensa", "Carreras"],
  Soporte: ["Centro de Ayuda", "Documentación", "Estado del servicio", "Contacto"],
  Legal: ["Términos de uso", "Privacidad", "Cookies", "Cumplimiento"],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <img
              src="/logo-horizontal-dark.jpg"
              alt="Numaris"
              className="h-9 w-auto object-contain rounded-sm mb-4"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plataforma de IA para flotillas más completa de México.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {["Li", "Tw", "Fb", "Yt"].map((s) => (
                <button
                  key={s}
                  className="w-8 h-8 rounded-lg border border-border/50 bg-card/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-foreground tracking-widest uppercase mb-4">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Numaris Technologies SA de CV. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho en México
          </p>
        </div>
      </div>
    </footer>
  );
}
