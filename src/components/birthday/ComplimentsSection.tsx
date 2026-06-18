"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { compliments } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

type Chip = {
  id: number;
  text: string;
  left: number;
  top: number;
  delay: number;
  hue: number;
};

const HUES = [12, 35, 280, 160, 200, 340];

function buildChips(): Chip[] {
  return compliments.map((text, i) => ({
    id: i,
    text,
    left: 8 + (i % 4) * 24 + Math.random() * 8,
    top: 12 + Math.floor(i / 4) * 32 + Math.random() * 6,
    delay: i * 0.08,
    hue: HUES[i % HUES.length],
  }));
}

export default function ComplimentsSection() {
  const [chips, setChips] = useState<Chip[]>(() => buildChips());
  const [plucked, setPlucked] = useState<string[]>([]);
  const [lastPlucked, setLastPlucked] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const idRef = useMemo(() => ({ v: 1000 }), []);
  const incStat = useStatsStore((s) => s.inc);

  const pluck = (chip: Chip, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      count: 16,
      kind: "rainbow",
    });
    playChime(523.25 + chip.id * 30, "sine", 0.9, 0.1);
    setChips((prev) => prev.filter((c) => c.id !== chip.id));
    setPlucked((prev) => [chip.text, ...prev].slice(0, 6));
    setLastPlucked(chip.text);
    setTimeout(() => setLastPlucked(null), 2500);
    incStat("complimentsPlucked", 1);
    incStat("sparklesFired", 1);
  };

  const refill = () => {
    setChips(buildChips());
    playChime(440, "triangle", 0.6, 0.1);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 20,
      kind: "gold",
    });
  };

  const shareBouquet = async () => {
    if (plucked.length === 0) return;
    const text =
      `A bouquet for Heena ✦\n\n` +
      plucked.map((t, i) => `${i + 1}. ${t}`).join("\n") +
      `\n\n— picked with love`;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // no-op
    }
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 24,
      kind: "rainbow",
    });
    playChime(783.99, "sine", 0.8, 0.12);
  };

  return (
    <section className="relative px-4 py-32">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-10 bg-amber-400/40" />
          <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
            the compliments garden
          </span>
          <div className="h-px w-10 bg-amber-400/40" />
        </div>
        <h2 className="font-serif-elegant text-4xl font-bold text-stone-800 sm:text-5xl">
          Pluck a few
          <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
            {" "}
            true things
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base text-stone-600">
          Each floating note is something real. Tap one to lift it into the air and let it drift.
        </p>
      </div>

      <div className="relative mx-auto h-[360px] max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-amber-50/60 via-rose-50/40 to-violet-50/60 sm:h-[420px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(251,191,36,0.2), transparent 50%), radial-gradient(circle at 80% 70%, rgba(244,63,94,0.15), transparent 50%)",
          }}
        />

        <AnimatePresence>
          {chips.map((chip) => (
            <motion.button
              key={chip.id}
              onClick={(e) => pluck(chip, e)}
              className="group absolute cursor-pointer rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 shadow-lg backdrop-blur transition-colors hover:bg-white focus-ring-visible"
              style={{
                left: `${chip.left}%`,
                top: `${chip.top}%`,
                ["--hue" as string]: chip.hue,
              }}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
              }}
              exit={{
                opacity: 0,
                y: -120,
                scale: 1.2,
                transition: { duration: 1, ease: "easeOut" },
              }}
              transition={{
                opacity: { duration: 0.4, delay: chip.delay },
                scale: { duration: 0.4, delay: chip.delay },
                y: {
                  duration: 4 + chip.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: chip.delay,
                },
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={`Pluck compliment: ${chip.text}`}
            >
              <span className="relative z-10">{chip.text}</span>
              <span
                className="pointer-events-none absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity group-hover:opacity-60"
                style={{
                  background: `hsl(${chip.hue}, 80%, 70%)`,
                }}
              />
            </motion.button>
          ))}
        </AnimatePresence>

        {chips.length === 0 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-4xl">✦</span>
            <p className="font-serif-elegant text-lg italic text-stone-600">
              You plucked them all. The garden is yours now.
            </p>
            <motion.button
              onClick={refill}
              className="rounded-full border border-amber-300 bg-white/80 px-5 py-2 text-xs font-semibold text-amber-700 backdrop-blur transition-colors hover:bg-amber-50"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              ↻ Grow them back
            </motion.button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {plucked.length > 0 && (
          <motion.div
            className="mx-auto mt-10 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="glass-card rounded-3xl p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span>
                  <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                    plucked · {plucked.length}
                  </span>
                </div>
                <motion.button
                  onClick={shareBouquet}
                  className="flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-white/70 px-3 py-1 font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-amber-700 transition-colors hover:bg-amber-50 focus-ring-visible"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Copy your bouquet of compliments to clipboard"
                >
                  <span>✦</span>
                  <span>share bouquet</span>
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {plucked.map((t, i) => (
                    <motion.span
                      key={`${t}-${i}`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="rounded-full bg-gradient-to-br from-amber-100 to-rose-100 px-3 py-1 font-serif-elegant text-xs italic text-stone-700"
                    >
                      {t}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastPlucked && (
          <motion.div
            className="pointer-events-none fixed left-1/2 top-1/3 z-[58] -translate-x-1/2"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 1.1 }}
            transition={{ duration: 2.4, ease: "easeOut" }}
          >
            <div className="glass-premium max-w-xs rounded-2xl px-6 py-4 text-center shadow-2xl">
              <span className="font-serif-elegant text-base italic text-stone-700">
                &ldquo;{lastPlucked}&rdquo;
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shared && (
          <motion.div
            className="glass-premium fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-bold text-stone-700 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <span className="flex items-center gap-2">
              <span className="text-amber-500">✦</span>
              Bouquet copied — paste it somewhere she&rsquo;ll see
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
