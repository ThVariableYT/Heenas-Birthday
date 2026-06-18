"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { jarThoughts } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

type Bubble = { id: number; left: number; size: number; wobble: number; duration: number };

type KeptThought = { id: number; text: string };

export default function LoveJar() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [note, setNote] = useState(jarThoughts[0]);
  const [impact, setImpact] = useState(0);
  const [sparkVisible, setSparkVisible] = useState(false);
  const [kept, setKept] = useState<KeptThought[]>([]);
  const keptIdRef = useRef(0);
  const idRef = useRef(0);
  const phaseRef = useRef(0);
  const impactRef = useRef(0);
  const [pathD, setPathD] = useState("");
  const jarRef = useRef<HTMLDivElement>(null);
  const incStat = useStatsStore((s) => s.inc);
  const setStat = useStatsStore((s) => s.set);

  useEffect(() => {
    let raf = 0;
    const baseY = 78;
    const loop = () => {
      phaseRef.current += 0.08;
      impactRef.current *= 0.94;
      const amp = 2.5 + impactRef.current;
      let d = `M -10,${baseY} `;
      for (let x = -10; x <= 130; x += 5) {
        const slosh = Math.sin(x * 0.05 + phaseRef.current) * amp;
        d += `L ${x},${baseY + slosh} `;
      }
      d += `L 130,140 L -10,140 Z`;
      setPathD(d);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const spawnBubbles = (count: number) => {
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: idRef.current++,
        left: Math.random() * 70 + 15,
        size: Math.random() * 5 + 3,
        wobble: Math.random() * 24 - 12,
        duration: Math.random() * 1.5 + 1.8,
      });
    }
    setBubbles((prev) => [...prev, ...newBubbles]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => !newBubbles.find((nb) => nb.id === b.id)));
    }, 4000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      spawnBubbles(1);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    playChime(783.99, "sine", 1.0, 0.14);
    impactRef.current = 16;
    setImpact(16);
    spawnBubbles(12);

    const rect = jarRef.current?.getBoundingClientRect();
    if (rect) {
      sparkle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 3,
        count: 22,
        kind: "gold",
      });
    }

    setSparkVisible(true);
    setTimeout(() => setSparkVisible(false), 700);

    const drawn = jarThoughts[Math.floor(Math.random() * jarThoughts.length)];
    setNote(drawn);
    setKept((prev) => {
      const next = [{ id: keptIdRef.current++, text: drawn }, ...prev];
      return next.slice(0, 8);
    });
    incStat("thoughtsKept", 1);
    incStat("sparklesFired", 1);
  };

  const clearKept = () => {
    setKept([]);
    setStat("thoughtsKept", 0);
    playChime(330, "sine", 0.5, 0.08);
  };

  return (
    <section className="relative px-4 py-32">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-10 bg-amber-400/40" />
          <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
            a jar of kept thoughts
          </span>
          <div className="h-px w-10 bg-amber-400/40" />
        </div>
        <h2 className="font-serif-elegant text-4xl font-bold text-stone-800 sm:text-5xl">
          Things I&rsquo;ve been
          <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
            {" "}
            meaning to say
          </span>
        </h2>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-center">
        <motion.div
          ref={jarRef}
          className="relative cursor-pointer touch-none"
          onClick={handleClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          <div
            className="pointer-events-none absolute -inset-6 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)",
            }}
          />

          <svg viewBox="0 0 120 150" className="h-72 w-56 drop-shadow-[0_20px_40px_rgba(244,63,94,0.15)]">
            <defs>
              <linearGradient id="jarGlass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
              </linearGradient>
              <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <clipPath id="jarClip">
                <path d="M 25 30 L 25 130 Q 25 140 35 140 L 85 140 Q 95 140 95 130 L 95 30 Z" />
              </clipPath>
            </defs>

            <rect x="22" y="20" width="76" height="14" rx="4" fill="url(#jarGlass)" stroke="rgba(180,83,9,0.2)" strokeWidth="0.5" />
            <path
              d="M 25 30 L 25 130 Q 25 140 35 140 L 85 140 Q 95 140 95 130 L 95 30 Z"
              fill="url(#jarGlass)"
              stroke="rgba(180,83,9,0.25)"
              strokeWidth="0.8"
            />

            <g clipPath="url(#jarClip)">
              {pathD && <path d={pathD} fill="url(#liquid)" opacity="0.9" />}
              {bubbles.map((b) => (
                <circle
                  key={b.id}
                  cx={20 + b.left}
                  cy={130}
                  r={b.size}
                  fill="rgba(255,255,255,0.9)"
                  style={{
                    animation: `float-bubble ${b.duration}s linear forwards`,
                    ["--wobble" as string]: `${b.wobble}px`,
                  }}
                />
              ))}
            </g>

            <ellipse cx="60" cy="30" rx="35" ry="4" fill="rgba(180,83,9,0.1)" />

            <path
              d="M 30 18 Q 60 12 90 18"
              fill="none"
              stroke="rgba(180,83,9,0.4)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />

            <text
              x="60"
              y="80"
              textAnchor="middle"
              className="font-serif-elegant"
              fontSize="10"
              fill="rgba(120,53,15,0.6)"
              fontStyle="italic"
            >
              love, kept
            </text>
          </svg>

          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 text-amber-400"
            animate={sparkVisible ? { scale: [0.5, 1.3], opacity: [0, 1, 0], y: [0, -40] } : {}}
            transition={{ duration: 0.7 }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2 L13.5 9 L21 10 L15 14.5 L17 22 L12 18 L7 22 L9 14.5 L3 10 L10.5 9 Z" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          className="glass-premium w-full max-w-md rounded-[2rem] p-8"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-amber-500">❋</span>
            <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
              today&rsquo;s drawn thought
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="font-serif-elegant text-xl italic leading-relaxed text-stone-700"
            >
              &ldquo;{note}&rdquo;
            </motion.p>
          </AnimatePresence>
          <div className="mt-6 flex items-center justify-between">
            <span className="font-serif-elegant text-xs text-stone-400">
              — tap the jar to draw another
            </span>
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/50 text-amber-600"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ✦
            </motion.div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {kept.length > 0 && (
          <motion.div
            className="mx-auto mt-14 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card rounded-3xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span>
                  <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                    kept thoughts
                  </span>
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 font-mono-elegant text-[0.6rem] font-bold text-amber-700">
                    {kept.length}
                  </span>
                </div>
                <button
                  onClick={clearKept}
                  className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-rose-500"
                >
                  clear
                </button>
              </div>
              <div className="no-scrollbar flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {kept.map((k) => (
                    <motion.div
                      key={k.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-2 rounded-xl bg-white/50 px-3 py-2"
                    >
                      <span className="mt-1 text-amber-400">·</span>
                      <span className="font-serif-elegant text-sm italic text-stone-600">
                        {k.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
