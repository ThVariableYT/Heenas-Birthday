"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useStatsStore } from "@/lib/stats-store";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";

type StatItem = {
  key: keyof ReturnType<typeof useStatsStore.getState>["stats"];
  label: string;
  glyph: string;
  accent: string;
  suffix?: string;
};

const STAT_ITEMS: StatItem[] = [
  { key: "memoriesRevealed", label: "memories revealed", glyph: "✦", accent: "from-amber-400 to-rose-400", suffix: "/6" },
  { key: "favoritesPinned", label: "favorites pinned", glyph: "♥", accent: "from-rose-400 to-pink-400" },
  { key: "thoughtsKept", label: "thoughts kept", glyph: "❋", accent: "from-amber-400 to-yellow-400" },
  { key: "complimentsPlucked", label: "compliments plucked", glyph: "✺", accent: "from-violet-400 to-fuchsia-400" },
  { key: "tracksPlayed", label: "tracks played", glyph: "♪", accent: "from-emerald-400 to-teal-400" },
  { key: "candlesBlown", label: "candles blown", glyph: "🕯", accent: "from-amber-500 to-orange-400" },
  { key: "wishesSealed", label: "wishes sealed", glyph: "✸", accent: "from-rose-500 to-amber-400" },
  { key: "sparklesFired", label: "sparkles fired", glyph: "✧", accent: "from-sky-400 to-violet-400" },
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

export default function StatsFinale() {
  const { stats, reset } = useStatsStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [showReset, setShowReset] = useState(false);

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
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-amber-400/40" />
            <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
              your birthday, in numbers
            </span>
            <div className="h-px w-10 bg-amber-400/40" />
          </div>
          <h2 className="font-serif-elegant text-4xl font-bold text-stone-800 sm:text-5xl">
            A little ledger of
            <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
              {" "}
              today
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-stone-600">
            Every tap, every reveal, every kept thought — quietly counted. A small souvenir of the
            time you spent here.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          {STAT_ITEMS.map((item, i) => {
            const value = stats[item.key] as number;
            return (
              <motion.div
                key={item.key}
                className="glass-card group relative overflow-hidden rounded-2xl p-5 text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div
                  className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${item.accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-30`}
                />
                <div className="mb-1 text-lg text-amber-500/70">{item.glyph}</div>
                <div className="font-serif-elegant text-3xl font-bold text-stone-800 sm:text-4xl">
                  <span className={`bg-gradient-to-br ${item.accent} bg-clip-text text-transparent`}>
                    <AnimatedNumber value={value} />
                  </span>
                  {item.suffix && (
                    <span className="font-mono-elegant text-base text-stone-400">{item.suffix}</span>
                  )}
                </div>
                <div className="mt-1 font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-stone-500">
                  {item.label}
                </div>
              </motion.div>
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
    </section>
  );
}
