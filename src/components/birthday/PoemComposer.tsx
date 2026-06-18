"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

type Mood = "tender" | "joyful" | "cosmic" | "cozy" | "grateful";

type MoodConfig = {
  key: Mood;
  label: string;
  glyph: string;
  accent: string;
  soft: string;
};

const MOODS: MoodConfig[] = [
  { key: "tender",   label: "Tender",   glyph: "❤", accent: "from-rose-400 to-pink-400",     soft: "rgba(244,63,94,0.35)" },
  { key: "joyful",   label: "Joyful",   glyph: "✺", accent: "from-amber-400 to-orange-400",  soft: "rgba(251,191,36,0.35)" },
  { key: "cosmic",   label: "Cosmic",   glyph: "✦", accent: "from-violet-400 to-fuchsia-400", soft: "rgba(167,139,250,0.35)" },
  { key: "cozy",     label: "Cozy",     glyph: "❋", accent: "from-emerald-400 to-teal-400",  soft: "rgba(52,211,153,0.35)" },
  { key: "grateful", label: "Grateful", glyph: "✸", accent: "from-sky-400 to-indigo-400",    soft: "rgba(56,189,248,0.35)" },
];

/** Per-mood lexicon pools — the composer samples one entry from each line pool. */
const LEX: Record<Mood, string[][]> = {
  tender: [
    [
      "Today the world softens around you, {name}",
      "Quietly, the room grows warmer because you are in it, {name}",
      "There is a kind of light that only finds you, {name}",
      "Stay tender, {name}, the year is learning your name",
    ],
    [
      "the kettle hums your song back to the morning",
      "the curtains hold the gold a moment longer",
      "the cat remembers which cushion you prefer",
      "the kettle, the cat, the calm — all wait for you",
    ],
    [
      "Your kindness is not a strategy — it is the weather",
      "Your patience is a small, steady flame",
      "Your listening is a kind of shelter",
      "Your laughter is the room's true architecture",
    ],
    [
      "and somewhere a heart you forgot you mended",
      "and somewhere a door you thought was locked",
      "and somewhere a friend who almost forgot to call",
      "and somewhere a future you haven't met yet",
    ],
    [
      "softens, opens, leans a little closer",
      "unlatches, breathes, lets the light in",
      "remembers, returns, rests against the frame",
      "turns toward you, expectant and unhurried",
    ],
    [
      "You are the part of the year that already feels like home",
      "You are the held breath before the next good thing",
      "You are the long exhale at the end of a hard week",
      "You are the small bravery at the center of every morning",
    ],
    [
      "Stay, {name}. The room was waiting for you.",
      "Stay, {name}. There is no rush today.",
      "Stay, {name}. The light is on your side.",
      "Stay, {name}. You are exactly enough.",
    ],
    [
      "— a small poem, for a tender year.",
      "— kept, like all the best things, slowly.",
      "— and the year leans in to listen.",
      "— and the morning agrees.",
    ],
  ],
  joyful: [
    [
      "Today, {name}, the air is full of confetti",
      "Listen, {name} — the kettle is throwing a party",
      "Up, {name}, the day has ideas about you",
      "Look, {name}, the world has put on its loudest sweater",
    ],
    [
      "your laugh is out there changing the weather",
      "your joy is a small dog that won't stop bringing the ball back",
      "your delight is rewriting the room's whole to-do list",
      "your grin is the kind that starts revolutions in elevators",
    ],
    [
      "There will be improbable jokes",
      "There will be dancing in the kitchen, probably",
      "There will be at least one story you tell for years",
      "There will be cake for breakfast — who's counting",
    ],
    [
      "and a friend who shows up with no reason",
      "and a stranger who hands you the exact right book",
      "and a song you forgot you loved comes back, louder",
      "and the dog across the street learns your name",
    ],
    [
      "because joy, {name}, is mostly paying attention",
      "because joy follows you around like a hopeful stray",
      "because joy was never the goal — it was the byproduct",
      "because joy is your most fluent language",
    ],
    [
      "Stay loud, {name}. The room is listening.",
      "Stay ridiculous, {name}. The world needs it.",
      "Stay bright, {name}. The dark has met its match.",
      "Stay goofy, {name}. The serious stuff can wait.",
    ],
    [
      "You are the part of the year that throws its head back",
      "You are the moment the playlist finally hits",
      "You are the punchline the room was waiting for",
      "You are the song that gets stuck, in the best way",
    ],
    [
      "— a small poem, for a joyful year.",
      "— laughed at, often, by you.",
      "— and the year can't help but laugh along.",
      "— and the cake agrees.",
    ],
  ],
  cosmic: [
    [
      "Tonight, {name}, the stars have read your file",
      "Look up, {name} — the universe is taking notes",
      "Somewhere, {name}, a galaxy is writing you a letter",
      "Out there, {name}, a quiet moon is on your side",
    ],
    [
      "the constellations are rearranging themselves, slowly, in your favor",
      "the light from a star you can't see yet is already on its way",
      "the orbit of one small planet has shifted, just slightly, toward you",
      "the dark matter between things has started to feel less empty",
    ],
    [
      "You are made of starstuff and stubbornness",
      "You are made of nebulae and unanswered emails",
      "You are made of light that took a long time to get here",
      "You are made of the same dust as the moon, mostly",
    ],
    [
      "and the universe, which is famously busy,",
      "and the cosmos, which has terrible handwriting,",
      "and the night sky, which has been holding its breath,",
      "and the dark, which is more patient than it looks,",
    ],
    [
      "is making room for the next good thing you'll do",
      "is quietly drafting your name in bigger letters",
      "is keeping a small window open, just in case",
      "is teaching the planets your favorite song",
    ],
    [
      "Stay vast, {name}. There is room for you out here.",
      "Stay curious, {name}. The dark is full of doors.",
      "Stay wonder-struck, {name}. The stars are paying attention.",
      "Stay small, {name}, in the best way — like a star seen from very far.",
    ],
    [
      "You are the part of the year that asks the big questions",
      "You are the long pause before the universe answers",
      "You are the constellation only you can see",
      "You are the small light at the edge of the map",
    ],
    [
      "— a small poem, for a cosmic year.",
      "— and the stars, mostly, agree.",
      "— written in light that started long ago.",
      "— and the night sky signed it.",
    ],
  ],
  cozy: [
    [
      "Today, {name}, the kettle has strong opinions about you",
      "Pull up a blanket, {name} — the day is on your side",
      "Stay, {name}, the morning has nowhere else to be",
      "Listen, {name}, the rain is practicing your name",
    ],
    [
      "the lamp knows your favorite chapter",
      "the cat has chosen the exact right cushion",
      "the kettle is two minutes from perfect",
      "the bread is rising in the warm spot by the window",
    ],
    [
      "Your slowness is not a flaw — it is a kind of luxury",
      "Your gentleness is the softest thing in the room",
      "Your warmth is the kind that lingers in the cushions",
      "Your steadiness is the floorboard everyone trusts",
    ],
    [
      "and the kettle will be ready when you are",
      "and the book will wait, dog-eared and patient",
      "and the cat will return, eventually, with news",
      "and the morning will keep its slow promises",
    ],
    [
      "because home, {name}, is mostly a feeling you carry",
      "because slowness, {name}, is the rarest luxury",
      "because the kettle has been on your side this whole time",
      "because the soft things know you by name",
    ],
    [
      "Stay wrapped, {name}. The world can wait its turn.",
      "Stay soft, {name}. There is no rush today.",
      "Stay, {name}, the kettle is almost ready.",
      "Stay warm, {name}. The cold has met its match.",
    ],
    [
      "You are the part of the year that wears its slippers all day",
      "You are the long afternoon with no plans",
      "You are the lamp left on for someone running late",
      "You are the second cup, the slow chapter, the unhurried morning",
    ],
    [
      "— a small poem, for a cozy year.",
      "— kept, like a favorite mug, just for you.",
      "— and the kettle agrees.",
      "— and the blanket is on your side.",
    ],
  ],
  grateful: [
    [
      "Today, {name}, the world wants to say a quiet thank you",
      "Listen, {name} — the year has something it's been meaning to tell you",
      "Stay, {name}, there are a few small thanks owed to you",
      "Quietly, {name}, the universe is keeping a list",
    ],
    [
      "for the way you listen with your whole heart",
      "for the way you remember what people said they needed",
      "for the way you show up even when you're tired",
      "for the way you make hard things look gentle",
    ],
    [
      "Thank you for the small kindnesses you've stopped noticing",
      "Thank you for the patience no one thanked you for at the time",
      "Thank you for the laughter you lent to loud rooms",
      "Thank you for the calm you became when the world got loud",
    ],
    [
      "and for the doors you held without looking back",
      "and for the second chances you gave, quietly, again",
      "and for the way you forgave the things you never named",
      "and for the way you kept showing up, even when no one was watching",
    ],
    [
      "because gratitude, {name}, is mostly paying attention",
      "because the best thanks arrive late, in the form of a story",
      "because the people you helped are out there telling your story",
      "because the world keeps a ledger, even when it forgets to say so",
    ],
    [
      "Stay generous, {name}. The world is taking notes.",
      "Stay soft, {name}. The hard things needed that.",
      "Stay, {name}, the thanks are still arriving.",
      "Stay open, {name}. The gratitude is on its way.",
    ],
    [
      "You are the part of the year that gave without keeping score",
      "You are the held door, the second chance, the late-night call",
      "You are the kindness the room didn't know it needed",
      "You are the quiet thank-you at the center of the day",
    ],
    [
      "— a small poem, for a grateful year.",
      "— kept, like the best thanks, a little late.",
      "— and the year says: thank you, {name}.",
      "— and the room agrees.",
    ],
  ],
};

