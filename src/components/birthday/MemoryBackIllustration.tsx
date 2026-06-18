"use client";

/**
 * MemoryBackIllustration — a set of six hand-crafted SVG illustrations, one
 * per memory-card accent (rose / amber / violet / emerald / sky / gold).
 * Rendered at low opacity behind the card-back body text as an ornamental
 * vignette. Each illustration is a small, recognizable glyph-like scene
 * that reinforces the chapter's mood:
 *
 *   rose    → a blooming rose with layered petals
 *   amber   → a radiant sun with rays
 *   violet  → a crescent moon with scattered stars
 *   emerald → a leafy branch with veins
 *   sky     → a wave crest with droplets
 *   gold    → a sunburst compass rose
 *
 * All illustrations use currentColor so they inherit the per-card accent
 * color set by the parent's `--card-accent` CSS variable.
 */
type Props = {
  accent: "amber" | "rose" | "violet" | "emerald" | "sky" | "gold";
  /** Pixel size of the square illustration. Default 120. */
  size?: number;
};

export default function MemoryBackIllustration({ accent, size = 120 }: Props) {
  return (
    <div
      className="memory-back-illustration pointer-events-none absolute right-4 top-4 opacity-[0.42] dark:opacity-[0.55]"
      style={{ color: "var(--card-accent)" }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {accent === "rose" && <Rose />}
        {accent === "amber" && <Sun />}
        {accent === "violet" && <Moon />}
        {accent === "emerald" && <Branch />}
        {accent === "sky" && <Wave />}
        {accent === "gold" && <Compass />}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual illustrations                                          */
/* ------------------------------------------------------------------ */

function Rose() {
  // A blooming rose — concentric layered petals + a leaf.
  return (
    <g stroke="currentColor" strokeWidth="1.2" fill="none">
      {/* Outer petals (5) */}
      <g opacity="0.9">
        <path d="M60 28 C 48 22, 36 30, 38 44 C 30 46, 28 60, 42 66 C 36 78, 48 88, 60 82 C 72 88, 84 78, 78 66 C 92 60, 90 46, 82 44 C 84 30, 72 22, 60 28 Z" fill="currentColor" fillOpacity="0.18" />
      </g>
      {/* Middle petals */}
      <path d="M60 40 C 52 38, 46 46, 50 54 C 44 58, 46 68, 54 68 C 56 76, 64 76, 66 68 C 74 68, 76 58, 70 54 C 74 46, 68 38, 60 40 Z" fill="currentColor" fillOpacity="0.28" />
      {/* Inner spiral */}
      <path d="M60 50 C 56 50, 54 54, 56 58 C 54 60, 56 64, 60 63 C 62 66, 66 64, 65 60 C 68 58, 66 54, 62 54 C 62 51, 60 50, 60 50 Z" fill="currentColor" fillOpacity="0.5" />
      <circle cx="60" cy="58" r="2.5" fill="currentColor" />
      {/* Leaf */}
      <path d="M82 78 C 90 72, 100 76, 104 86 C 96 92, 86 88, 82 78 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M86 82 L 100 84" strokeWidth="0.6" />
      {/* Stem */}
      <path d="M60 82 C 60 92, 64 100, 72 104" strokeWidth="1" />
    </g>
  );
}

function Sun() {
  // A radiant sun — central disc + 12 rays + inner ring.
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = 60 + Math.cos(angle) * 32;
    const y1 = 60 + Math.sin(angle) * 32;
    const x2 = 60 + Math.cos(angle) * (i % 2 === 0 ? 50 : 42);
    const y2 = 60 + Math.sin(angle) * (i % 2 === 0 ? 50 : 42);
    return { x1, y1, x2, y2, wide: i % 2 === 0 };
  });
  return (
    <g stroke="currentColor" fill="none">
      {/* Long rays */}
      {rays.map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          strokeWidth={r.wide ? 2 : 1}
          strokeLinecap="round"
        />
      ))}
      {/* Outer ring */}
      <circle cx="60" cy="60" r="28" strokeWidth="1" opacity="0.5" />
      {/* Main disc */}
      <circle cx="60" cy="60" r="22" fill="currentColor" fillOpacity="0.25" strokeWidth="1.5" />
      {/* Inner detail ring */}
      <circle cx="60" cy="60" r="14" strokeWidth="0.8" opacity="0.6" />
      <circle cx="60" cy="60" r="6" fill="currentColor" fillOpacity="0.6" />
    </g>
  );
}

