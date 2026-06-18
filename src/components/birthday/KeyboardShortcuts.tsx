"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { playChime } from "@/lib/audio";
import { sparkle } from "./SparkleCanvas";
import { useStatsStore } from "@/lib/stats-store";

/**
 * Global keyboard shortcuts + a discoverable "?" hint.
 * Shortcuts:
 *   S  — fire a sparkle burst at the cursor
 *   T  — toggle light/dark theme
 *   M  — toggle ambient pad music
 *   B  — back to top
 *   ?  — show/hide the shortcuts hint
 *   Esc — hide the hint
 *
 * Shortcuts are ignored while the user is typing in an input/textarea.
 */
export default function KeyboardShortcuts() {
  const [hintOpen, setHintOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { theme, setTheme } = useTheme();
  const incStat = useStatsStore((s) => s.inc);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire while typing
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        sparkle({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          count: 30,
          kind: "rainbow",
        });
        playChime(880, "sine", 0.8, 0.1);
        incStat("sparklesFired", 1);
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
      } else if (key === "t") {
        e.preventDefault();
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        playChime(next === "dark" ? 392 : 523.25, "sine", 0.5, 0.08);
      } else if (key === "m") {
        e.preventDefault();
        // Toggle ambient by reading the audio module — we just dispatch the same logic
        // Use a custom event so FloatingControls can sync its icon
        window.dispatchEvent(new CustomEvent("heena:toggle-ambient"));
        playChime(440, "sine", 0.4, 0.08);
      } else if (key === "c") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("heena:toggle-cursor"));
        playChime(523.25, "sine", 0.4, 0.08);
      } else if (key === "b") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        playChime(330, "sine", 0.4, 0.06);
      } else if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setHintOpen((v) => !v);
      } else if (key === "escape") {
        setHintOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [theme, setTheme]);

  // (Ambient toggle is handled by FloatingControls, which listens for the
  //  "heena:toggle-ambient" event this component dispatches when M is pressed.)

  return (
    <>
      {/* Hint button — bottom-right, doesn't conflict with BackToTop (bottom-left) */}
      <motion.button
        onClick={() => setHintOpen((v) => !v)}
        className="glass-premium fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full text-stone-600 shadow-lg interactive-scale"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Show keyboard shortcuts"
        animate={pulse ? { scale: [1, 1.2, 1] } : {}}
      >
        <span className="font-mono-elegant text-sm font-bold text-amber-600">?</span>
      </motion.button>

      <AnimatePresence>
        {hintOpen && (
          <motion.div
            className="glass-premium fixed bottom-18 right-4 z-50 w-72 rounded-2xl p-5 shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                shortcuts
              </span>
              <button
                onClick={() => setHintOpen(false)}
                className="font-mono-elegant text-[0.6rem] text-stone-400 hover:text-stone-600"
                aria-label="Close shortcuts"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {[
                { key: "S", label: "fire a sparkle burst" },
                { key: "T", label: "toggle light / dark" },
                { key: "M", label: "ambient music on / off" },
                { key: "C", label: "sparkle cursor on / off" },
                { key: "B", label: "back to top" },
                { key: "?", label: "show / hide this hint" },
                { key: "Esc", label: "close any overlay" },
              ].map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3">
                  <span className="font-serif-elegant text-sm text-stone-600">{s.label}</span>
                  <kbd className="flex h-6 min-w-6 items-center justify-center rounded border border-amber-300/60 bg-amber-50 px-1.5 font-mono-elegant text-[0.6rem] font-bold text-amber-700">
                    {s.key}
                  </kbd>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-serif-elegant text-[0.7rem] italic text-stone-400">
              Shortcuts pause while you type.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
