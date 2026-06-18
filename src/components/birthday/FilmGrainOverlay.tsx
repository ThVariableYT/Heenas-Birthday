"use client";

import { useMemo } from "react";

/**
 * Subtle film grain overlay — generates an SVG-noise data URL once on mount
 * and pins it as a fixed, pointer-events-none, low-opacity overlay.
 * Adds a premium analog texture without affecting performance or interaction.
 */
export default function FilmGrainOverlay() {
  const grainUrl = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>
        <feColorMatrix type='saturate' values='0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/>
    </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[55] opacity-[0.035] mix-blend-soft-light"
      style={{
        backgroundImage: grainUrl,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
      aria-hidden
    />
  );
}
