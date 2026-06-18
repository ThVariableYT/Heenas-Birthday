"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Section divider — an ornamental break between sections.
 * Each divider ships with a unique hand-crafted SVG ornament (8 patterns)
 * plus a glowing central glyph that pulses softly. Lines grow outward from
 * the center on scroll-in.
 */

const GLYPHS = ["✦", "❋", "✺", "❖", "✸", "✧", "❤", "♪"];
const ACCENTS = [
  "#f59e0b", // amber
  "#e11d48", // rose
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#d97706", // gold
  "#ec4899", // pink
  "#6366f1", // indigo (used sparingly, only on divider 8)
];

/* ------------------------------------------------------------------ */
/*  Ornament SVGs — one per divider index                              */
/* ------------------------------------------------------------------ */

function OrnamentFiligree({ color }: { color: string }) {
  // Art-deco fan filigree — radiating lines + curves
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <path d="M2 10 Q 8 4, 14 10 Q 20 16, 26 10 Q 32 4, 38 10 Q 44 16, 50 10 Q 56 4, 62 10"
        stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
      {[8, 16, 24, 32, 40, 48, 56].map((x, i) => (
        <line key={x} x1={x} y1={i % 2 ? 6 : 14} x2={x} y2={i % 2 ? 14 : 6}
          stroke={color} strokeWidth="0.8" opacity="0.45" />
      ))}
      <circle cx="32" cy="10" r="2.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.7" />
      <circle cx="32" cy="10" r="1" fill={color} opacity="0.8" />
    </svg>
  );
}

function OrnamentVine({ color }: { color: string }) {
  // Curving vine with leaves
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <path d="M2 10 Q 12 4, 22 10 T 42 10 T 62 10" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
      {[[12, 4, -1], [22, 12, 1], [42, 4, -1], [52, 12, 1]].map(([x, y, dir], i) => (
        <path key={i}
          d={`M${x} ${y} Q ${x + dir * 4} ${y - 4}, ${x + dir * 8} ${y - 6} Q ${x + dir * 4} ${y - 2}, ${x} ${y} Z`}
          fill={color} opacity="0.55" />
      ))}
      <circle cx="32" cy="10" r="1.6" fill={color} opacity="0.85" />
    </svg>
  );
}

function OrnamentDotPattern({ color }: { color: string }) {
  // Diamond of dots with crosshatch
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="42" y1="10" x2="62" y2="10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {[[24, 6], [28, 8], [32, 10], [36, 8], [40, 6], [24, 14], [28, 12], [36, 12], [40, 14]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill={color} opacity="0.65" />
      ))}
      <rect x="30" y="8" width="4" height="4" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(45 32 10)" opacity="0.7" />
    </svg>
  );
}

function OrnamentSunburst({ color }: { color: string }) {
  // Mini sunburst with rays
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <line x1="2" y1="10" x2="20" y2="10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="44" y1="10" x2="62" y2="10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 32 + Math.cos(angle) * 3;
        const y1 = 10 + Math.sin(angle) * 3;
        const x2 = 32 + Math.cos(angle) * 7;
        const y2 = 10 + Math.sin(angle) * 7;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.9" opacity="0.7" />;
      })}
      <circle cx="32" cy="10" r="2.4" fill={color} opacity="0.85" />
    </svg>
  );
}

function OrnamentChevron({ color }: { color: string }) {
  // Chevrons pointing inward
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <path d="M2 10 L 14 4 L 18 10 L 14 16 Z" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
      <path d="M62 10 L 50 4 L 46 10 L 50 16 Z" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
      <line x1="20" y1="10" x2="28" y2="10" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <line x1="36" y1="10" x2="44" y2="10" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <circle cx="32" cy="10" r="2.2" fill="none" stroke={color} strokeWidth="0.9" opacity="0.85" />
      <circle cx="32" cy="10" r="1" fill={color} opacity="0.8" />
    </svg>
  );
}

