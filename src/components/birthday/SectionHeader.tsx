"use client";

import { motion } from "framer-motion";

type SectionHeaderProps = {
  /** Section number, e.g. "01" */
  number: string;
  /** Eyebrow label, e.g. "the memory deck" */
  eyebrow: string;
  /** Main heading (can include React nodes for gradient spans) */
  title: React.ReactNode;
  /** Optional sub-paragraph */
  subtitle?: React.ReactNode;
  /** Accent color theme — picks the aurora palette */
  accent?: "amber" | "rose" | "violet" | "emerald" | "sky";
  /** Optional max-width for the subtitle */
  subtitleMaxWidth?: string;
};

const ACCENT_THEMES = {
  amber: {
    badge: "from-amber-500 to-rose-400",
    ring: "rgba(251,191,36,",
    glow: "rgba(245,158,11,",
    text: "text-amber-700/70",
    line: "bg-amber-400/40",
  },
  rose: {
    badge: "from-rose-500 to-pink-400",
    ring: "rgba(244,63,94,",
    glow: "rgba(244,63,94,",
    text: "text-rose-700/70",
    ring2: "bg-rose-400/40",
    line: "bg-rose-400/40",
  },
  violet: {
    badge: "from-violet-500 to-fuchsia-400",
    ring: "rgba(139,92,246,",
    glow: "rgba(139,92,246,",
    text: "text-violet-700/70",
    line: "bg-violet-400/40",
  },
  emerald: {
    badge: "from-emerald-500 to-teal-400",
    ring: "rgba(16,185,129,",
    glow: "rgba(16,185,129,",
    text: "text-emerald-700/70",
    line: "bg-emerald-400/40",
  },
  sky: {
    badge: "from-sky-500 to-cyan-400",
    ring: "rgba(14,165,233,",
    glow: "rgba(14,165,233,",
    text: "text-sky-700/70",
    line: "bg-sky-400/40",
  },
} as const;

/**
 * SectionHeader — premium aurora-gradient section banner with a numbered art-deco
 * badge, eyebrow label, large serif title, and optional subtitle. Used by every
 * major section for visual consistency and a sense of editorial progression.
 */
export default function SectionHeader({
  number,
  eyebrow,
  title,
  subtitle,
  accent = "amber",
  subtitleMaxWidth = "max-w-lg",
}: SectionHeaderProps) {
  const theme = ACCENT_THEMES[accent];

  return (
    <motion.div
      className="relative mx-auto mb-14 max-w-3xl text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Aurora wash — soft animated gradient banner behind the heading */}
      <div
        className="aurora-banner pointer-events-none absolute inset-x-0 -top-8 -z-10 mx-auto h-48 max-w-2xl"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${theme.glow}0.18), radial-gradient(ellipse at 70% 50%, ${theme.ring}0.14)`,
        }}
        aria-hidden
      />

      {/* Numbered art-deco badge */}
      <motion.div
        className="mb-5 flex items-center justify-center gap-4"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
        <div className="relative">
          {/* Outer dotted ring */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-dashed border-amber-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
          <div
            className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${theme.badge} shadow-lg`}
          >
            <span className="font-mono-elegant text-xs font-bold tracking-[0.1em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {number}
            </span>
            {/* Inner highlight */}
            <span className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          </div>
        </div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/60" />
      </motion.div>

      {/* Eyebrow label */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className={`h-px w-10 ${theme.line}`} />
        <span className={`font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] ${theme.text}`}>
          {eyebrow}
        </span>
        <div className={`h-px w-10 ${theme.line}`} />
      </div>

      {/* Main title */}
      <h2 className="font-serif-elegant text-4xl font-bold leading-tight text-stone-800 sm:text-5xl md:text-6xl">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className={`mx-auto mt-6 ${subtitleMaxWidth} text-base leading-relaxed text-stone-600`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
