import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Play, Cpu, Eye, Layers } from "lucide-react";
// hls.js is loaded dynamically only when an .m3u8 source is used

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

const BADGES = [
  { Icon: Cpu,    label: "GPS Satelital"  },
  { Icon: Eye,    label: "Video IA"       },
  { Icon: Layers, label: "ERP Connect"    },
];

const BRANDS = [
  "Unilever", "PepsiCo", "FEMSA", "Grupo Carso",
  "Coppel", "OXXO", "Alsea", "Bimbo", "Liverpool", "Soriana",
];

// ─── Memoized video player with HLS.js support ──────────────────────────────
const VideoPlayer = memo(function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    if (src.endsWith(".m3u8")) {
      // Dynamically import hls.js only for HLS streams
      import("hls.js").then(({ default: Hls }) => {
        if (!ref.current) return;
        if (Hls.isSupported()) {
          hls = new Hls({ autoStartLoad: true });
          hls.loadSource(src);
          hls.attachMedia(ref.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            ref.current?.play().catch(() => {});
          });
        } else if (ref.current.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          ref.current.src = src;
          ref.current.play().catch(() => {});
        }
      });
    } else {
      // Native MP4
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      hls?.destroy();
      video.pause();
      video.src = "";
    };
  }, [src]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    />
  );
});

// ─── Animation variants ──────────────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─── Component ───────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative bg-background overflow-hidden flex flex-col min-h-screen">

      {/* ── Background video ── */}
      <div className="absolute left-0 right-0 h-[80vh] bottom-[35vh] pointer-events-none z-0">
        <VideoPlayer src={VIDEO_URL} />
        {/* Subtle edge fades — keeps the section readable without covering the video */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
      </div>

      {/* ── Subtle radial backing for text legibility ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(6,14,26,0.45) 0%, transparent 100%)",
        }}
      />

      {/* ── Main content ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-10"
      >
        {/* Badges */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
        >
          <span className="text-xs text-muted-foreground mr-1">Integrado con</span>
          {BADGES.map(({ Icon, label }) => (
            <div
              key={label}
              className="liquid-glass flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/50"
            >
              <Icon size={12} className="text-primary" />
              <span className="text-xs text-foreground/75 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-[82px] font-extrabold leading-[1.04] tracking-tight max-w-4xl"
        >
          <span className="text-hero-heading">Controla tu flota</span>{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-primary">con inteligencia real.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed"
        >
          Una sola plataforma para rastreo satelital, control de combustible,
          video&#8209;IA y mantenimiento —{" "}
          <span className="text-foreground/80">todo en tiempo real.</span>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          {/* Solid — dark bg, white border */}
          <button
            className="flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-white border border-white/25 transition-all duration-200 hover:border-white/50 hover:bg-white/5"
            style={{ background: "hsl(213 67% 9%)" }}
          >
            Solicitar demo gratis
            <ArrowRight size={16} />
          </button>

          {/* Glass */}
          <Button variant="heroSecondary" className="px-7 py-3.5 text-base gap-2">
            <Play size={14} className="fill-current" />
            Ver la plataforma
          </Button>
        </motion.div>

      </motion.div>

      {/* ── Logo marquee ── */}
      <div className="relative z-10 pb-12">
        <p className="text-center text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-5">
          Confiado por las empresas líderes de México
        </p>

        <div className="relative overflow-hidden">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex gap-12 w-max animate-marquee">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span
                key={i}
                className="text-sm font-semibold whitespace-nowrap tracking-widest uppercase"
                style={{ color: "hsl(213 20% 40%)" }}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
