import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

const NAV_LINKS = [
  { label: "Soluciones",     active: true,  strikethrough: false, hasDropdown: true  },
  { label: "Sectores",       active: false, strikethrough: false, hasDropdown: true  },
  { label: "Empresa",        active: false, strikethrough: false, hasDropdown: false },
  { label: "Casos de Éxito", active: false, strikethrough: true,  hasDropdown: false },
  { label: "Blog",           active: false, strikethrough: false, hasDropdown: false },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="liquid-glass border-b border-border/30">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

          {/* Logo */}
          <a href="#" className="shrink-0">
            <img
              src="/logo-horizontal-dark.jpg"
              alt="Numaris"
              className="h-8 w-auto object-contain rounded-sm"
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                className={cn(
                  "relative flex items-center gap-1 px-3.5 py-2 text-sm rounded-md transition-colors",
                  link.active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  link.strikethrough && "line-through opacity-50 pointer-events-none"
                )}
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown size={13} className="opacity-60" />
                )}
                {/* Gradient border bottom on active */}
                {link.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </button>
            <button
              className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, hsl(210 70% 72%) 0%, hsl(213 50% 48%) 100%)",
              }}
            >
              Solicitar demo
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden liquid-glass border-b border-border/30 px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors",
                link.active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                link.strikethrough && "line-through opacity-40 pointer-events-none"
              )}
            >
              {link.label}
              {link.hasDropdown && <ChevronDown size={14} />}
            </button>
          ))}
          <div className="pt-3 border-t border-border/30 mt-1 flex flex-col gap-2">
            <button className="w-full py-2.5 rounded-full text-sm text-muted-foreground border border-border/50 hover:text-foreground transition-colors">
              Iniciar sesión
            </button>
            <button
              className="w-full py-2.5 rounded-full text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, hsl(210 70% 72%) 0%, hsl(213 50% 48%) 100%)",
              }}
            >
              Solicitar demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