/** Pick a deterministic-but-varied entry from a pool using a seed. */
function pick<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length];
}

/** Compose an 8-line poem for the given mood, name, and seed. */
function composePoem(mood: Mood, name: string, seed: number): string[] {
  const pools = LEX[mood];
  const lines: string[] = [];
  for (let i = 0; i < pools.length; i++) {
    // Vary the seed per line so successive lines don't pick the same offset
    const lineSeed = seed * 7 + i * 13 + i * i;
    const line = pick(pools[i], lineSeed).replace(/\{name\}/g, name);
    lines.push(line);
  }
  return lines;
}

export default function PoemComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mood, setMood] = useState<Mood>("tender");
  const [seed, setSeed] = useState(0);
  const [name, setName] = useState("Heena");
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const incStat = useStatsStore((s) => s.inc);

  const poem = useMemo(() => composePoem(mood, name || "Heena", seed), [mood, name, seed]);
  const moodCfg = useMemo(() => MOODS.find((m) => m.key === mood)!, [mood]);

  // Body scroll lock + Escape to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        playChime(294, "sine", 0.4, 0.08);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Fire a sparkle + chime whenever a new poem is composed
  useEffect(() => {
    if (!open) return;
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 26, kind: "rainbow" });
    playChime(659.25, "sine", 0.8, 0.12);
    incStat("sparklesFired", 1);
  }, [mood, seed, open, incStat]);

  const regenerate = () => setSeed((s) => s + 1);

  const selectMood = (m: Mood) => {
    setMood(m);
    setSeed((s) => s + 1);
  };

  const copyLine = async (line: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(line);
      setCopiedLine(idx);
      setTimeout(() => setCopiedLine(null), 1600);
    } catch {
      // no-op
    }
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 8, kind: "gold" });
    playChime(587.33, "sine", 0.4, 0.08);
  };

  const copyPoem = async () => {
    const text =
      `For ${name || "Heena"} ✦\n\n` +
      poem.join("\n") +
      `\n\n— composed with love, on your day`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    } catch {
      // no-op
    }
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 18, kind: "rainbow" });
    playChime(783.99, "sine", 0.8, 0.12);
    incStat("sparklesFired", 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Birthday poem composer"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-rose-950/80 to-stone-900 backdrop-blur-md" />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-2xl"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/30 bg-gradient-to-br from-stone-50/97 via-amber-50/95 to-rose-50/97 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] sm:p-10 dark:from-stone-900/95 dark:via-stone-800/95 dark:to-rose-950/95 dark:text-amber-50">
              <div className="poem-aura" aria-hidden />

              {/* Corner flourishes */}
              <span className="corner-flourish corner-flourish-tl" aria-hidden />
              <span className="corner-flourish corner-flourish-tr" aria-hidden />
              <span className="corner-flourish corner-flourish-bl" aria-hidden />
              <span className="corner-flourish corner-flourish-br" aria-hidden />

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xl" style={{ color: "var(--card-accent, #b45309)" }}>✦</span>
                      <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.4em] text-amber-700/70 dark:text-amber-300/70">
                        the poem composer
                      </span>
                    </div>
                    <h3 className="font-serif-elegant text-3xl font-bold leading-tight text-stone-800 dark:text-amber-50 sm:text-4xl">
                      A poem,
                      <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
                        {" "}composed for you
                      </span>
                    </h3>
                    <p className="mt-2 font-serif-elegant text-sm italic text-stone-500 dark:text-amber-200/60">
                      Pick a mood. The composer will write eight lines, just for today.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/60 bg-white/70 text-stone-600 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-ring-visible dark:bg-stone-800/70 dark:text-amber-200 dark:hover:bg-stone-700/70"
                    aria-label="Close poem composer"
                  >
                    ✕
                  </button>
                </div>

                {/* Name + mood pickers */}
                <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_2fr]">
                  <label className="block">
                    <span className="mb-1.5 block font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-stone-500 dark:text-amber-300/60">
                      for whom
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 24))}
                      placeholder="Heena"
                      className="w-full rounded-xl border border-amber-300/50 bg-white/80 px-3 py-2 font-serif-elegant text-base text-stone-800 outline-none transition-colors focus:border-amber-400 focus:bg-white focus-ring-visible dark:border-amber-400/30 dark:bg-stone-800/80 dark:text-amber-50 dark:focus:bg-stone-800"
                      aria-label="Name to compose the poem for"
                    />
                  </label>
                  <div>
                    <span className="mb-1.5 block font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-stone-500 dark:text-amber-300/60">
                      mood
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MOODS.map((m) => {
                        const active = m.key === mood;
                        return (
                          <button
                            key={m.key}
                            onClick={() => selectMood(m.key)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus-ring-visible ${
                              active
                                ? `border-transparent bg-gradient-to-r ${m.accent} text-white shadow-md`
                                : "border-amber-300/40 bg-white/70 text-stone-600 hover:bg-amber-50 dark:bg-stone-800/70 dark:text-amber-200 dark:hover:bg-stone-700/70"
                            }`}
                            aria-pressed={active}
                            aria-label={`Mood: ${m.label}`}
                          >
                            <span className="text-sm">{m.glyph}</span>
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Poem card */}
                <div
                  className="relative mb-6 overflow-hidden rounded-2xl border border-amber-200/40 bg-white/70 p-6 dark:border-amber-300/20 dark:bg-stone-900/60"
                  style={{ ["--card-accent" as string]: moodCfg.soft.replace("0.35", "0.85").replace("rgba(", "").replace(")", "").split(",").slice(0, 3).join(",").trim() ? `rgb(${moodCfg.soft.replace("0.35", "0.85").replace("rgba(", "").replace(")", "").split(",").slice(0, 3).join(",").trim()})` : "#b45309" }}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl"
                    style={{ background: moodCfg.soft }}
                    aria-hidden
                  />
                  <div className="relative z-10 space-y-2.5">
                    {poem.map((line, i) => (
                      <div
                        key={`${mood}-${seed}-${i}`}
                        className="group flex items-start gap-2"
                      >
                        <p
                          className="poem-line flex-1 cursor-pointer font-serif-elegant text-base italic leading-relaxed text-stone-700 transition-colors hover:text-amber-700 dark:text-amber-100/90 dark:hover:text-amber-300 sm:text-lg"
                          style={{ animationDelay: `${i * 0.12}s` }}
                          onClick={() => copyLine(line, i)}
                          title="Click to copy this line"
                        >
                          {line}
                        </p>
                        <button
                          onClick={() => copyLine(line, i)}
                          className="mt-1 shrink-0 text-[0.6rem] font-mono-elegant uppercase tracking-[0.2em] text-amber-500/60 opacity-0 transition-opacity group-hover:opacity-100 focus-ring-visible dark:text-amber-300/60"
                          aria-label={`Copy line ${i + 1}`}
                        >
                          {copiedLine === i ? "✓" : "⧉"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={regenerate}
                    className="group flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/80 px-4 py-2 font-mono-elegant text-[0.6rem] uppercase tracking-[0.25em] text-amber-700 transition-colors hover:bg-amber-50 focus-ring-visible dark:bg-stone-800/80 dark:text-amber-200 dark:hover:bg-stone-700/80"
                  >
                    <motion.span
                      animate={{ rotate: [0, 0, 180, 360] }}
                      transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1] }}
                    >
                      ↻
                    </motion.span>
                    <span>Compose again</span>
                  </button>
                  <button
                    onClick={copyPoem}
                    className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2 font-mono-elegant text-[0.6rem] uppercase tracking-[0.25em] text-white shadow-lg shadow-rose-500/20 transition-transform hover:scale-105 focus-ring-visible"
                  >
                    <span>{copiedAll ? "✓ copied — paste it somewhere sweet" : "⧉ copy the poem"}</span>
                  </button>
                </div>

                <p className="mt-4 text-center font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-stone-400 dark:text-amber-300/40">
                  click any line to copy it · Esc to close
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
