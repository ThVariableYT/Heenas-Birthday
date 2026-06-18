"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { timelineMoments, type TimelineMoment } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import SectionHeader from "./SectionHeader";

const ACCENTS: Record<TimelineMoment["accent"], { dot: string; ring: string; text: string; glow: string }> = {
  amber: {
    dot: "from-amber-400 to-amber-600",
    ring: "ring-amber-300/50",
    text: "text-amber-700",
    glow: "rgba(251,191,36,0.35)",
  },
  rose: {
    dot: "from-rose-400 to-rose-600",
    ring: "ring-rose-300/50",
    text: "text-rose-700",
    glow: "rgba(244,63,94,0.35)",
  },
  violet: {
    dot: "from-violet-400 to-violet-600",
    ring: "ring-violet-300/50",
    text: "text-violet-700",
    glow: "rgba(167,139,250,0.35)",
  },
  emerald: {
    dot: "from-emerald-400 to-emerald-600",
    ring: "ring-emerald-300/50",
    text: "text-emerald-700",
    glow: "rgba(52,211,153,0.35)",
  },
};

function MomentItem({ moment, index }: { moment: TimelineMoment; index: number }) {
  const isLeft = index % 2 === 0;
  const accent = ACCENTS[moment.accent];
  const itemRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      count: 16,
      kind: moment.accent === "emerald" ? "rainbow" : moment.accent === "violet" ? "rainbow" : "gold",
    });
    playChime(440 + index * 60, "sine", 0.8, 0.1);
  };

  return (
    <div
      ref={itemRef}
      className={`relative flex w-full items-center gap-6 md:gap-12 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="hidden flex-1 md:block" />

      <div className="absolute left-6 z-10 md:relative md:left-auto">
        <motion.div
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent.dot} text-white shadow-lg ring-4 ${accent.ring} md:h-14 md:w-14`}
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.15 }}
        >
          <span className="text-lg">{moment.glyph}</span>
          <motion.div
            className="absolute -inset-2 rounded-full"
            style={{ background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
          />
        </motion.div>
      </div>

      <motion.div
        className="group flex-1 cursor-pointer pl-20 md:pl-0"
        onClick={handleClick}
        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl md:p-7">
          <div
            className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: accent.glow }}
          />
          <span className={`font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] ${accent.text}`}>
            {moment.season}
          </span>
          <h3 className="mt-2 font-serif-elegant text-2xl font-bold text-stone-800 md:text-3xl">
            {moment.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-base">
            {moment.detail}
          </p>
          <div className={`mt-4 h-px w-16 bg-gradient-to-r ${accent.dot} opacity-60`} />
        </div>
      </motion.div>
    </div>
  );
}

export default function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative px-4 py-32">
      <div className="mb-20">
        <SectionHeader
          number="01"
          eyebrow="the timeline"
          accent="amber"
          title={
            <>
              A few moments,
              <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
                {" "}
                in order
              </span>
            </>
          }
          subtitle="Not a complete history — just the beats that kept coming back. Scroll through; each one still hums."
        />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="absolute left-6 top-0 h-full w-px bg-stone-200 md:left-1/2 md:-translate-x-1/2">
          <motion.div
            className="absolute left-0 top-0 w-full origin-top bg-gradient-to-b from-amber-400 via-rose-400 to-violet-400"
            style={{ height: lineHeight, boxShadow: "0 0 12px rgba(251,191,36,0.5)" }}
          />
        </div>

        <div className="space-y-12 md:space-y-16">
          {timelineMoments.map((m, i) => (
            <MomentItem key={m.id} moment={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
