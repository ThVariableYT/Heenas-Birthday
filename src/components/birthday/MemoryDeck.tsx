"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { memoryCards, type MemoryCard } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

const FAV_KEY = "heena:memory-favorites";
const REVEALED_KEY = "heena:memory-revealed";

function MemoryCardItem({
  card,
  index,
  flipped,
  favorite,
  onFlip,
  onToggleFavorite,
  onOpenReading,
  order,
}: {
  card: MemoryCard;
  index: number;
  flipped: boolean;
  favorite: boolean;
  onFlip: (next: boolean, rect: DOMRect) => void;
  onToggleFavorite: (rect: DOMRect) => void;
  onOpenReading: (cardId: number) => void;
  order: number;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const side = order % 2 === 0 ? -1 : 1;
  const offset = order * 0.08;

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current || flipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 18, ry: x * 22 });
  };

  const handleLeave = () => setTilt({ rx: 0, ry: 0 });

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onFlip(!flipped, rect);
  };

  return (
    <motion.div
      className="relative flex w-full justify-center"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: offset, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-[2rem]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.12), transparent 70%)",
        }}
        animate={{ opacity: flipped ? 0.9 : 0.4 }}
      />

      <div
        className="group relative h-[380px] w-[280px] cursor-pointer perspective focus-ring-visible"
        ref={cardRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            onFlip(!flipped, rect);
          } else if (e.key === "Escape" && flipped) {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            onFlip(false, rect);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Memory card: ${card.front.title}. ${flipped ? "Revealed. Press Enter to close." : "Press Enter to reveal."}`}
        style={{ marginLeft: side > 0 ? "auto" : undefined, marginRight: side < 0 ? "auto" : undefined }}
      >
        <div className="glow-aura" />
        <motion.div
          className="preserve-3d relative h-full w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.rx}deg) rotateY(${flipped ? 180 : 0 + tilt.ry}deg)`,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div
            className={`backface-hidden absolute inset-0 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${card.accent} p-7 shadow-[0_20px_50px_-12px_rgba(244,63,94,0.15)]`}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-stone-500">
                  {card.front.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-amber-600/70">{card.front.glyph}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      onToggleFavorite(rect);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-300/50 bg-white/70 text-rose-500 backdrop-blur transition-all hover:scale-110 hover:bg-rose-50 focus-ring-visible"
                    aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                    aria-pressed={favorite}
                  >
                    <motion.svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill={favorite ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={favorite ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </motion.svg>
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 h-px w-12 bg-amber-500/40" />
                <h3 className="font-serif-elegant text-3xl font-bold leading-tight text-stone-800">
                  {card.front.title}
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-serif-elegant text-xs italic text-stone-500">
                  {flipped ? "tap to close" : "tap to reveal"}
                </span>
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-amber-600/70">↻</span>
                </motion.div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
          </div>

          <div
            className="memory-sheen backface-hidden absolute inset-0 overflow-hidden rounded-[2rem] border border-amber-200/60 bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 p-7 text-amber-50 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-400/70">
                  {card.back.title}
                </span>
                <div className="my-3 h-px w-12 bg-amber-400/40" />
              </div>

              <p className="font-serif-elegant text-base italic leading-relaxed text-amber-100/90">
                &ldquo;{card.back.body}&rdquo;
              </p>

              <div className="flex items-center justify-between">
                <span className="font-serif-elegant text-xs text-rose-300/70">
                  {card.back.signature}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReading(card.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-300 transition-all hover:scale-110 hover:bg-amber-500/20 focus-ring-visible"
                    aria-label={`Open ${card.front.title} in reading mode`}
                    title="Reading mode"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7" />
                    </svg>
                  </button>
                  <span className="text-amber-400/60">✦</span>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function MemoryDeck() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const headingY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set());
  const [favoritesSet, setFavoritesSet] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[]>(memoryCards.map((_, i) => i));
  const incStat = useStatsStore((s) => s.inc);
  const setStat = useStatsStore((s) => s.set);

  // Hydrate favorites + revealed from localStorage
  useEffect(() => {
    try {
      const favRaw = localStorage.getItem(FAV_KEY);
      if (favRaw) {
        const arr = JSON.parse(favRaw) as number[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavoritesSet(new Set(arr));
      }
      // Don't auto-restore revealed set — let the user re-flip; but mark them in stats
      const revRaw = localStorage.getItem(REVEALED_KEY);
      if (revRaw) {
        const arr = JSON.parse(revRaw) as number[];
        setStat("memoriesRevealed", arr.length);
      }
    } catch {
      // no-op
    }
  }, [setStat]);

  // Persist favorites whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favoritesSet)));
    } catch {
      // no-op
    }
    setStat("favoritesPinned", favoritesSet.size);
  }, [favoritesSet, setStat]);

  // Persist revealed + sync stats
  useEffect(() => {
    try {
      localStorage.setItem(REVEALED_KEY, JSON.stringify(Array.from(flippedSet)));
    } catch {
      // no-op
    }
    setStat("memoriesRevealed", flippedSet.size);
  }, [flippedSet, setStat]);

  const handleFlip = useCallback(
    (cardId: number, next: boolean, rect: DOMRect, index: number) => {
      const wasRevealed = flippedSet.has(cardId);
      setFlippedSet((prev) => {
        const nextSet = new Set(prev);
        if (next) nextSet.add(cardId);
        else nextSet.delete(cardId);
        return nextSet;
      });
      if (next && !wasRevealed) {
        sparkle({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          count: 18,
          kind: "rainbow",
        });
        playChime(440 + index * 40, "sine", 0.8, 0.1);
        incStat("sparklesFired", 1);
      } else if (!next) {
        playChime(330, "sine", 0.6, 0.08);
      }
    },
    [flippedSet, incStat],
  );

  const toggleFavorite = useCallback(
    (cardId: number, rect: DOMRect) => {
      const willFavorite = !favoritesSet.has(cardId);
      setFavoritesSet((prev) => {
        const next = new Set(prev);
        if (next.has(cardId)) next.delete(cardId);
        else next.add(cardId);
        return next;
      });
      if (willFavorite) {
        sparkle({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          count: 14,
          kind: "rose",
        });
        playChime(659.25, "sine", 0.6, 0.1);
        incStat("sparklesFired", 1);
      } else {
        playChime(392, "sine", 0.4, 0.08);
      }
    },
    [favoritesSet, incStat],
  );

  const sortedOrder = [...order].sort((a, b) => {
    const aFav = favoritesSet.has(memoryCards[a].id) ? 0 : 1;
    const bFav = favoritesSet.has(memoryCards[b].id) ? 0 : 1;
    return aFav - bFav;
  });

  const revealedCount = flippedSet.size;
  const total = memoryCards.length;
  const allRevealed = revealedCount === total;
  const favoritesCount = favoritesSet.size;

  // Reading-mode overlay state — focused full-screen memory card viewer
  const [readingIndex, setReadingIndex] = useState<number | null>(null);

  // Reading mode keyboard navigation — ArrowLeft / ArrowRight / Escape
  useEffect(() => {
    if (readingIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setReadingIndex((i) => (i === null ? i : (i + 1) % memoryCards.length));
        playChime(440 + Math.random() * 60, "sine", 0.4, 0.08);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setReadingIndex((i) => (i === null ? i : (i - 1 + memoryCards.length) % memoryCards.length));
        playChime(330 + Math.random() * 60, "sine", 0.4, 0.08);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setReadingIndex(null);
        playChime(294, "sine", 0.4, 0.08);
      }
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while overlay is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [readingIndex]);

  const openReading = (cardId: number) => {
    setReadingIndex(cardId - 1); // memoryCards ids are 1-based
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 18, kind: "gold" });
    playChime(659.25, "sine", 0.6, 0.1);
  };

  const closeReading = () => {
    setReadingIndex(null);
    playChime(392, "sine", 0.4, 0.08);
  };

  const revealAll = () => {
    const all = new Set(memoryCards.map((c) => c.id));
    setFlippedSet(all);
    memoryCards.forEach((c, i) => {
      setTimeout(() => playChime(440 + i * 40, "sine", 0.8, 0.1), i * 80);
    });
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 50, kind: "rainbow" });
  };

  const closeAll = () => {
    setFlippedSet(new Set());
    playChime(220, "sine", 0.8, 0.08);
  };

  const shuffle = () => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setFlippedSet(new Set());
    playChime(587.33, "triangle", 0.6, 0.1);
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 20, kind: "gold" });
  };

  return (
    <section ref={sectionRef} className="relative px-4 py-32">
      <motion.div className="mx-auto mb-12 max-w-3xl text-center" style={{ y: headingY }}>
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-10 bg-amber-400/40" />
          <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
            the memory deck
          </span>
          <div className="h-px w-10 bg-amber-400/40" />
        </div>
        <h2 className="font-serif-elegant text-4xl font-bold text-stone-800 sm:text-5xl md:text-6xl">
          Six chapters,
          <br />
          <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
            kept like cards
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-stone-600">
          Each card holds a moment. Tilt it, turn it over — let it tell you the part of the story
          it kept.
        </p>
      </motion.div>

      <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-4">
        <div className="flex w-full items-center gap-4">
          <span className="font-mono-elegant text-xs uppercase tracking-[0.2em] text-stone-500">
            {revealedCount} / {total} revealed
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400"
              animate={{ width: `${(revealedCount / total) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <motion.button
            onClick={allRevealed ? closeAll : revealAll}
            className="group flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/70 px-5 py-2 text-xs font-semibold text-amber-700 backdrop-blur transition-colors hover:bg-amber-50"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={allRevealed ? "close" : "reveal"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                {allRevealed ? (
                  <>
                    <span>↻</span>
                    <span>Close all</span>
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    <span>Reveal all</span>
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            onClick={shuffle}
            className="group flex items-center gap-2 rounded-full border border-rose-300/60 bg-white/70 px-5 py-2 text-xs font-semibold text-rose-700 backdrop-blur transition-colors hover:bg-rose-50"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <motion.span
              animate={{ rotate: [0, 0, 180, 360] }}
              transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1] }}
            >
              ⇆
            </motion.span>
            <span>Shuffle</span>
          </motion.button>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        {sortedOrder.map((cardIndex, displayIndex) => {
          const card = memoryCards[cardIndex];
          return (
            <MemoryCardItem
              key={card.id}
              card={card}
              index={cardIndex}
              order={displayIndex}
              flipped={flippedSet.has(card.id)}
              favorite={favoritesSet.has(card.id)}
              onFlip={(next, rect) => handleFlip(card.id, next, rect, cardIndex)}
              onToggleFavorite={(rect) => toggleFavorite(card.id, rect)}
              onOpenReading={openReading}
            />
          );
        })}
      </div>

      {favoritesCount > 0 && (
        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 text-center">
          <span className="text-rose-500">♥</span>
          <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-stone-500">
            {favoritesCount} {favoritesCount === 1 ? "favorite" : "favorites"} pinned to the top
          </span>
        </div>
      )}

      {/* Reading mode overlay — focused full-screen memory viewer */}
      <AnimatePresence>
        {readingIndex !== null && memoryCards[readingIndex] && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label="Memory reading mode"
            onClick={closeReading}
          >
            {/* Backdrop — deep starry night */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-rose-950/80 to-stone-900 backdrop-blur-md" />
            <div className="reading-stars absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 36 }).map((_, i) => (
                <span
                  key={i}
                  className="reading-star"
                  style={{
                    top: `${(i * 67) % 100}%`,
                    left: `${(i * 91) % 100}%`,
                    animationDelay: `${(i % 8) * 0.35}s`,
                    animationDuration: `${2 + (i % 5) * 0.5}s`,
                  }}
                />
              ))}
            </div>

            {/* Card content — large typography, full focus */}
            <motion.div
              key={readingIndex}
              className="glass-premium relative z-10 w-full max-w-2xl rounded-[2rem] border border-amber-200/30 bg-gradient-to-br from-stone-900/95 via-stone-800/95 to-rose-950/95 p-10 text-amber-50 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-14"
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Corner flourishes */}
              <span className="corner-flourish corner-flourish-tl" aria-hidden />
              <span className="corner-flourish corner-flourish-tr" aria-hidden />
              <span className="corner-flourish corner-flourish-bl" aria-hidden />
              <span className="corner-flourish corner-flourish-br" aria-hidden />

              {/* Top label + counter */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-amber-400/80">{memoryCards[readingIndex].front.glyph}</span>
                  <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.4em] text-amber-400/70">
                    {memoryCards[readingIndex].front.label}
                  </span>
                </div>
                <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-400/60">
                  {readingIndex + 1} / {memoryCards.length}
                </span>
              </div>

              <div className="mb-4 h-px w-16 bg-amber-400/40" />

              {/* Title */}
              <h3 className="font-serif-elegant text-4xl font-bold leading-tight text-amber-50 sm:text-5xl">
                {memoryCards[readingIndex].front.title}
              </h3>

              <p className="mt-2 font-serif-elegant text-sm italic text-rose-300/70">
                {memoryCards[readingIndex].back.title}
              </p>

              {/* Body — large reading typography */}
              <p className="mt-8 font-serif-elegant text-lg italic leading-relaxed text-amber-100/95 sm:text-xl">
                &ldquo;{memoryCards[readingIndex].back.body}&rdquo;
              </p>

              <p className="mt-6 text-right font-serif-elegant text-sm text-rose-300/70">
                {memoryCards[readingIndex].back.signature}
              </p>

              {/* Nav controls */}
              <div className="mt-10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setReadingIndex((i) => (i === null ? i : (i - 1 + memoryCards.length) % memoryCards.length))}
                  className="group flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-amber-200 transition-colors hover:bg-amber-500/20"
                  aria-label="Previous memory"
                >
                  <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {memoryCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReadingIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === readingIndex ? "w-6 bg-amber-400" : "w-1.5 bg-amber-400/30 hover:bg-amber-400/60"
                      }`}
                      aria-label={`Go to memory ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setReadingIndex((i) => (i === null ? i : (i + 1) % memoryCards.length))}
                  className="group flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-amber-200 transition-colors hover:bg-amber-500/20"
                  aria-label="Next memory"
                >
                  <span>Next</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>

              {/* Close + hint */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={closeReading}
                  className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.3em] text-amber-400/50 transition-colors hover:text-amber-300"
                >
                  ✕ close reading
                </button>
              </div>
              <p className="mt-3 text-center font-mono-elegant text-[0.55rem] uppercase tracking-[0.25em] text-amber-400/40">
                ← → to navigate · Esc to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
