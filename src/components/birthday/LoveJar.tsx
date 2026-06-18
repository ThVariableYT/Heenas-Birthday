"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { jarThoughts } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";
import SectionHeader from "./SectionHeader";

type Bubble = { id: number; left: number; size: number; wobble: number; duration: number };

type KeptThought = { id: number; text: string; favorite: boolean };

const W = 1080;
const H = 1350;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawKeptCard(thoughts: KeptThought[], favorites: Set<number>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // === Background — warm amber/rose gradient ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fff7ed");
  bg.addColorStop(0.5, "#fef3c7");
  bg.addColorStop(1, "#fce7f3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Aurora washes
  const aurora1 = ctx.createRadialGradient(W * 0.18, H * 0.08, 0, W * 0.18, H * 0.08, 460);
  aurora1.addColorStop(0, "rgba(251,191,36,0.4)");
  aurora1.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = aurora1;
  ctx.fillRect(0, 0, W, H);

  const aurora2 = ctx.createRadialGradient(W * 0.85, H * 0.9, 0, W * 0.85, H * 0.9, 480);
  aurora2.addColorStop(0, "rgba(244,63,94,0.32)");
  aurora2.addColorStop(1, "rgba(244,63,94,0)");
  ctx.fillStyle = aurora2;
  ctx.fillRect(0, 0, W, H);

  // === Double-rule border with corner flourishes ===
  ctx.strokeStyle = "rgba(180,83,9,0.35)";
  ctx.lineWidth = 1.5;
  roundedRect(ctx, 40, 40, W - 80, H - 80, 24);
  ctx.stroke();
  ctx.strokeStyle = "rgba(180,83,9,0.2)";
  ctx.lineWidth = 1;
  roundedRect(ctx, 52, 52, W - 104, H - 104, 18);
  ctx.stroke();

  const drawCorner = (cx: number, cy: number, fx: boolean, fy: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
    ctx.strokeStyle = "rgba(180,83,9,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 8);
    ctx.quadraticCurveTo(0, 0, 8, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, 14, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(180,83,9,0.5)";
    ctx.fill();
    ctx.restore();
  };
  drawCorner(70, 70, false, false);
  drawCorner(W - 70, 70, true, false);
  drawCorner(70, H - 70, false, true);
  drawCorner(W - 70, H - 70, true, true);

  // === Header ===
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(180,83,9,0.7)";
  ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("• K E P T   W I T H   L O V E •", W / 2, 150);

  ctx.font = "700 76px 'Playfair Display', serif";
  const titleGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
  titleGrad.addColorStop(0, "#b45309");
  titleGrad.addColorStop(0.5, "#e11d48");
  titleGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = titleGrad;
  ctx.fillText("For Heena", W / 2, 240);

  ctx.font = "italic 26px 'Playfair Display', serif";
  ctx.fillStyle = "rgba(68,64,60,0.75)";
  ctx.fillText("things i've been meaning to say", W / 2, 290);

  // Ornamental divider
  ctx.strokeStyle = "rgba(180,83,9,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 320);
  ctx.lineTo(W / 2 - 18, 320);
  ctx.moveTo(W / 2 + 18, 320);
  ctx.lineTo(W / 2 + 120, 320);
  ctx.stroke();
  ctx.font = "20px serif";
  ctx.fillStyle = "rgba(180,83,9,0.6)";
  ctx.fillText("❋", W / 2, 327);

  // === Thought cards ===
  const gridX = 100;
  const gridY = 380;
  const cellW = (W - 200 - 30) / 2;
  const cellH = 170;
  const gap = 30;

  thoughts.slice(0, 8).forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);
    const isFav = favorites.has(t.id);

    // Card panel
    roundedRect(ctx, x, y, cellW, cellH, 20);
    const panel = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
    if (isFav) {
      panel.addColorStop(0, "rgba(254, 242, 237, 0.95)");
      panel.addColorStop(1, "rgba(254, 205, 211, 0.85)");
    } else {
      panel.addColorStop(0, "rgba(255,255,255,0.88)");
      panel.addColorStop(1, "rgba(255,255,255,0.55)");
    }
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = isFav ? "rgba(225,29,72,0.35)" : "rgba(180,83,9,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Soft accent glow
    const glow = ctx.createRadialGradient(x + 40, y + 40, 0, x + 40, y + 40, 110);
    glow.addColorStop(0, isFav ? "rgba(244,63,94,0.35)" : "rgba(251,191,36,0.32)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fill();

    // Star marker for favorites
    ctx.textAlign = "left";
    ctx.font = "28px serif";
    ctx.fillStyle = isFav ? "#e11d48" : "rgba(180,83,9,0.55)";
    ctx.fillText(isFav ? "★" : "❋", x + 26, y + 52);

    // Thought text — wrap manually
    ctx.font = "italic 22px 'Playfair Display', serif";
    ctx.fillStyle = "rgba(68,64,60,0.9)";
    const maxWidth = cellW - 56;
    const words = t.text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const visibleLines = lines.slice(0, 4);
    visibleLines.forEach((l, li) => {
      ctx.fillText(l, x + 28, y + 90 + li * 28);
    });

    // Tiny quote marks
    ctx.textAlign = "right";
    ctx.font = "italic 16px 'Playfair Display', serif";
    ctx.fillStyle = "rgba(180,83,9,0.4)";
    ctx.fillText("✦", x + cellW - 24, y + cellH - 18);
  });

  // === Footer ===
  const footerY = H - 180;
  ctx.strokeStyle = "rgba(180,83,9,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, footerY);
  ctx.lineTo(W / 2 + 200, footerY);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "italic 22px 'Playfair Display', serif";
  ctx.fillStyle = "rgba(120,53,15,0.7)";
  ctx.fillText("Gathered slowly, kept tenderly.", W / 2, footerY + 35);
  ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "rgba(120,53,15,0.55)";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ctx.fillText(`gathered on ${date}`, W / 2, footerY + 65);

  ctx.font = "600 16px 'Playfair Display', serif";
  ctx.fillStyle = "rgba(180,83,9,0.5)";
  ctx.fillText("❋  H  ❋", W / 2, footerY + 100);

  return canvas;
}

