"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sparkle } from "./SparkleCanvas";

/**
 * Sparkle cursor — a soft amber glow that trails the cursor,
 * plus periodic micro-sparkle emission and a burst on click.
 *
 * Respects prefers-reduced-motion (disables itself silently).
 * Only active on devices with a fine pointer (mouse).
 * Mount this once at the root; toggle visibility via the `active` prop.
 */
export default function SparkleCursor({ active }: { active: boolean }) {
  // Compute capability flags once at mount (SSR-safe: returns defaults on server)
  const [capable] = useState(() => {
    if (typeof window === "undefined") return { fine: false, reduced: true };
    return {
      fine: window.matchMedia("(pointer: fine)").matches,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const trailRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const rafRef = useRef(0);
  const sparkleTickRef = useRef(0);
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (!capable.fine || capable.reduced) return;

    const onMove = (e: PointerEvent) => {
      trailRef.current = { x: e.clientX, y: e.clientY };
      if (!visibleRef.current) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onDown = (e: PointerEvent) => {
      // Small click burst — gold micro-sparkles
      sparkle({ x: e.clientX, y: e.clientY, count: 6, kind: "gold" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    // Animation loop — smooth lag-follow
    const loop = () => {
      setPos((prev) => ({
        x: prev.x + (trailRef.current.x - prev.x) * 0.18,
        y: prev.y + (trailRef.current.y - prev.y) * 0.18,
      }));
      // Periodic ambient sparkle emission every ~25 frames
      sparkleTickRef.current = (sparkleTickRef.current + 1) % 25;
      if (sparkleTickRef.current === 0 && visibleRef.current) {
        sparkle({
          x: trailRef.current.x + (Math.random() * 8 - 4),
          y: trailRef.current.y + (Math.random() * 8 - 4),
          count: 1,
          kind: Math.random() > 0.5 ? "gold" : "rose",
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [capable.fine, capable.reduced]);

  if (!capable.fine || capable.reduced || !active) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[60] mix-blend-screen"
          style={{ x: pos.x - 12, y: pos.y - 12 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
        >
          {/* Outer soft glow */}
          <div
            className="h-6 w-6 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(244,63,94,0.3) 40%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
          {/* Inner core */}
          <div
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200"
            style={{ boxShadow: "0 0 8px 2px rgba(251,191,36,0.7)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
