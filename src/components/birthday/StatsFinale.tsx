"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useStatsStore } from "@/lib/stats-store";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import StatsExportCard from "./StatsExportCard";
import SectionHeader from "./SectionHeader";
import PoemComposer from "./PoemComposer";
import LetterComposer from "./LetterComposer";

type StatItem = {
  key: keyof ReturnType<typeof useStatsStore.getState>["stats"];
  label: string;
  glyph: string;
  accent: string;
  accentClass: string;
  suffix?: string;
};

const STAT_ITEMS: StatItem[] = [
  { key: "memoriesRevealed", label: "memories revealed", glyph: "✦", accent: "from-amber-400 to-rose-400", accentClass: "accent-amber", suffix: "/6" },
  { key: "favoritesPinned", label: "favorites pinned", glyph: "♥", accent: "from-rose-400 to-pink-400", accentClass: "accent-rose" },
  { key: "thoughtsKept", label: "thoughts kept", glyph: "❋", accent: "from-amber-400 to-yellow-400", accentClass: "accent-gold" },
  { key: "complimentsPlucked", label: "compliments plucked", glyph: "✺", accent: "from-violet-400 to-fuchsia-400", accentClass: "accent-violet" },
  { key: "tracksPlayed", label: "tracks played", glyph: "♪", accent: "from-emerald-400 to-teal-400", accentClass: "accent-emerald" },
  { key: "candlesBlown", label: "candles blown", glyph: "🕯", accent: "from-amber-500 to-orange-400", accentClass: "accent-amber" },
  { key: "wishesSealed", label: "wishes sealed", glyph: "✸", accent: "from-rose-500 to-amber-400", accentClass: "accent-rose" },
  { key: "lanternsReleased", label: "lanterns released", glyph: "🏮", accent: "from-amber-400 to-rose-500", accentClass: "accent-amber" },
  { key: "sparklesFired", label: "sparkles fired", glyph: "✧", accent: "from-sky-400 to-violet-400", accentClass: "accent-sky" },
];

/**
 * Animated number — counts up from the previous value to the new value
 * whenever the value changes. Animates on mount and on every update.
 */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const [pop, setPop] = useState(false);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const duration = 700;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPop(true);
    const popTimer = setTimeout(() => setPop(false), 350);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(popTimer);
    };
  }, [value]);

  return (
    <motion.span animate={pop ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.35 }}>
      {display}
    </motion.span>
  );
}

/**
 * StatCard — glass stat tile with a pointer-driven 3D tilt.
 * The tilt follows the cursor across the card and recenters on leave.
 */
function StatCard({ item, value, index }: { item: StatItem; value: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 12, ry: x * 14 });
  };
  const handleLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.div
      className="stat-tilt-perspective"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={`stat-tilt-surface glass-card group relative overflow-hidden rounded-2xl p-5 text-center ${item.accentClass}`}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        <div
          className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${item.accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-30`}
        />
        {/* Constellation hover dots — tiny connecting stars above the card on hover */}
        <div className="stat-constellation" aria-hidden>
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        {/* Edge sheen — appears on tilt */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(${135 + tilt.ry * 2}deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)`,
          }}
        />
        <div className="mb-1 text-lg" style={{ color: "var(--card-accent)", transform: "translateZ(20px)" }}>
          {item.glyph}
        </div>
        <div
          className="font-serif-elegant text-3xl font-bold text-stone-800 sm:text-4xl dark:text-amber-50"
          style={{ transform: "translateZ(30px)" }}
        >
          <span className={`bg-gradient-to-br ${item.accent} bg-clip-text text-transparent`}>
            <AnimatedNumber value={value} />
          </span>
          {item.suffix && (
            <span className="font-mono-elegant text-base text-stone-400 dark:text-amber-200/50">{item.suffix}</span>
          )}
        </div>
        <div
          className="mt-1 font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-stone-500 dark:text-amber-200/60"
          style={{ transform: "translateZ(15px)" }}
        >
          {item.label}
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsFinale() {
  const { stats, reset } = useStatsStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [showReset, setShowReset] = useState(false);
  const [poemOpen, setPoemOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);

  const handleCelebrate = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      count: 40,
      kind: "rainbow",
    });
    playChime(880, "sine", 1.2, 0.14);
    // also fire a global burst from center
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 30,
      kind: "gold",
    });
  };

  const handleReset = () => {
    reset();
    playChime(330, "sine", 0.5, 0.08);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 16,
      kind: "smoke",
    });
  };

  return (
    <section ref={sectionRef} className="relative px-4 py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          number="08"
          eyebrow="your birthday, in numbers"
          accent="violet"
          subtitleMaxWidth="max-w-md"
          title={
            <>
              A little ledger of
              <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
                {" "}
                today
              </span>
            </>
          }
          subtitle="Every tap, every reveal, every kept thought — quietly counted. A small souvenir of the time you spent here."
        />

        <motion.div
          className="relative grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Radial spotlight bloom behind the stat grid */}
          <div className="stats-spotlight" aria-hidden />
          {STAT_ITEMS.map((item, i) => {
            const value = stats[item.key] as number;
            return (
              <div key={item.key} className="relative z-10">
                <StatCard item={item} value={value} index={i} />
              </div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              onClick={handleCelebrate}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>✦</span>
                <span>Celebrate once more</span>
                <span>✦</span>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>

            <motion.button
              onClick={() => {
                setPoemOpen(true);
                playChime(523.25, "sine", 0.6, 0.1);
                sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 18, kind: "rainbow" });
              }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-violet-300/60 bg-white/80 px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg shadow-violet-500/10 backdrop-blur transition-colors hover:bg-violet-50 dark:bg-stone-800/80 dark:text-violet-200 dark:hover:bg-stone-700/80"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Open the birthday poem composer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>✶</span>
                <span>Compose a poem</span>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>

            <motion.button
              onClick={() => {
                setLetterOpen(true);
                playChime(659.25, "sine", 0.6, 0.1);
                sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 18, kind: "gold" });
              }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-rose-300/60 bg-white/80 px-6 py-3 text-sm font-semibold text-rose-700 shadow-lg shadow-rose-500/10 backdrop-blur transition-colors hover:bg-rose-50 dark:bg-stone-800/80 dark:text-rose-200 dark:hover:bg-stone-700/80"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Open the birthday letter composer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span aria-hidden>✉</span>
                <span>Write her a letter</span>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>
          </div>

          <StatsExportCard />

          <button
            onClick={() => setShowReset((v) => !v)}
            className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-stone-400 transition-colors hover:text-stone-600"
            aria-expanded={showReset}
          >
            {showReset ? "— hide reset —" : "— reset the ledger —"}
          </button>

          {showReset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <p className="max-w-xs text-center font-serif-elegant text-xs italic text-stone-500">
                This clears the counts kept in this browser. The moments themselves stay yours.
              </p>
              <button
                onClick={handleReset}
                className="rounded-full border border-rose-300/60 bg-white/70 px-4 py-1.5 font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-rose-600 transition-colors hover:bg-rose-50"
              >
                ↻ Reset counts
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <PoemComposer open={poemOpen} onClose={() => setPoemOpen(false)} />
      <LetterComposer open={letterOpen} onClose={() => setLetterOpen(false)} />
    </section>
  );
}
