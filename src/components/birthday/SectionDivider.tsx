"use client";

import { motion } from "framer-motion";

const GLYPHS = ["✦", "❋", "✺", "❖", "✸", "✧", "❤", "♪"];

/**
 * Section divider — an ornamental break between sections.
 * Picks a glyph based on the `index` prop so each divider looks distinct,
 * and reveals on scroll.
 */
export default function SectionDivider({ index = 0 }: { index?: number }) {
  const glyph = GLYPHS[index % GLYPHS.length];
  return (
    <motion.div
      className="section-divider"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7 }}
      aria-hidden
    >
      <span className="divider-line" />
      <span className="divider-glyph">{glyph}</span>
      <span className="divider-line" />
    </motion.div>
  );
}
