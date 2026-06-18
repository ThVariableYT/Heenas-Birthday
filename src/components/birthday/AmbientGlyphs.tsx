"use client";

/**
 * AmbientGlyphs — a fixed, pointer-events-none layer of faint ornamental
 * glyphs (✦ ❋ ✺ ❖ ✸) that slowly drift across the entire viewport.
 *
 * This adds a dreamy, cinematic "there's something in the air" feel
 * without competing with the foreground content. Each glyph uses a
 * unique CSS keyframe drift animation (defined in globals.css) so they
 * move independently. Respects `prefers-reduced-motion` (the field is
 * hidden entirely via CSS when reduced motion is requested).
 */
export default function AmbientGlyphs() {
  return (
    <div className="ambient-glyph-field" aria-hidden>
      <span className="ambient-glyph g1">✦</span>
      <span className="ambient-glyph g2">❋</span>
      <span className="ambient-glyph g3">✺</span>
      <span className="ambient-glyph g4">❖</span>
      <span className="ambient-glyph g5">✸</span>
    </div>
  );
}
