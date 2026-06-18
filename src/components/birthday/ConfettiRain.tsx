"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Confetti = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  color: string;
  size: number;
  shape: "rect" | "circle" | "star";
};

const COLORS = ["#fbbf24", "#f43f5e", "#a78bfa", "#34d399", "#38bdf8", "#f472b6", "#fcd34d"];

function generateConfetti(count: number): Confetti[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + Date.now(),
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.4 + Math.random() * 2.2,
    drift: (Math.random() - 0.5) * 220,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.6 ? "star" : Math.random() > 0.5 ? "circle" : "rect",
  }));
}

function Shape({ shape, size, color }: { shape: Confetti["shape"]; size: number; color: string }) {
  if (shape === "circle") {
    return <div style={{ width: size, height: size, background: color, borderRadius: "50%" }} />;
  }
  if (shape === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2 L13.5 9 L21 10 L15 14.5 L17 22 L12 18 L7 22 L9 14.5 L3 10 L10.5 9 Z" />
      </svg>
    );
  }
  return (
    <div
      style={{
        width: size * 0.5,
        height: size * 1.2,
        background: color,
        borderRadius: 2,
      }}
    />
  );
}

export function fireConfetti(count = 120) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("heena:confetti", { detail: { count } }));
}

export default function ConfettiRain() {
  const [pieces, setPieces] = useState<Confetti[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail || {};
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;
      const batch = generateConfetti(detail.count ?? 120);
      setPieces(batch);
      setVisible(true);
      window.setTimeout(() => {
        setVisible(false);
        window.setTimeout(() => setPieces([]), 800);
      }, 4200);
    };
    window.addEventListener("heena:confetti", handle);
    return () => window.removeEventListener("heena:confetti", handle);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          {pieces.map((p) => (
            <div
              key={p.id}
              className="absolute top-0"
              style={{
                left: `${p.left}%`,
                animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                ["--drift" as string]: `${p.drift}px`,
                ["--spin" as string]: `${p.spin}deg`,
              }}
            >
              <Shape shape={p.shape} size={p.size} color={p.color} />
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
