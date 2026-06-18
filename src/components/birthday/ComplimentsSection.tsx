"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { compliments } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";
import SectionHeader from "./SectionHeader";

type Chip = {
  id: number;
  text: string;
  left: number;
  top: number;
  delay: number;
  hue: number;
  custom?: boolean;
};

const HUES = [12, 35, 280, 160, 200, 340];
const CUSTOM_KEY = "heena:custom-compliments";
const PLUCKED_KEY = "heena:plucked-compliments";

/** Ambient floating petal colors — soft warm tones that match the garden */
const PETAL_COLORS = [
  "rgba(251, 191, 36, 0.55)", // amber
  "rgba(244, 63, 94, 0.5)",   // rose
  "rgba(244, 114, 182, 0.5)", // pink
  "rgba(253, 224, 71, 0.55)", // yellow
  "rgba(217, 70, 239, 0.4)",  // fuchsia
  "rgba(251, 113, 133, 0.5)", // light rose
];

function buildChips(custom: string[]): Chip[] {
  const all = [...compliments, ...custom];
  return all.map((text, i) => ({
    id: i,
    text,
    left: 8 + (i % 4) * 24 + Math.random() * 8,
    top: 12 + Math.floor(i / 4) * 32 + Math.random() * 6,
    delay: i * 0.08,
    hue: HUES[i % HUES.length],
    custom: i >= compliments.length,
  }));
}

export default function ComplimentsSection() {
  const [customCompliments, setCustomCompliments] = useState<string[]>([]);
  const [chips, setChips] = useState<Chip[]>(() => buildChips([]));
  const [plucked, setPlucked] = useState<string[]>([]);
  const [lastPlucked, setLastPlucked] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const idRef = useRef(1000);
  const incStat = useStatsStore((s) => s.inc);

  // Ambient floating petals — generated once on mount (memoized)
  const petals = useRef(
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 18,
      duration: 16 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 120,
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      scale: 0.7 + Math.random() * 0.7,
    })),
  ).current;

  // Hydrate custom compliments + plucked history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr) && arr.length > 0) {
          setCustomCompliments(arr);
          setChips(buildChips(arr));
        }
      }
      const pluckedRaw = localStorage.getItem(PLUCKED_KEY);
      if (pluckedRaw) {
        const arr = JSON.parse(pluckedRaw) as string[];
        if (Array.isArray(arr)) {
          setPlucked(arr.slice(0, 6));
        }
      }
    } catch {
      // no-op
    }
  }, []);

  // Persist custom compliments whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customCompliments));
    } catch {
      // no-op
    }
  }, [customCompliments]);

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
    setPlucked((prev) => {
      const next = [chip.text, ...prev].slice(0, 6);
      try {
        localStorage.setItem(PLUCKED_KEY, JSON.stringify(next));
      } catch {
        // no-op
      }
      return next;
    });
    setLastPlucked(chip.text);
    setTimeout(() => setLastPlucked(null), 2500);
    incStat("complimentsPlucked", 1);
    incStat("sparklesFired", 1);
  };

  const refill = () => {
    setChips(buildChips(customCompliments));
    playChime(440, "triangle", 0.6, 0.1);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 20,
      kind: "gold",
    });
  };

  const growCompliment = () => {
    const text = draft.trim();
    if (!text) return;
    const truncated = text.slice(0, 80);
    const nextCustom = [...customCompliments, truncated];
    setCustomCompliments(nextCustom);
    // Add the new chip on top of any remaining chips
    const newId = idRef.current;
    idRef.current = idRef.current + 1;
    const newChip: Chip = {
      id: newId,
      text: truncated,
      left: 12 + Math.random() * 70,
      top: 8 + Math.random() * 70,
      delay: 0,
      hue: HUES[(compliments.length + nextCustom.length) % HUES.length],
      custom: true,
    };
    setChips((prev) => [...prev, newChip]);
    setDraft("");
    setAdding(false);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 18,
      kind: "rainbow",
    });
    playChime(659.25, "sine", 0.8, 0.12);
    incStat("sparklesFired", 1);
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
      <SectionHeader
        number="04"
        eyebrow="the compliments garden"
        accent="violet"
        title={
          <>
            Pluck a few
            <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
              {" "}
              true things
            </span>
          </>
        }
        subtitle="Each floating note is something real. Tap one to lift it into the air and let it drift."
      />

      <div className="relative mx-auto h-[360px] max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-amber-50/60 via-rose-50/40 to-violet-50/60 sm:h-[420px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(251,191,36,0.2), transparent 50%), radial-gradient(circle at 80% 70%, rgba(244,63,94,0.15), transparent 50%)",
          }}
        />

        {/* Ambient floating petals — gentle warm drift across the garden */}
        <div className="garden-petals" aria-hidden>
          {petals.map((p) => (
            <span
              key={p.id}
              className="garden-petal"
              style={{
                left: `${p.left}%`,
                top: `-5%`,
                width: `${14 * p.scale}px`,
                height: `${14 * p.scale}px`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                ["--drift-x" as string]: `${p.drift}px`,
              }}
            />
          ))}
        </div>

        <AnimatePresence>
          {chips.map((chip) => (
            <motion.button
              key={chip.id}
              onClick={(e) => pluck(chip, e)}
              className={`group absolute cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur transition-colors hover:bg-white focus-ring-visible ${
                chip.custom
                  ? "border-violet-400/70 bg-violet-50/80 text-violet-800"
                  : "border-white/70 bg-white/80 text-stone-700"
              }`}
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
              aria-label={`Pluck compliment: ${chip.text}${chip.custom ? " (your own)" : ""}`}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {chip.custom && <span className="text-[0.6rem] text-violet-500" aria-hidden>✶</span>}
                {chip.text}
              </span>
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

      {/* Grow-a-Compliment — let the user plant their own floating note */}
      <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          {adding ? (
            <motion.div
              key="add-form"
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 80))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    growCompliment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="A true thing about Heena…"
                autoFocus
                maxLength={80}
                className="flex-1 rounded-full border border-amber-300/60 bg-white/80 px-5 py-2.5 font-serif-elegant text-sm italic text-stone-700 outline-none transition-colors focus:border-amber-400 focus:bg-white focus-ring-visible dark:bg-stone-800/80 dark:text-amber-100"
                aria-label="Type a custom compliment"
              />
              <div className="flex items-center gap-2">
                <span className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-stone-400">
                  {draft.length}/80
                </span>
                <motion.button
                  onClick={growCompliment}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md focus-ring-visible"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={!draft.trim()}
                  aria-label="Plant this compliment in the garden"
                >
                  ✶ plant
                </motion.button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setDraft("");
                  }}
                  className="rounded-full border border-stone-300/60 bg-white/70 px-3 py-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-50 focus-ring-visible"
                  aria-label="Cancel"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-toggle"
              onClick={() => setAdding(true)}
              className="group flex items-center gap-2 rounded-full border border-violet-300/50 bg-white/70 px-5 py-2 text-xs font-semibold text-violet-700 backdrop-blur transition-colors hover:bg-violet-50 focus-ring-visible dark:bg-stone-800/70 dark:text-violet-200 dark:hover:bg-stone-700/70"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Grow your own compliment in the garden"
            >
              <span className="text-base transition-transform group-hover:rotate-90">✦</span>
              <span>Grow your own compliment</span>
              {customCompliments.length > 0 && (
                <span className="ml-1 rounded-full bg-violet-200/60 px-1.5 py-0.5 font-mono-elegant text-[0.5rem] uppercase tracking-[0.15em] text-violet-700">
                  {customCompliments.length} planted
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
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
