"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Lantern = {
  id: number;
  wish: string;
  hue: number; // base hue 0-360 for the lantern's warm glow
  bornAt: number; // performance.now() at release
  xPct: number; // horizontal start position as % of sky (0-100)
  drift: number; // horizontal drift sign + magnitude
  durationMs: number; // total rise duration
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_WISH_LEN = 120;
const STORAGE_KEY = "heena:lanterns-v1";
const RELEASED_COUNT_KEY = "heena:lanterns-released-count";

/** Persistent record of released lanterns (for the "wishes in the sky" list). */
type ReleasedRecord = { wish: string; at: number };
const MAX_RECORDS = 24;

/** A fixed starfield generated once per mount. */
function makeStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 0.5 + Math.random() * 1.8,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
    bright: Math.random() > 0.7,
  }));
}

/** Shooting star — spawns occasionally. */
type ShootingStar = { id: number; angle: number; delay: number };

/* ------------------------------------------------------------------ */
/*  The Lantern SVG — a hand-crafted paper sky-lantern                 */
/* ------------------------------------------------------------------ */

function LanternSvg({ hue, wish, risen }: { hue: number; wish: string; risen: boolean }) {
  // Warm amber→rose gradient tinted by the lantern's hue.
  const top = `hsl(${hue}, 80%, 70%)`;
  const mid = `hsl(${(hue + 8) % 360}, 78%, 58%)`;
  const bot = `hsl(${(hue + 18) % 360}, 70%, 42%)`;
  const glow = `hsl(${hue}, 90%, 65%)`;

  return (
    <div className="lantern-svg-wrap" aria-hidden>
      {/* Outer warm glow halo — pulses gently */}
      <div
        className="lantern-glow"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${glow}55 0%, ${glow}22 35%, transparent 70%)`,
        }}
      />
      <svg
        width="86"
        height="118"
        viewBox="0 0 86 118"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="lantern-svg"
      >
        <defs>
          {/* Body gradient — warm amber→rose tinted by hue */}
          <linearGradient id={`body-${hue}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={bot} />
          </linearGradient>
          {/* Top cap + base plate — darker wood-tone metal */}
          <linearGradient id={`cap-${hue}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a2f1a" />
            <stop offset="100%" stopColor="#2a1810" />
          </linearGradient>
          {/* Inner flame glow — bright warm center */}
          <radialGradient id={`flame-${hue}`} cx="0.5" cy="0.55" r="0.5">
            <stop offset="0%" stopColor="#fff7d6" />
            <stop offset="35%" stopColor="#ffd97a" />
            <stop offset="75%" stopColor={top} stopOpacity="0.5" />
            <stop offset="100%" stopColor={top} stopOpacity="0" />
          </radialGradient>
          {/* Side highlight strip */}
          <linearGradient id={`hi-${hue}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Top hanging loop */}
        <path
          d="M43 4 C 40 4, 38 7, 43 10 C 48 7, 46 4, 43 4 Z"
          stroke="#3a2410"
          strokeWidth="1.2"
          fill="none"
        />
        {/* String to top cap */}
        <line x1="43" y1="9" x2="43" y2="14" stroke="#3a2410" strokeWidth="0.8" />

        {/* Top cap (trapezoid) */}
        <path
          d="M28 14 L58 14 L54 22 L32 22 Z"
          fill={`url(#cap-${hue})`}
          stroke="#1a0e08"
          strokeWidth="0.5"
        />
        <rect x="30" y="13" width="26" height="2" rx="1" fill="#5a3820" />

        {/* Main paper body — rounded rectangle with subtle vertical ribs */}
        <rect
          x="20"
          y="22"
          width="46"
          height="58"
          rx="6"
          fill={`url(#body-${hue})`}
          stroke="#1a0e08"
          strokeWidth="0.5"
        />
        {/* Vertical rib lines (paper folds) */}
        {[28, 36, 43, 50, 58].map((x) => (
          <line
            key={x}
            x1={x}
            y1="24"
            x2={x}
            y2="78"
            stroke="#1a0e08"
            strokeWidth="0.35"
            opacity="0.35"
          />
        ))}
        {/* Inner flame glow — the candle inside */}
        <ellipse cx="43" cy="55" rx="20" ry="24" fill={`url(#flame-${hue})`} />
        {/* Side highlight */}
        <rect x="22" y="24" width="42" height="54" rx="5" fill={`url(#hi-${hue})`} opacity="0.6" />

        {/* Wish text — only visible while the lantern is low enough to read */}
        {!risen && wish && (
          <text
            x="43"
            y="56"
            textAnchor="middle"
            fontSize="5.2"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight="500"
            fill="#2a1408"
            opacity="0.78"
          >
            {wish.slice(0, 18)}
            {wish.length > 18 ? "…" : ""}
          </text>
        )}

        {/* Bottom plate */}
        <path
          d="M30 80 L56 80 L54 86 L32 86 Z"
          fill={`url(#cap-${hue})`}
          stroke="#1a0e08"
          strokeWidth="0.5"
        />
        {/* Tassel */}
        <line x1="43" y1="86" x2="43" y2="96" stroke="#6a3a18" strokeWidth="0.8" />
        <circle cx="43" cy="98" r="2.4" fill="#8a4a20" />
        <line x1="43" y1="100" x2="43" y2="108" stroke="#6a3a18" strokeWidth="0.6" />
        <line x1="40" y1="100" x2="40" y2="106" stroke="#6a3a18" strokeWidth="0.5" />
        <line x1="46" y1="100" x2="46" y2="106" stroke="#6a3a18" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function WishLanternSky() {
  const [wish, setWish] = useState("");
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [releasedCount, setReleasedCount] = useState(0);
  const [records, setRecords] = useState<ReleasedRecord[]>([]);
  const [showLog, setShowLog] = useState(false);
  const idRef = useRef(0);
  const incStat = useStatsStore((s) => s.inc);

  // Generate a stable starfield for this mount.
  const stars = useMemo(() => makeStars(80), []);
  const shootingStars = useMemo<ShootingStar[]>(
    () => [
      { id: 0, angle: -25, delay: 4 },
      { id: 1, angle: -18, delay: 12 },
      { id: 2, angle: -32, delay: 22 },
    ],
    [],
  );

  // Hydrate persisted state.
  useEffect(() => {
    try {
      const count = window.localStorage.getItem(RELEASED_COUNT_KEY);
      if (count) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReleasedCount(parseInt(count, 10) || 0);
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setRecords(JSON.parse(raw) as ReleasedRecord[]);
      }
    } catch {
      // no-op
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Release a lantern                                                */
  /* ---------------------------------------------------------------- */

  const releaseLantern = useCallback(() => {
    const trimmed = wish.trim();
    if (!trimmed) return;

    const id = ++idRef.current;
    // Hue cycles through a warm range (amber → rose → coral → gold).
    const hue = 18 + (id * 17) % 50; // 18-68 → warm amber→gold→rose range
    const xPct = 20 + Math.random() * 60; // start somewhere in the middle 60%
    const drift = (Math.random() - 0.5) * 18; // ±9% drift
    const durationMs = 9000 + Math.random() * 4000; // 9-13s rise

    const lantern: Lantern = {
      id,
      wish: trimmed,
      hue,
      bornAt: performance.now(),
      xPct,
      drift,
      durationMs,
    };

    setLanterns((prev) => [...prev, lantern]);

    // Audio + sparkle celebration
    playChime(523.25, "sine", 1.4, 0.14); // C5
    setTimeout(() => playChime(659.25, "sine", 1.2, 0.12), 120); // E5
    setTimeout(() => playChime(783.99, "sine", 1.6, 0.1), 260); // G5

    sparkle({
      x: window.innerWidth * (xPct / 100),
      y: window.innerHeight * 0.7,
      count: 24,
      kind: "gold",
    });

    // Update stats + persistence
    const newCount = releasedCount + 1;
    setReleasedCount(newCount);
    incStat("lanternsReleased");
    try {
      window.localStorage.setItem(RELEASED_COUNT_KEY, String(newCount));
    } catch {
      // no-op
    }
    const newRecord: ReleasedRecord = { wish: trimmed, at: Date.now() };
    setRecords((prev) => {
      const next = [newRecord, ...prev].slice(0, MAX_RECORDS);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // no-op
      }
      return next;
    });

    setWish("");

    // Auto-remove lantern from DOM after it finishes rising.
    setTimeout(() => {
      setLanterns((prev) => prev.filter((l) => l.id !== id));
    }, durationMs + 600);
  }, [wish, releasedCount, incStat]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const remaining = MAX_WISH_LEN - wish.length;

  return (
    <section className="lantern-sky-section relative overflow-hidden px-4 py-32">
      {/* Night-sky gradient backdrop */}
      <div className="lantern-sky-backdrop" aria-hidden />
      {/* Twinkling stars */}
      <div className="lantern-stars-layer" aria-hidden>
        {stars.map((s) => (
          <span
            key={s.id}
            className={`lantern-star ${s.bright ? "bright" : ""}`}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      {/* Occasional shooting stars */}
      {shootingStars.map((ss) => (
        <span
          key={ss.id}
          className="lantern-shooting-star"
          style={{
            top: `${10 + ss.id * 12}%`,
            left: `${15 + ss.id * 20}%`,
            animationDelay: `${ss.delay}s`,
            transform: `rotate(${ss.angle}deg)`,
          }}
          aria-hidden
        />
      ))}
      {/* Distant mountain silhouette at the bottom */}
      <svg
        className="lantern-mountains"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 120 L0 70 L120 40 L240 65 L360 30 L480 55 L600 25 L720 50 L840 20 L960 45 L1080 30 L1200 55 L1320 35 L1440 60 L1440 120 Z"
          fill="#1a1024"
          opacity="0.85"
        />
        <path
          d="M0 120 L0 85 L100 65 L200 80 L320 55 L440 75 L560 50 L680 72 L800 48 L920 70 L1040 55 L1160 75 L1280 60 L1440 80 L1440 120 Z"
          fill="#0d0818"
          opacity="0.9"
        />
      </svg>

      <div className="relative z-10 mx-auto max-w-3xl">
        <SectionHeader
          number="07"
          eyebrow="release a wish"
          accent="violet"
          subtitleMaxWidth="max-w-lg"
          title={
            <>
              Send a wish into the
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                {" "}night sky
              </span>
            </>
          }
          subtitle="Write something true. Light a paper lantern. Watch it drift up past the stars until it becomes one."
        />

        {/* Counter pill */}
        <motion.div
          className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-violet-300/40 bg-violet-100/40 px-4 py-1.5 backdrop-blur"
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm">🏮</span>
          <span className="font-mono-elegant text-xs uppercase tracking-[0.2em] text-violet-700/80">
            {releasedCount === 0
              ? "no lanterns released yet"
              : `${releasedCount} lantern${releasedCount === 1 ? "" : "s"} released into the sky`}
          </span>
        </motion.div>

        {/* Wish input */}
        <motion.div
          className="lantern-input-card relative mx-auto max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <label
            htmlFor="lantern-wish"
            className="mb-3 block text-center font-mono-elegant text-[0.65rem] uppercase tracking-[0.3em] text-violet-600/70"
          >
            ✎ your wish
          </label>
          <textarea
            id="lantern-wish"
            value={wish}
            onChange={(e) => setWish(e.target.value.slice(0, MAX_WISH_LEN))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                releaseLantern();
              }
            }}
            placeholder="May this year be softer than the last was loud…"
            rows={3}
            className="lantern-wish-input w-full resize-none rounded-2xl border border-violet-200/60 bg-white/80 p-5 text-center font-serif-elegant text-lg leading-relaxed text-stone-700 shadow-lg outline-none transition-all placeholder:text-stone-400/70 focus:border-violet-400 focus:shadow-violet-200/50 dark:bg-stone-900/70 dark:text-stone-200 dark:placeholder:text-stone-500"
            aria-label="Write your wish for the lantern"
          />
          <div className="mt-2 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.2em] text-violet-500/70 transition-colors hover:text-violet-700"
            >
              {showLog ? "▾ hide sky log" : "▸ view sky log"}
            </button>
            <span
              className={`font-mono-elegant text-[0.65rem] tabular-nums ${
                remaining < 20 ? "text-rose-500" : "text-stone-400"
              }`}
            >
              {remaining} chars left
            </span>
          </div>

          <motion.button
            type="button"
            onClick={releaseLantern}
            disabled={!wish.trim()}
            whileHover={{ scale: wish.trim() ? 1.03 : 1 }}
            whileTap={{ scale: wish.trim() ? 0.97 : 1 }}
            className="lantern-release-btn mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 px-6 py-4 font-serif-elegant text-lg font-semibold text-white shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            aria-label="Release the lantern into the sky"
          >
            <span className="text-xl">🏮</span>
            <span>Release the lantern</span>
            <span className="ml-1 hidden text-[0.6rem] uppercase tracking-[0.2em] opacity-70 sm:inline">
              ⌘↵
            </span>
          </motion.button>
        </motion.div>

        {/* Sky log — previously released wishes */}
        <AnimatePresence>
          {showLog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto mt-8 max-w-xl overflow-hidden"
            >
              <div className="lantern-sky-log rounded-2xl border border-violet-200/40 bg-violet-50/50 p-5 backdrop-blur dark:bg-stone-900/50">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.3em] text-violet-700/70">
                    ✦ wishes in the sky
                  </span>
                  <span className="font-mono-elegant text-[0.6rem] text-stone-400">
                    {records.length} kept
                  </span>
                </div>
                {records.length === 0 ? (
                  <p className="py-4 text-center text-sm italic text-stone-400">
                    The sky is still waiting for your first wish.
                  </p>
                ) : (
                  <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {records.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-lg bg-white/60 p-3 dark:bg-stone-800/40"
                      >
                        <span className="mt-0.5 text-sm">🏮</span>
                        <div className="flex-1">
                          <p className="font-serif-elegant text-sm italic text-stone-700 dark:text-stone-300">
                            “{r.wish}”
                          </p>
                          <p className="mt-1 font-mono-elegant text-[0.6rem] uppercase tracking-wider text-stone-400">
                            {new Date(r.at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Released lanterns — floating upward across the whole section */}
        <div className="lantern-sky-stage pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <AnimatePresence>
            {lanterns.map((l) => (
              <motion.div
                key={l.id}
                className="lantern-floating absolute bottom-0"
                style={{ left: `${l.xPct}%` }}
                initial={{ y: 0, opacity: 0, scale: 0.6, rotate: -3 }}
                animate={{
                  y: ["-20vh", "-95vh"],
                  x: [0, l.drift * 4, l.drift * -3, l.drift * 2, 0],
                  opacity: [0, 1, 1, 0.85, 0],
                  scale: [0.6, 1, 1.05, 1, 0.85],
                  rotate: [-3, 2, -2, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: l.durationMs / 1000,
                  ease: "easeOut",
                  times: [0, 0.08, 0.3, 0.7, 1],
                }}
              >
                <LanternSvg hue={l.hue} wish={l.wish} risen={false} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Hint footnote */}
        <p className="mt-12 text-center font-mono-elegant text-[0.65rem] uppercase tracking-[0.3em] text-stone-400">
          ✦ each lantern carries a wish — they drift until they become stars ✦
        </p>
      </div>
    </section>
  );
}
