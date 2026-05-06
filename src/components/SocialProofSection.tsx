const BRANDS = [
  { name: "Unilever",    letter: "U" },
  { name: "PepsiCo",    letter: "P" },
  { name: "FEMSA",      letter: "F" },
  { name: "Grupo Carso",letter: "C" },
  { name: "Coppel",     letter: "Co" },
  { name: "OXXO",       letter: "O" },
  { name: "Alsea",      letter: "A" },
  { name: "Bimbo",      letter: "B" },
  { name: "Liverpool",  letter: "L" },
  { name: "Soriana",    letter: "S" },
];

// Duplicate for seamless loop
const TRACK = [...BRANDS, ...BRANDS];

export function SocialProofSection() {
  return (
    <section className="relative py-14 overflow-hidden border-y border-border/30">
      {/* Subtle top/bottom gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground leading-snug shrink-0 max-w-[160px]">
          Confiado por empresas<br className="hidden sm:block" /> líderes en México
        </p>
        <div className="hidden sm:block w-px h-8 bg-border/60 shrink-0" />
        <p className="text-xs text-muted-foreground/50 italic">
          +5,000 flotillas administradas a nivel nacional
        </p>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee gap-4 w-max">
          {TRACK.map((brand, i) => (
            <div
              key={i}
              className="liquid-glass flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border/40 shrink-0"
            >
              <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                {brand.letter}
              </span>
              <span className="text-sm font-medium text-foreground/70 whitespace-nowrap">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
