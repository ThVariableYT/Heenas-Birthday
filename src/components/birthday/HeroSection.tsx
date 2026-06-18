"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { heroSubtitle } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";

const FLOATING_GLYPHS = [
  { glyph: "✦", top: "18%", left: "12%", size: "text-3xl", color: "text-amber-400/50", delay: 0 },
  { glyph: "❋", top: "28%", left: "82%", size: "text-2xl", color: "text-rose-400/50", delay: 0.5 },
  { glyph: "✺", top: "62%", left: "8%", size: "text-4xl", color: "text-violet-400/40", delay: 1 },
  { glyph: "❖", top: "72%", left: "88%", size: "text-3xl", color: "text-emerald-400/40", delay: 1.5 },
  { glyph: "✸", top: "40%", left: "90%", size: "text-xl", color: "text-amber-400/40", delay: 2 },
  { glyph: "✦", top: "80%", left: "20%", size: "text-2xl", color: "text-rose-400/40", delay: 2.5 },
];

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--px", `${x * 30}px`);
      el.style.setProperty("--py", `${y * 30}px`);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  const burst = () => {
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 30, kind: "gold" });
  };

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24"
      style={{ ["--px" as string]: "0px", ["--py" as string]: "0px" }}
    >
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(244,63,94,0.1) 40%, transparent 70%)",
          transform: "translate(calc(-50% + var(--px)), calc(-50% + var(--py)))",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {FLOATING_GLYPHS.map((g, i) => (
        <motion.span
          key={i}
          className={`pointer-events-none absolute ${g.size} ${g.color} animate-glyph-bob`}
          style={{ top: g.top, left: g.left, animationDelay: `${g.delay}s` }}
          aria-hidden
        >
          {g.glyph}
        </motion.span>
      ))}

      <motion.div
        className="pointer-events-none absolute left-[15%] top-[25%] h-2 w-2 rounded-full bg-amber-400/60"
        animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute right-[18%] top-[55%] h-1.5 w-1.5 rounded-full bg-rose-400/60"
        animate={{ y: [0, 15, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1.2 }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute left-[80%] top-[35%] h-1 w-1 rounded-full bg-violet-400/60"
        animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
          <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
            Happy Birthday
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>

        <motion.h1
          className="font-serif-elegant text-7xl font-black leading-none text-stone-800 sm:text-8xl md:text-9xl"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          onClick={burst}
          style={{ cursor: "pointer" }}
        >
          <span className="relative inline-block">
            <span
              className="bg-gradient-to-br from-amber-600 via-rose-500 to-amber-700 bg-clip-text text-transparent text-shadow-glow"
              style={{ transform: "translate(var(--px), var(--py))" }}
            >
              Heena
            </span>
          </span>
        </motion.h1>

        <motion.div
          className="my-8 flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <span className="text-2xl text-amber-500/70">✦</span>
          <span className="font-serif-elegant text-lg italic text-rose-400/80">est. today</span>
          <span className="text-2xl text-amber-500/70">✦</span>
        </motion.div>

        <motion.p
          className="max-w-xl text-balance text-base leading-relaxed text-stone-600 sm:text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          {heroSubtitle}
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-stone-400">
            scroll to begin
          </span>
          <motion.div
            className="flex h-9 w-5 items-start justify-center rounded-full border border-stone-300 p-1"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-2 w-1 rounded-full bg-amber-500/70" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
