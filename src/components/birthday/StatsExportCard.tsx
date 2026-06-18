"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStatsStore } from "@/lib/stats-store";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";

/**
 * Stats Export Card — generates a downloadable PNG "birthday in numbers"
 * keepsake card via HTML5 Canvas. The card is rendered procedurally
 * (gradient background, glassmorphism panels, animated-style typography)
 * so it works fully client-side with no external assets.
 */

type StatItem = {
  key: keyof ReturnType<typeof useStatsStore.getState>["stats"];
  label: string;
  glyph: string;
  color: [string, string]; // gradient stops
};

const EXPORT_ITEMS: StatItem[] = [
  { key: "memoriesRevealed", label: "memories revealed", glyph: "✦", color: ["#f59e0b", "#f43f5e"] },
  { key: "favoritesPinned", label: "favorites pinned", glyph: "♥", color: ["#f43f5e", "#ec4899"] },
  { key: "thoughtsKept", label: "thoughts kept", glyph: "❋", color: ["#f59e0b", "#eab308"] },
  { key: "complimentsPlucked", label: "compliments plucked", glyph: "✺", color: ["#8b5cf6", "#d946ef"] },
  { key: "tracksPlayed", label: "tracks played", glyph: "♪", color: ["#10b981", "#14b8a6"] },
  { key: "candlesBlown", label: "candles blown", glyph: "🕯", color: ["#f59e0b", "#fb923c"] },
  { key: "wishesSealed", label: "wishes sealed", glyph: "✸", color: ["#e11d48", "#f59e0b"] },
  { key: "sparklesFired", label: "sparkles fired", glyph: "✧", color: ["#0ea5e9", "#8b5cf6"] },
];

const W = 1080;
const H = 1350;

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(stats: Record<string, number>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // === Background — warm cream gradient with subtle aurora wash ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fff7ed");
  bg.addColorStop(0.5, "#fef3c7");
  bg.addColorStop(1, "#fce7f3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Aurora washes — soft radial blooms
  const aurora1 = ctx.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, 400);
  aurora1.addColorStop(0, "rgba(251,191,36,0.35)");
  aurora1.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = aurora1;
  ctx.fillRect(0, 0, W, H);

  const aurora2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 0, W * 0.85, H * 0.85, 450);
  aurora2.addColorStop(0, "rgba(244,63,94,0.28)");
  aurora2.addColorStop(1, "rgba(244,63,94,0)");
  ctx.fillStyle = aurora2;
  ctx.fillRect(0, 0, W, H);

  // === Outer ornamental border — double rule with corner flourishes ===
  ctx.strokeStyle = "rgba(180,83,9,0.35)";
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, 40, 40, W - 80, H - 80, 24);
  ctx.stroke();
  ctx.strokeStyle = "rgba(180,83,9,0.2)";
  ctx.lineWidth = 1;
  roundedRectPath(ctx, 52, 52, W - 104, H - 104, 18);
  ctx.stroke();

  // Corner flourishes
  const drawCorner = (cx: number, cy: number, flipX: boolean, flipY: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
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

  // === Header — eyebrow + title ===
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(180,83,9,0.7)";
  ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("• A K E E P S A K E •", W / 2, 150);

  // Title — serif, gradient
  ctx.font = "700 76px 'Playfair Display', serif";
  const titleGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  titleGrad.addColorStop(0, "#b45309");
  titleGrad.addColorStop(0.5, "#e11d48");
  titleGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = titleGrad;
  ctx.fillText("For Heena", W / 2, 240);

  // Subtitle
  ctx.font = "italic 26px 'Playfair Display', serif";
  ctx.fillStyle = "rgba(68,64,60,0.75)";
  ctx.fillText("your birthday, in numbers", W / 2, 290);

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
  ctx.fillText("✦", W / 2, 327);

  // === Stats grid — 2 columns, 4 rows ===
  const gridX = 100;
  const gridY = 380;
  const cellW = (W - 200 - 30) / 2;
  const cellH = 170;
  const gap = 30;

  EXPORT_ITEMS.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);
    const value = (stats[item.key] as number) || 0;

    // Card panel — soft glass with subtle gradient
    roundedRectPath(ctx, x, y, cellW, cellH, 20);
    const panel = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
    panel.addColorStop(0, "rgba(255,255,255,0.85)");
    panel.addColorStop(1, "rgba(255,255,255,0.55)");
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = "rgba(180,83,9,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Soft accent glow in the top-right
    const glow = ctx.createRadialGradient(x + cellW - 30, y + 30, 0, x + cellW - 30, y + 30, 80);
    glow.addColorStop(0, `${item.color[0]}33`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fill();

    // Glyph
    ctx.textAlign = "left";
    ctx.font = "32px serif";
    ctx.fillStyle = `${item.color[0]}cc`;
    ctx.fillText(item.glyph, x + 28, y + 50);

    // Value — large gradient number
    ctx.textAlign = "right";
    ctx.font = "700 64px 'Playfair Display', serif";
    const numGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
    numGrad.addColorStop(0, item.color[0]);
    numGrad.addColorStop(1, item.color[1]);
    ctx.fillStyle = numGrad;
    ctx.fillText(String(value), x + cellW - 28, y + 100);

    // Label
    ctx.textAlign = "left";
    ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(68,64,60,0.7)";
    // letter-spaced uppercase
    const label = item.label.toUpperCase();
    let lx = x + 28;
    for (const ch of label) {
      ctx.fillText(ch, lx, y + 130);
      lx += ctx.measureText(ch).width + 2;
    }
  });

  // === Footer — signature + date ===
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
  ctx.fillText("Crafted slowly, with care.", W / 2, footerY + 35);
  ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "rgba(120,53,15,0.55)";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ctx.fillText(`sealed on ${date}`, W / 2, footerY + 65);

  // Tiny monogram stamp
  ctx.font = "600 16px 'Playfair Display', serif";
  ctx.fillStyle = "rgba(180,83,9,0.5)";
  ctx.fillText("✦  H  ✦", W / 2, footerY + 100);

  return canvas;
}

