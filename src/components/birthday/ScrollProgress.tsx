"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  // Traveling glow dot — positioned along the bar by scroll progress
  const glowX = useTransform(scrollYProgress, (v) => `${v * 100}%`);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[3px]" aria-hidden>
      {/* Base track */}
      <div className="absolute inset-0 bg-stone-900/5" />
      {/* Gradient progress bar */}
      <motion.div
        className="absolute inset-0 origin-left"
        style={{
          scaleX,
          background:
            "linear-gradient(90deg, #fbbf24 0%, #f43f5e 40%, #a78bfa 70%, #fbbf24 100%)",
          boxShadow: "0 0 12px rgba(251,191,36,0.5), 0 0 24px rgba(244,63,94,0.3)",
        }}
      />
      {/* Traveling glow dot */}
      <motion.div
        className="scroll-progress-glow"
        style={{ left: glowX, opacity: useTransform(scrollYProgress, [0, 0.01, 1], [0, 1, 1]) }}
      />
    </div>
  );
}
