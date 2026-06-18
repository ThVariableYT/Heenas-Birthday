"use client";

import { useEffect, useRef } from "react";

type SparkleParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: "circle" | "star" | "smoke";
  rotation: number;
  rotationSpeed: number;
};

type SparkleRequest = {
  x: number;
  y: number;
  count: number;
  kind?: "gold" | "rose" | "rainbow" | "smoke";
};

const PALETTES: Record<string, string[]> = {
  gold: ["#fbbf24", "#fcd34d", "#fde68a", "#f59e0b", "#fff7ed"],
  rose: ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#fff1f2"],
  rainbow: ["#f43f5e", "#fbbf24", "#a78bfa", "#34d399", "#38bdf8", "#f472b6"],
  smoke: ["#9ca3af", "#d1d5db", "#e5e7eb", "#6b7280", "#f3f4f6"],
};

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  const spikes = 4;
  const outer = size;
  const inner = size * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / spikes) * i;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function sparkle(req: SparkleRequest) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("heena:sparkle", { detail: req }));
}

export default function SparkleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SparkleParticle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const MAX_PARTICLES = 400;
    const handleSparkle = (e: Event) => {
      if (prefersReduced) return;
      const detail = (e as CustomEvent<SparkleRequest>).detail;
      const palette = PALETTES[detail.kind || "gold"];
      const isSmoke = detail.kind === "smoke";
      let count = detail.count;
      if (particlesRef.current.length + count > MAX_PARTICLES) {
        count = Math.max(0, MAX_PARTICLES - particlesRef.current.length);
      }
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = isSmoke ? Math.random() * 1.2 + 0.4 : Math.random() * 5 + 1.5;
        particlesRef.current.push({
          x: detail.x,
          y: detail.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (isSmoke ? 1.5 : 0.5),
          life: 0,
          maxLife: isSmoke ? 80 : 60 + Math.random() * 30,
          size: isSmoke ? Math.random() * 6 + 3 : Math.random() * 4 + 1.5,
          color: palette[Math.floor(Math.random() * palette.length)],
          gravity: isSmoke ? -0.02 : 0.08,
          shape: isSmoke ? "smoke" : Math.random() > 0.5 ? "star" : "circle",
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
    };
    window.addEventListener("heena:sparkle", handleSparkle);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;

        const t = p.life / p.maxLife;
        if (t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = p.shape === "smoke" ? (1 - t) * 0.4 : Math.sin((1 - t) * Math.PI);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;

        if (p.shape === "star") {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.shape === "smoke") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + t * 1.5), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("heena:sparkle", handleSparkle);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden
    />
  );
}
