"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { startAmbientPad, stopAmbientPad, playChime } from "@/lib/audio";
import { sparkle } from "./SparkleCanvas";

export default function FloatingControls() {
  const [ambientOn, setAmbientOn] = useState(false);
  const [shared, setShared] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleAmbient = () => {
    if (ambientOn) {
      stopAmbientPad();
      setAmbientOn(false);
    } else {
      startAmbientPad();
      setAmbientOn(true);
      playChime(523.25, "sine", 0.8, 0.1);
    }
  };

  const burst = () => {
    sparkle({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 40,
      kind: "rainbow",
    });
    playChime(880, "sine", 1.0, 0.12);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    playChime(next === "dark" ? 392 : 523.25, "sine", 0.6, 0.1);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "For Heena — A Birthday", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      } catch {
        // no-op
      }
    }
    sparkle({
      x: window.innerWidth - 60,
      y: 60,
      count: 16,
      kind: "rose",
    });
    playChime(659.25, "sine", 0.6, 0.1);
  };

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        <motion.button
          onClick={burst}
          className="glass-premium flex h-10 w-10 items-center justify-center rounded-full text-stone-700 shadow-xl interactive-scale"
          whileHover={{ scale: 1.08, rotate: 15 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Celebrate"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-rose-500">
            <path d="M12 2 L13.5 9 L21 10 L15 14.5 L17 22 L12 18 L7 22 L9 14.5 L3 10 L10.5 9 Z" />
          </svg>
        </motion.button>

        <motion.button
          onClick={toggleAmbient}
          className="glass-premium flex h-10 w-10 items-center justify-center rounded-full text-stone-700 shadow-xl interactive-scale"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={ambientOn ? "Stop ambient music" : "Play ambient music"}
        >
          <AnimatePresence mode="wait">
            {ambientOn ? (
              <motion.svg
                key="on"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-amber-600"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <path d="M9 18V6l10-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zm10-2a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </motion.svg>
            ) : (
              <motion.svg
                key="off"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-stone-600"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <path d="M9 18V6l10-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zm10-2a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        {mounted && (
          <motion.button
            onClick={toggleTheme}
            className="glass-premium flex h-10 w-10 items-center justify-center rounded-full text-stone-700 shadow-xl interactive-scale"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.svg
                  key="sun"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="moon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-violet-600"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        <motion.button
          onClick={share}
          className="glass-premium flex h-10 w-10 items-center justify-center rounded-full text-stone-700 shadow-xl interactive-scale"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Share this card"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {shared && (
          <motion.div
            className="glass-premium fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-bold text-stone-700 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <span className="flex items-center gap-2">
              <span className="text-amber-500">✦</span>
              Link copied — share it with someone you love
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
