"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initAudio, resumeAudio, playChime, playSparkleChord } from "@/lib/audio";
import { sparkle } from "./SparkleCanvas";
import { introLines } from "@/lib/birthday-data";

export default function IntroScreen({ onOpen }: { onOpen: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [opening, setOpening] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01<>/{}[]()=+*-_heenaHEENA$#@!&%".split("");
    const fontSize = 14;
    const columns = Math.floor(window.innerWidth / fontSize);
    const drops: number[] = new Array(columns).fill(1);
    const speeds: number[] = new Array(columns).fill(0).map(() => 0.5 + Math.random() * 1.2);

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(6, 4, 8, 0.08)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const grad = ctx.createLinearGradient(0, y - fontSize * 4, 0, y);
        grad.addColorStop(0, "rgba(244,63,94,0)");
        grad.addColorStop(0.7, "rgba(251,191,36,0.5)");
        grad.addColorStop(1, "rgba(255,255,255,0.95)");
        ctx.fillStyle = grad;
        ctx.fillText(text, x, y);
        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < introLines.length) {
        setVisibleLines((prev) => [...prev, introLines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 380);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    initAudio();
    resumeAudio();
    playSparkleChord();
    playChime(880, "sine", 1.4, 0.18);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    sparkle({ x: cx, y: cy, count: 80, kind: "rainbow" });
    sparkle({ x: cx, y: cy, count: 40, kind: "gold" });
    sparkle({ x: cx, y: cy, count: 40, kind: "rose" });

    setTimeout(() => {
      onOpen();
    }, 1400);
  };

  return (
    <AnimatePresence>
      {!opening && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-[#060408] p-4"
          exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.6 } }}
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
            aria-hidden
          />

          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-8">
            <motion.div
              className="relative mb-8 flex h-36 w-36 cursor-pointer items-center justify-center"
              onClick={handleOpen}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="absolute inset-0 flex animate-spin-slow items-center justify-center rounded-full border border-pink-500/20">
                <div className="select-none font-mono text-[0.5rem] font-extrabold uppercase tracking-[0.25em] text-pink-500/30">
                  &lt;HEENA_INIT&gt; &lt;/HEENA_INIT&gt;
                </div>
              </div>
              <div className="absolute inset-2 animate-spin-slow-reverse rounded-full border border-dashed border-amber-400/30" />
              <div className="absolute inset-4 rounded-full border border-rose-500/15" />

              <motion.svg
                viewBox="0 0 100 100"
                className="relative h-20 w-20 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                animate={hovered ? { rotate: [0, -8, 8, -4, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <defs>
                  <linearGradient id="giftGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <rect x="20" y="42" width="60" height="44" rx="4" fill="url(#giftGrad)" />
                <rect x="18" y="34" width="64" height="12" rx="3" fill="url(#giftGrad)" />
                <rect x="46" y="34" width="8" height="52" fill="#fffbeb" opacity="0.9" />
                <path
                  d="M 50 34 C 38 34 32 22 38 18 C 44 14 50 24 50 34 C 50 24 56 14 62 18 C 68 22 62 34 50 34 Z"
                  fill="#fffbeb"
                  opacity="0.95"
                />
              </motion.svg>

              <motion.div
                className="absolute -inset-2 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)",
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>

            <motion.h1
              className="font-serif-elegant text-center text-4xl font-bold text-stone-100 sm:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200 bg-clip-text text-transparent animate-gradient-pan">
                For Heena
              </span>
            </motion.h1>

            <motion.p
              className="mt-3 max-w-md text-center font-mono-elegant text-xs uppercase tracking-[0.3em] text-stone-400 sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              a birthday, composed in code
            </motion.p>

            <div className="mt-8 w-full max-w-md space-y-1.5 font-mono-elegant text-[0.7rem] text-stone-500">
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-amber-400/60">›</span>
                  <span className="text-stone-400">{String(line ?? "").replace(/^>\s/, "")}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={handleOpen}
              className="hacker-payload-btn mt-10 flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-rose-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: visibleLines.length >= introLines.length ? 1 : 0, y: visibleLines.length >= introLines.length ? 0 : 10 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="hacker-corner corner-tl" />
              <span className="hacker-corner corner-tr" />
              <span className="hacker-corner corner-bl" />
              <span className="hacker-corner corner-br" />
              <span className="relative z-10">Open the gift</span>
              <span className="relative z-10 text-amber-400">→</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
