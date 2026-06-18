"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sparkle } from "./SparkleCanvas";
import { fireConfetti } from "./ConfettiRain";
import { playChime } from "@/lib/audio";
import { wishMessages } from "@/lib/birthday-data";
import { useStatsStore } from "@/lib/stats-store";
import WishHoroscope from "./WishHoroscope";
import SectionHeader from "./SectionHeader";

type Candle = { id: number; lit: boolean };
type SealedWish = { text: string; at: number };

const STORAGE_KEY = "heena:sealed-wish";
const ALBUM_KEY = "heena:wish-album";

export default function CakeSection() {
  const [candles, setCandles] = useState<Candle[]>([
    { id: 0, lit: true },
    { id: 1, lit: true },
    { id: 2, lit: true },
  ]);
  const [showWish, setShowWish] = useState(false);
  const [wishInput, setWishInput] = useState("");
  const [sealedWish, setSealedWish] = useState<string | null>(null);
  const [hasSealedBefore, setHasSealedBefore] = useState(false);
  const [album, setAlbum] = useState<SealedWish[]>([]);
  const [smoke, setSmoke] = useState<{ id: number; x: number }[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const smokeIdRef = useRef(0);
  const incStat = useStatsStore((s) => s.inc);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSealedWish(saved);
        setHasSealedBefore(true);
      }
      const albumRaw = localStorage.getItem(ALBUM_KEY);
      if (albumRaw) {
        setAlbum(JSON.parse(albumRaw) as SealedWish[]);
      }
    } catch {
      // no-op
    }
  }, []);

  // When all candles go out, seal the wish + celebrate (runs once per transition)
  const allOut = candles.every((c) => !c.lit);
  useEffect(() => {
    if (!allOut) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowWish(true);
    const wish = wishInput.trim() || wishMessages[0];
    setSealedWish(wish);
    try {
      localStorage.setItem(STORAGE_KEY, wish);
      const entry: SealedWish = { text: wish, at: Date.now() };
      setAlbum((prev) => {
        const nextAlbum = [entry, ...prev].slice(0, 12);
        localStorage.setItem(ALBUM_KEY, JSON.stringify(nextAlbum));
        return nextAlbum;
      });
    } catch {
      // no-op
    }
    incStat("wishesSealed", 1);
    incStat("sparklesFired", 1);
    playChime(880, "sine", 1.4, 0.16);
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 50,
      kind: "rainbow",
    });
    fireConfetti(140);
  }, [allOut]);

  const blowOut = (id: number, e: React.MouseEvent) => {
    const target = candles.find((c) => c.id === id);
    if (!target?.lit) return;
    setCandles((prev) => prev.map((c) => (c.id === id ? { ...c, lit: false } : c)));
    incStat("candlesBlown", 1);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Spawn rising smoke wisps at the candle position
    const smokeId = smokeIdRef.current++;
    setSmoke((prev) => [...prev, { id: smokeId, x: rect.left + rect.width / 2 }]);
    setTimeout(() => {
      setSmoke((prev) => prev.filter((s) => s.id !== smokeId));
    }, 2200);

    sparkle({ x: rect.left + rect.width / 2, y: rect.top, count: 20, kind: "smoke" });
    sparkle({ x: rect.left + rect.width / 2, y: rect.top, count: 12, kind: "gold" });
    playChime(587.33, "triangle", 1.0, 0.14);
  };

  const relight = () => {
    setCandles([
      { id: 0, lit: true },
      { id: 1, lit: true },
      { id: 2, lit: true },
    ]);
    setShowWish(false);
    playChime(440, "sine", 0.8, 0.1);
  };

  const handleSectionMove = (e: React.PointerEvent) => {
    const candlesEls = sectionRef.current?.querySelectorAll("[data-candle]");
    if (!candlesEls) return;
    candlesEls.forEach((el) => {
      const candle = el as HTMLElement;
      if (candle.dataset.lit !== "true") return;
      const rect = candle.getBoundingClientRect();
      const padding = 40;
      if (
        e.clientX >= rect.left - padding &&
        e.clientX <= rect.right + padding &&
        e.clientY >= rect.top - padding &&
        e.clientY <= rect.bottom + padding
      ) {
        const id = Number(candle.dataset.candle);
        blowOut(id, { currentTarget: candle } as unknown as React.MouseEvent);
      }
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative px-4 py-32"
      onPointerMove={handleSectionMove}
    >
      <SectionHeader
        number="06"
        eyebrow="the cake"
        accent="amber"
        title={
          <>
            Make a wish,
            <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
              {" "}
              then blow
            </span>
          </>
        }
        subtitle="Three candles. Hover close to each flame, or tap to blow it out. When the last one goes, your wish is sealed."
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center">
        <motion.div
          className="glass-card mb-8 w-full max-w-md rounded-2xl p-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <label className="mb-2 flex items-center gap-2">
            <span className="text-amber-500">✎</span>
            <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
              whisper your wish (optional)
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={wishInput}
              onChange={(e) => setWishInput(e.target.value)}
              maxLength={140}
              placeholder="A wish for Heena, kept between you and the candles…"
              className="w-full rounded-xl border border-amber-200/60 bg-white/70 px-4 py-2.5 font-serif-elegant text-sm italic text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
            />
            <div
              className="wish-count-ring"
              role="status"
              aria-label={`Wish length ${wishInput.length} of 140 characters`}
            >
              <svg viewBox="0 0 44 44" aria-hidden>
                <defs>
                  <linearGradient id="wishRingGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="22" cy="22" r="19" />
                <circle
                  className="ring-fg"
                  cx="22"
                  cy="22"
                  r="19"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - wishInput.length / 140)}
                />
              </svg>
              <span className="ring-label">{wishInput.length}</span>
            </div>
          </div>
        </motion.div>

        <div className="relative flex items-end gap-4">
          {candles.map((c) => (
            <div
              key={c.id}
              data-candle={c.id}
              data-lit={c.lit}
              className="relative flex flex-col items-center"
              onClick={(e) => c.lit && blowOut(c.id, e)}
              style={{ cursor: c.lit ? "pointer" : "default" }}
            >
              <AnimatePresence>
                {c.lit && (
                  <motion.div
                    className="flame mb-1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "backIn" }}
                  />
                )}
              </AnimatePresence>
              <div className="h-12 w-1.5 rounded-full bg-gradient-to-b from-stone-100 to-stone-300 shadow-inner" />
              <div className="h-1.5 w-2 rounded-full bg-stone-400" />
            </div>
          ))}
        </div>

        <div className="cake-arch" aria-hidden>
          <span className="cake-arch-glyph text-xs">✦</span>
          <span className="cake-arch-glyph text-sm">❋</span>
          <span className="cake-arch-glyph text-base">✺</span>
          <span className="cake-arch-glyph text-lg">✦</span>
          <span className="cake-arch-glyph text-base">❖</span>
          <span className="cake-arch-glyph text-sm">✸</span>
          <span className="cake-arch-glyph text-xs">✧</span>
        </div>

        <svg viewBox="0 0 300 180" className="mt-2 w-full max-w-md drop-shadow-[0_20px_40px_rgba(244,63,94,0.18)]">
          <defs>
            <linearGradient id="cakeLayer1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="cakeLayer2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="cakeLayer3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>

          <ellipse cx="150" cy="170" rx="120" ry="8" fill="rgba(180,83,9,0.1)" />

          <path d="M 50 40 Q 60 30 70 40 T 90 40 T 110 40 T 130 40 T 150 40 T 170 40 T 190 40 T 210 40 T 230 40 T 250 40 L 250 70 L 50 70 Z" fill="url(#cakeLayer1)" />
          <rect x="50" y="65" width="200" height="30" fill="url(#cakeLayer1)" />
          <path d="M 50 65 Q 60 75 70 65 T 90 65 T 110 65 T 130 65 T 150 65 T 170 65 T 190 65 T 210 65 T 230 65 T 250 65 L 250 95 L 50 95 Z" fill="url(#cakeLayer2)" opacity="0.95" />

          <rect x="60" y="95" width="180" height="35" fill="url(#cakeLayer3)" />
          <path d="M 60 95 Q 70 105 80 95 T 100 95 T 120 95 T 140 95 T 160 95 T 180 95 T 200 95 T 220 95 T 240 95 L 240 130 L 60 130 Z" fill="url(#cakeLayer2)" opacity="0.9" />

          <rect x="70" y="130" width="160" height="30" fill="url(#cakeLayer1)" />
          <path d="M 70 130 Q 80 140 90 130 T 110 130 T 130 130 T 150 130 T 170 130 T 190 130 T 210 130 T 230 130 L 230 160 L 70 160 Z" fill="url(#cakeLayer3)" opacity="0.85" />

          {[80, 110, 140, 170, 200, 220].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 === 0 ? 50 : 115} r="2.5" fill="#fef3c7" opacity="0.9" />
          ))}

          <path d="M 50 70 Q 150 78 250 70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <path d="M 60 100 Q 150 108 240 100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>

        <AnimatePresence>
          {showWish && sealedWish && (
            <motion.div
              className="glass-premium mt-10 max-w-lg rounded-[2rem] p-8 text-center"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="mb-4 text-3xl"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✦
              </motion.div>
              <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                {hasSealedBefore ? "your sealed wish" : "wish, sealed"}
              </span>
              <p className="mt-3 font-serif-elegant text-2xl italic leading-relaxed text-stone-700">
                &ldquo;{sealedWish}&rdquo;
              </p>
              <p className="mt-4 text-sm text-stone-500">{wishMessages[1]}</p>
              <div className="mt-4 font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-stone-400">
                kept in this browser · relight to update
              </div>
              <motion.button
                onClick={relight}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>↻</span>
                <span>Relight the candles</span>
              </motion.button>

              <WishHoroscope key={sealedWish} wish={sealedWish} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wish album — a small gallery of previously sealed wishes */}
        <AnimatePresence>
          {album.length > 0 && (
            <motion.div
              className="mt-14 w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="glass-card rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">✸</span>
                    <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                      wish album
                    </span>
                    <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 font-mono-elegant text-[0.6rem] font-bold text-amber-700">
                      {album.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAlbum([]);
                      try {
                        localStorage.removeItem(ALBUM_KEY);
                      } catch {
                        // no-op
                      }
                      playChime(294, "sine", 0.5, 0.08);
                    }}
                    className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-rose-500"
                  >
                    clear
                  </button>
                </div>
                <div className="no-scrollbar flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {album.map((w, i) => (
                      <motion.div
                        key={`${w.at}-${i}`}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3 rounded-xl bg-white/50 px-3 py-2"
                      >
                        <span className="mt-0.5 text-amber-400">✦</span>
                        <div className="flex-1">
                          <p className="font-serif-elegant text-sm italic text-stone-600">
                            &ldquo;{w.text}&rdquo;
                          </p>
                          <span className="font-mono-elegant text-[0.5rem] uppercase tracking-[0.2em] text-stone-400">
                            {new Date(w.at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {i === 0 ? " · most recent" : ""}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rising smoke wisps — fixed positioning at the blown candle location */}
      <div className="pointer-events-none fixed inset-0 z-40">
        <AnimatePresence>
          {smoke.map((s) => (
            <motion.div
              key={s.id}
              className="absolute"
              style={{ left: s.x, top: "30%" }}
              initial={{ opacity: 0, scale: 0.4, y: 0 }}
              animate={{
                opacity: [0, 0.45, 0.25, 0],
                scale: [0.4, 1.2, 1.8, 2.2],
                y: [0, -40, -90, -150],
                x: [0, -8, 6, -3],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            >
              <div
                className="h-10 w-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(120,113,108,0.5) 0%, rgba(120,113,108,0.2) 50%, transparent 80%)",
                  filter: "blur(8px)",
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
