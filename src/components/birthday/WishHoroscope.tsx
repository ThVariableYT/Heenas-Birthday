"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  horoscopeKeywords,
  horoscopeFallback,
  type HoroscopeReading,
} from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

const ACCENT_RING: Record<HoroscopeReading["accent"], string> = {
  amber: "from-amber-400 via-amber-200 to-rose-300",
  rose: "from-rose-400 via-pink-300 to-amber-200",
  violet: "from-violet-400 via-fuchsia-300 to-rose-200",
  emerald: "from-emerald-400 via-teal-300 to-amber-200",
  sky: "from-sky-400 via-cyan-300 to-amber-200",
};

const ACCENT_GLYPH: Record<HoroscopeReading["accent"], string> = {
  amber: "text-amber-600",
  rose: "text-rose-500",
  violet: "text-violet-500",
  emerald: "text-emerald-500",
  sky: "text-sky-500",
};

/**
 * Generate a horoscope reading based on the words in a sealed wish.
 * Picks all matching keyword readings first; if none, samples from the fallback set
 * using sentiment-based heuristics (wish length, punctuation, tone) so the
 * fallback feels less random and more resonant.
 *
 * Heuristics:
 *  - very short wish (<20 chars)  → "second wind" (punchy, hopeful)
 *  - long wish (>90 chars)        → "becoming" (reflective, expansive)
 *  - punctuation-rich (? or !)    → "kind mirror" (inquisitive / excited)
 *  - wish mentions future tense   → "small brave steps"
 *  - otherwise                    → cycle through all fallbacks by rollSeed
 *
 * Returns a stable selection for a given wish + rollSeed (so re-rolling produces
 * a different draw from the same sentiment bucket).
 */
function generateReading(wish: string, rollSeed: number): HoroscopeReading {
  const text = wish.toLowerCase();
  const matched = horoscopeKeywords
    .filter((k) => k.match.some((w) => text.includes(w)))
    .map((k) => k.reading);

  if (matched.length > 0) {
    return matched[rollSeed % matched.length];
  }

  // Sentiment-based fallback bucket selection
  const byTitle = (title: string) => horoscopeFallback.find((r) => r.title.startsWith(title));
  const bucket: HoroscopeReading[] = [];

  const len = wish.trim().length;
  const punct = (wish.match(/[?!]/g) || []).length;
  const futureWords = ["will", "going to", "want to", "hope", "wish", "dream", "plan", "one day", "someday"];
  const mentionsFuture = futureWords.some((w) => text.includes(w));

  if (len < 20) {
    const r = byTitle("A Year of the Second Wind");
    if (r) bucket.push(r);
  } else if (len > 90) {
    const r = byTitle("A Year That Asks Who You Are Becoming");
    if (r) bucket.push(r);
  }
  if (punct >= 1) {
    const r = byTitle("A Year of the Kind Mirror");
    if (r) bucket.push(r);
  }
  if (mentionsFuture) {
    const r = byTitle("A Year of Small, Brave Steps");
    if (r) bucket.push(r);
  }
  // Always include the full fallback set as a base so re-rolling cycles through more
  if (bucket.length === 0) {
    return horoscopeFallback[rollSeed % horoscopeFallback.length];
  }
  // Interleave: prefer the sentiment bucket, but mix in others as the seed rolls
  const full = [...bucket, ...horoscopeFallback.filter((r) => !bucket.includes(r))];
  return full[rollSeed % full.length];
}

/**
 * WishHoroscope renders a fresh reading whenever the parent remounts it with a
 * new `wish` (the parent does this by passing `key={sealedWish}`). On each
 * mount, the component starts hidden, then reveals after a short delay so the
 * glyph+title animate in cleanly.
 */
export default function WishHoroscope({ wish }: { wish: string | null }) {
  const [seed, setSeed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const incStat = useStatsStore((s) => s.inc);

  // Reveal animation — runs once per mount (i.e. once per new sealed wish)
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  const reading = useMemo(
    () => (wish ? generateReading(wish, seed) : null),
    [wish, seed],
  );

  const reroll = () => {
    setSeed((s) => s + 1);
    setRevealed(false);
    setTimeout(() => setRevealed(true), 250);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + 100,
      count: 18,
      kind: "rainbow",
    });
    playChime(659.25, "sine", 0.7, 0.12);
    incStat("sparklesFired", 1);
  };

  if (!wish || !reading) return null;

  const ring = ACCENT_RING[reading.accent];
  const glyphColor = ACCENT_GLYPH[reading.accent];

  return (
    <motion.div
      className="relative mx-auto mt-10 w-full max-w-lg"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Rotating ornamental ring — tarot-card aura */}
      <motion.div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-40 blur-2xl"
        style={{
          background: `conic-gradient(from 0deg, transparent, rgba(251,191,36,0.4), transparent, rgba(244,63,94,0.3), transparent, rgba(139,92,246,0.3), transparent)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />

      <div className="glass-premium pulse-reveal relative overflow-hidden rounded-[2rem] border border-amber-200/50 p-8 text-center">
        {/* Corner flourishes */}
        <span className="corner-flourish corner-flourish-tl" aria-hidden />
        <span className="corner-flourish corner-flourish-tr" aria-hidden />
        <span className="corner-flourish corner-flourish-bl" aria-hidden />
        <span className="corner-flourish corner-flourish-br" aria-hidden />

        {/* Glyph + label */}
        <motion.div
          className="mb-4 flex flex-col items-center gap-2"
          initial={{ scale: 0, rotate: -90 }}
          animate={revealed ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
        >
          <span
            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${ring} bg-clip-text text-3xl font-bold`}
          >
            <span className={`${glyphColor} drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]`}>
              {reading.glyph}
            </span>
            <span className="absolute inset-0 rounded-full border border-amber-300/50" />
            <motion.span
              className="absolute -inset-1 rounded-full border border-dashed border-amber-400/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
          </span>
          <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.4em] text-amber-700/70">
            the year ahead
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={seed}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-serif-elegant text-xs italic text-stone-500">
              {reading.season}
            </p>
            <h3 className="mt-2 font-serif-elegant text-2xl font-bold leading-snug text-stone-800 sm:text-3xl">
              {reading.title}
            </h3>
            <p className="mx-auto mt-4 max-w-md font-serif-elegant text-base leading-relaxed text-stone-600">
              {reading.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-center gap-3">
          <motion.button
            onClick={reroll}
            className="group inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/70 px-5 py-2 text-xs font-semibold text-amber-700 backdrop-blur transition-colors hover:bg-amber-50"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Draw another reading"
          >
            <motion.span
              animate={{ rotate: [0, 0, 180, 360] }}
              transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1] }}
            >
              ↻
            </motion.span>
            <span>Draw another reading</span>
          </motion.button>
        </div>

        <p className="mt-4 font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-stone-400">
          read from the words in your wish · for play, not prophecy
        </p>
      </div>
    </motion.div>
  );
}