export default function StatsExportCard() {
  const stats = useStatsStore((s) => s.stats);
  const [showToast, setShowToast] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      // Yield to next frame so the spinner can paint before heavy canvas work
      await new Promise((r) => requestAnimationFrame(r));
      const canvas = drawCard(stats as unknown as Record<string, number>);
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `for-heena-birthday-keepsake-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 32, kind: "rainbow" });
      playChime(880, "sine", 1.0, 0.12);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2800);
    } finally {
      setBusy(false);
    }
  }, [stats]);

  const handleShare = useCallback(async () => {
    setBusy(true);
    try {
      await new Promise((r) => requestAnimationFrame(r));
      const canvas = drawCard(stats as unknown as Record<string, number>);
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95);
      });
      const file = new File([blob], "for-heena-keepsake.png", { type: "image/png" });
      const shareUrl = typeof window !== "undefined" ? window.location.href : "";

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "For Heena — A Birthday Composed in Code",
          text: "A little keepsake from a birthday composed in code.",
          url: shareUrl,
        });
        playChime(784, "sine", 0.8, 0.12);
        sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 28, kind: "gold" });
      } else {
        // Fallback — download + copy URL
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `for-heena-birthday-keepsake-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch { /* no-op */ }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2800);
        playChime(659, "sine", 0.6, 0.1);
      }
    } catch {
      // user cancelled share — no-op
    } finally {
      setBusy(false);
    }
  }, [stats]);

  return (
    <>
      <motion.div
        className="mt-6 flex flex-wrap items-center justify-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.button
          onClick={handleDownload}
          disabled={busy}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-amber-300/70 bg-white/80 px-5 py-2.5 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur transition-colors hover:bg-amber-50 disabled:cursor-wait disabled:opacity-60"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Download a PNG keepsake of your stats"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={busy ? "animate-spin" : ""}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>{busy ? "composing…" : "download keepsake"}</span>
          </span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </motion.button>

        <motion.button
          onClick={handleShare}
          disabled={busy}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-rose-300/70 bg-white/80 px-5 py-2.5 text-xs font-semibold text-rose-700 shadow-sm backdrop-blur transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Share your stats keepsake"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{busy ? "preparing…" : "share keepsake"}</span>
          </span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showToast && (
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
              <span className="font-serif-elegant italic">keepsake sealed — check your downloads</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