function Moon() {
  // A crescent moon + scattered stars + orbit dot.
  return (
    <g stroke="currentColor" fill="none">
      {/* Crescent — formed by two overlapping circles, the second as a mask */}
      <mask id="moon-mask">
        <rect x="0" y="0" width="120" height="120" fill="white" />
        <circle cx="72" cy="54" r="28" fill="black" />
      </mask>
      <circle cx="60" cy="60" r="28" fill="currentColor" fillOpacity="0.3" mask="url(#moon-mask)" />
      <circle cx="60" cy="60" r="28" strokeWidth="1.2" mask="url(#moon-mask)" />

      {/* Stars scattered around */}
      <g fill="currentColor">
        <Star cx={28} cy={30} r={3} />
        <Star cx={92} cy={26} r={2} />
        <Star cx={100} cy={70} r={2.5} />
        <Star cx={24} cy={84} r={2} />
        <Star cx={86} cy={96} r={3} />
        <Star cx={40} cy={100} r={1.8} />
      </g>
      {/* Tiny dots */}
      <circle cx="20" cy="50" r="1" fill="currentColor" />
      <circle cx="104" cy="44" r="1" fill="currentColor" />
      <circle cx="14" cy="68" r="1.2" fill="currentColor" />
      <circle cx="96" cy="88" r="1" fill="currentColor" />
    </g>
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // A 4-point sparkle star.
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return <polygon points={points.join(" ")} />;
}

function Branch() {
  // A leafy branch — central stem + 6 leaves + veins.
  return (
    <g stroke="currentColor" fill="none">
      {/* Main stem */}
      <path d="M22 96 C 38 80, 54 64, 70 48 C 80 38, 90 30, 100 22" strokeWidth="1.8" strokeLinecap="round" />
      {/* Leaves on alternating sides */}
      <Leaf x={36} y={82} angle={-35} size={18} />
      <Leaf x={48} y={70} angle={35} size={16} />
      <Leaf x={60} y={58} angle={-40} size={20} />
      <Leaf x={72} y={46} angle={35} size={16} />
      <Leaf x={84} y={34} angle={-35} size={18} />
      <Leaf x={94} y={26} angle={40} size={14} />
      {/* Small bud at the tip */}
      <circle cx="100" cy="22" r="3" fill="currentColor" fillOpacity="0.5" />
      <circle cx="100" cy="22" r="1.5" fill="currentColor" />
    </g>
  );
}

function Leaf({ x, y, angle, size }: { x: number; y: number; angle: number; size: number }) {
  // An almond-shaped leaf with a central vein.
  const rad = (angle * Math.PI) / 180;
  const tipX = x + Math.cos(rad) * size;
  const tipY = y + Math.sin(rad) * size;
  const perpX = -Math.sin(rad) * size * 0.45;
  const perpY = Math.cos(rad) * size * 0.45;
  return (
    <g>
      <path
        d={`M ${x} ${y} Q ${x + perpX} ${y + perpY} ${tipX} ${tipY} Q ${x - perpX} ${y - perpY} ${x} ${y} Z`}
        fill="currentColor"
        fillOpacity="0.28"
        strokeWidth="0.8"
      />
      <line x1={x} y1={y} x2={tipX} y2={tipY} strokeWidth="0.6" opacity="0.7" />
    </g>
  );
}

function Wave() {
  // A wave crest with droplets — layered sin curves + falling drops.
  return (
    <g stroke="currentColor" fill="none">
      {/* Back wave — faintest */}
      <path
        d="M8 70 Q 22 58, 36 70 T 64 70 T 92 70 T 112 70"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Middle wave */}
      <path
        d="M8 78 Q 22 64, 36 78 T 64 78 T 92 78 T 112 78"
        strokeWidth="1.4"
        opacity="0.65"
      />
      {/* Front wave — darkest */}
      <path
        d="M8 86 Q 22 70, 36 86 T 64 86 T 92 86 T 112 86"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Crest curl */}
      <path
        d="M36 70 C 32 66, 34 62, 38 64 C 36 60, 40 58, 42 62"
        strokeWidth="1.2"
      />
      {/* Droplets above the crest */}
      <Drop cx={40} cy={48} r={2.5} />
      <Drop cx={56} cy={38} r={3} />
      <Drop cx={72} cy={44} r={2} />
      <Drop cx={88} cy={36} r={2.5} />
      {/* Tiny spray dots */}
      <circle cx="48" cy="56" r="1" fill="currentColor" fillOpacity="0.7" />
      <circle cx="64" cy="52" r="0.8" fill="currentColor" fillOpacity="0.7" />
      <circle cx="80" cy="54" r="1" fill="currentColor" fillOpacity="0.7" />
    </g>
  );
}

function Drop({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // A teardrop shape — circle + triangle tail.
  return (
    <g fill="currentColor" fillOpacity="0.4">
      <path d={`M ${cx} ${cy - r * 1.4} L ${cx + r * 0.7} ${cy} A ${r} ${r} 0 1 1 ${cx - r * 0.7} ${cy} Z`} />
    </g>
  );
}

function Compass() {
  // A sunburst compass rose — 8-point star + cardinal points + center.
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
    const isCardinal = i % 2 === 0;
    const outerR = isCardinal ? 52 : 38;
    const innerR = 14;
    const x1 = 60 + Math.cos(angle) * outerR;
    const y1 = 60 + Math.sin(angle) * outerR;
    const nextAngle = angle + (Math.PI / 8);
    const x2 = 60 + Math.cos(nextAngle) * innerR;
    const y2 = 60 + Math.sin(nextAngle) * innerR;
    points.push(`M 60 60 L ${x1} ${y1} L ${x2} ${y2} Z`);
  }
  return (
    <g stroke="currentColor" fill="none">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="54" strokeWidth="0.8" opacity="0.4" />
      <circle cx="60" cy="60" r="44" strokeWidth="0.6" opacity="0.5" />
      {/* Compass points */}
      <g fill="currentColor" fillOpacity="0.25" strokeWidth="0.8">
        {points.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* Tick marks around the rim */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        const x1 = 60 + Math.cos(a) * 50;
        const y1 = 60 + Math.sin(a) * 50;
        const x2 = 60 + Math.cos(a) * (i % 6 === 0 ? 46 : 48);
        const y2 = 60 + Math.sin(a) * (i % 6 === 0 ? 46 : 48);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 6 === 0 ? 1.2 : 0.5} />
        );
      })}
      {/* Center hub */}
      <circle cx="60" cy="60" r="8" fill="currentColor" fillOpacity="0.4" strokeWidth="1" />
      <circle cx="60" cy="60" r="3" fill="currentColor" />
    </g>
  );
}