export default function LoveJar() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [note, setNote] = useState(jarThoughts[0]);
  const [impact, setImpact] = useState(0);
  const [sparkVisible, setSparkVisible] = useState(false);
  const [kept, setKept] = useState<KeptThought[]>([]);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const keptIdRef = useRef(0);
  const idRef = useRef(0);
  const phaseRef = useRef(0);
  const impactRef = useRef(0);
  const fontsReadyRef = useRef(false);
  const [pathD, setPathD] = useState("");
  const jarRef = useRef<HTMLDivElement>(null);
  const incStat = useStatsStore((s) => s.inc);
  const setStat = useStatsStore((s) => s.set);

  /** Ensure Google Fonts are loaded so canvas keepsake uses premium typography. */
  const ensureFonts = useCallback(async () => {
    if (fontsReadyRef.current) return;
    try {
      const doc = document as Document & { fonts?: FontFaceSet };
      if (doc.fonts) {
        await Promise.all([
          doc.fonts.load("700 76px 'Playfair Display'", "For Heena"),
          doc.fonts.load("italic 22px 'Playfair Display'", "Gathered slowly, kept tenderly."),
          doc.fonts.load("italic 26px 'Playfair Display'", "things i've been meaning to say"),
          doc.fonts.load("600 22px 'Plus Jakarta Sans'", "KEPT WITH LOVE"),
          doc.fonts.load("500 14px 'Plus Jakarta Sans'", "gathered on"),
        ]);
        await doc.fonts.ready;
      }
      fontsReadyRef.current = true;
    } catch {
      // no-op
    }
  }, []);

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
      const next = [{ id: keptIdRef.current++, text: drawn, favorite: false }, ...prev];
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

  const toggleFavorite = (id: number) => {
    setKept((prev) => prev.map((k) => (k.id === id ? { ...k, favorite: !k.favorite } : k)));
    const target = kept.find((k) => k.id === id);
    if (target && !target.favorite) {
      playChime(659.25, "sine", 0.5, 0.1);
      sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 12, kind: "rose" });
    } else {
      playChime(392, "sine", 0.4, 0.08);
    }
  };

  const shareKept = async () => {
    const favorites = kept.filter((k) => k.favorite);
    const source = favorites.length > 0 ? favorites : kept;
    if (source.length === 0) return;
    const lines = source.map((k, i) => `${i + 1}. ${k.text}`);
    const heading = favorites.length > 0
      ? `Kept thoughts for Heena ✦ (her favorites)`
      : `Kept thoughts for Heena ✦`;
    const text = `${heading}\n\n${lines.join("\n")}\n\n— gathered with love`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "For Heena", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // user cancelled or clipboard unavailable — no-op
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2600);
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 18, kind: "rainbow" });
    playChime(784, "sine", 0.7, 0.1);
  };

  const exportKeptImage = useCallback(async () => {
    if (kept.length === 0) return;
    setExportBusy(true);
    try {
      await ensureFonts();
      // Yield to next frame so the spinner can paint before heavy canvas work
      await new Promise((r) => requestAnimationFrame(r));
      const favorites = new Set(kept.filter((k) => k.favorite).map((k) => k.id));
      const canvas = drawKeptCard(kept, favorites);
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `for-heena-kept-thoughts-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 24, kind: "rainbow" });
      playChime(880, "sine", 0.9, 0.12);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 2800);
    } finally {
      setExportBusy(false);
    }
  }, [kept, ensureFonts]);

  return (
    <section className="relative px-4 py-32">
      <SectionHeader
        number="03"
        eyebrow="a jar of kept thoughts"
        accent="amber"
        title={
          <>
            Things I&rsquo;ve been
            <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
              {" "}
              meaning to say
            </span>
          </>
        }
      />

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

          {/* Premium light-sweep sheen across the jar glass */}
          <div className="jar-sheen rounded-[2.5rem]" aria-hidden />

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
                  {kept.some((k) => k.favorite) && (
                    <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 font-mono-elegant text-[0.55rem] font-bold text-rose-600">
                      ★ {kept.filter((k) => k.favorite).length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportKeptImage}
                    disabled={exportBusy || kept.length === 0}
                    className="flex items-center gap-1.5 font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-rose-600 transition-colors hover:text-rose-800 disabled:cursor-wait disabled:opacity-50"
                    aria-label="Download kept thoughts as a PNG keepsake"
                    title="Download as PNG keepsake"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={exportBusy ? "animate-spin" : ""}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span>{exportBusy ? "drawing…" : "image"}</span>
                  </button>
                  <button
                    onClick={shareKept}
                    className="flex items-center gap-1.5 font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-amber-600 transition-colors hover:text-amber-800"
                    aria-label="Share kept thoughts"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span>share</span>
                  </button>
                  <button
                    onClick={clearKept}
                    className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-rose-500"
                  >
                    clear
                  </button>
                </div>
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
                      className={`flex items-start gap-2 rounded-xl px-3 py-2 transition-colors ${
                        k.favorite ? "bg-rose-50/80 ring-1 ring-rose-200/60" : "bg-white/50"
                      }`}
                    >
                      <button
                        onClick={() => toggleFavorite(k.id)}
                        className={`mt-0.5 shrink-0 text-base leading-none transition-transform hover:scale-125 ${
                          k.favorite ? "text-amber-500" : "text-stone-300 hover:text-amber-400"
                        }`}
                        aria-label={k.favorite ? "Unfavorite this thought" : "Favorite this thought"}
                        aria-pressed={k.favorite}
                      >
                        {k.favorite ? "★" : "☆"}
                      </button>
                      <span className={`font-serif-elegant text-sm italic ${k.favorite ? "text-stone-800" : "text-stone-600"}`}>
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

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 z-[90] -translate-x-1/2"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
          >
            <div className="glass-premium flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-stone-700 shadow-xl">
              <span className="text-amber-500">✦</span>
              <span className="font-serif-elegant italic">kept thoughts gathered — share them with someone you love</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExportToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 z-[90] -translate-x-1/2"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
          >
            <div className="glass-premium flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-stone-700 shadow-xl">
              <span className="text-rose-500">❋</span>
              <span className="font-serif-elegant italic">keepsake composed — check your downloads</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