function OrnamentWave({ color }: { color: string }) {
  // Triple wave with droplets
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <path d="M2 10 Q 8 6, 14 10 T 26 10" stroke={color} strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M38 10 Q 44 14, 50 10 T 62 10" stroke={color} strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M28 10 Q 32 6, 36 10" stroke={color} strokeWidth="1.2" fill="none" opacity="0.8" />
      <circle cx="32" cy="7" r="0.9" fill={color} opacity="0.7" />
      <circle cx="22" cy="6" r="0.6" fill={color} opacity="0.5" />
      <circle cx="42" cy="6" r="0.6" fill={color} opacity="0.5" />
    </svg>
  );
}

function OrnamentHeart({ color }: { color: string }) {
  // Tiny heart with side flourishes
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <path d="M2 10 Q 10 6, 18 10 Q 22 12, 26 10" stroke={color} strokeWidth="0.9" fill="none" opacity="0.5" />
      <path d="M62 10 Q 54 6, 46 10 Q 42 12, 38 10" stroke={color} strokeWidth="0.9" fill="none" opacity="0.5" />
      <path d="M32 14 C 28 10, 26 8, 28 6 C 30 4, 32 6, 32 7 C 32 6, 34 4, 36 6 C 38 8, 36 10, 32 14 Z"
        fill={color} opacity="0.85" />
    </svg>
  );
}

function OrnamentNote({ color }: { color: string }) {
  // Eighth note with staff lines
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" aria-hidden>
      <line x1="2" y1="8" x2="62" y2="8" stroke={color} strokeWidth="0.4" opacity="0.4" />
      <line x1="2" y1="10" x2="62" y2="10" stroke={color} strokeWidth="0.4" opacity="0.4" />
      <line x1="2" y1="12" x2="62" y2="12" stroke={color} strokeWidth="0.4" opacity="0.4" />
      <ellipse cx="28" cy="13" rx="3.2" ry="2.2" fill={color} opacity="0.85" transform="rotate(-20 28 13)" />
      <line x1="31" y1="13" x2="31" y2="4" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <path d="M31 4 Q 38 6, 36 12" stroke={color} strokeWidth="1.2" fill="none" opacity="0.85" />
    </svg>
  );
}

const ORNAMENTS = [
  OrnamentFiligree,
  OrnamentVine,
  OrnamentDotPattern,
  OrnamentSunburst,
  OrnamentChevron,
  OrnamentWave,
  OrnamentHeart,
  OrnamentNote,
];

export default function SectionDivider({ index = 0 }: { index?: number }) {
  const glyph = GLYPHS[index % GLYPHS.length];
  const accent = ACCENTS[index % ACCENTS.length];
  const OrnamentLeft = ORNAMENTS[index % ORNAMENTS.length];
  const OrnamentRight = ORNAMENTS[(index + 3) % ORNAMENTS.length];

  // Stagger dots between line + glyph for a beaded effect.
  const beads = useMemo(
    () => Array.from({ length: 5 }, (_, i) => i * 0.08),
    [],
  );

  return (
    <motion.div
      className="section-divider section-divider-premium"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7 }}
      aria-hidden
      style={{ ["--divider-accent" as string]: accent }}
    >
      <motion.div
        className="divider-line-wrap"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <span className="divider-line" />
        {beads.map((d, i) => (
          <motion.span
            key={`l-${i}`}
            className="divider-bead"
            style={{ ["--bead-accent" as string]: accent }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + d, duration: 0.4 }}
          />
        ))}
        <span className="divider-ornament">
          <OrnamentLeft color={accent} />
        </span>
      </motion.div>

      <motion.span
        className="divider-glyph divider-glyph-premium"
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, delay: 0.35, type: "spring", stiffness: 140 }}
        style={{ ["--glyph-accent" as string]: accent }}
      >
        {glyph}
      </motion.span>

      <motion.div
        className="divider-line-wrap"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <span className="divider-ornament">
          <OrnamentRight color={accent} />
        </span>
        {beads.slice().reverse().map((d, i) => (
          <motion.span
            key={`r-${i}`}
            className="divider-bead"
            style={{ ["--bead-accent" as string]: accent }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + d, duration: 0.4 }}
          />
        ))}
        <span className="divider-line" />
      </motion.div>
    </motion.div>
  );
}
