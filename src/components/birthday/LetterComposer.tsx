"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

/**
 * LetterComposer — a fullscreen "write her a letter" overlay with elegant
 * cream stationery styling, three font choices (serif / handwritten / mono),
 * auto-save to localStorage, copy-to-clipboard, print, and a wax-seal close.
 *
 * Different from PoemComposer: this is user-authored prose, not procedural.
 */

const LETTER_KEY = "heena:letter-v1";
const MAX_LEN = 4000;

type FontChoice = "serif" | "hand" | "mono";

const FONT_OPTIONS: { id: FontChoice; label: string; sample: string; cls: string }[] = [
  { id: "serif", label: "Serif", sample: "Aa", cls: "letter-font-serif" },
  { id: "hand", label: "Handwritten", sample: "Aa", cls: "letter-font-hand" },
  { id: "mono", label: "Typewriter", sample: "Aa", cls: "letter-font-mono" },
];

const DEFAULT_BODY =
  "Dearest Heena,\n\n" +
  "On your birthday, I wanted to write you something slow — not a message, not a caption, but a letter.\n\n" +
  "Begin here…";

export default function LetterComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [body, setBody] = useState(DEFAULT_BODY);
  const [font, setFont] = useState<FontChoice>("serif");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [justOpened, setJustOpened] = useState(false);
  const incStat = useStatsStore((s) => s.inc);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage on first open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(LETTER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { body?: string; font?: FontChoice; savedAt?: number };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (typeof parsed.body === "string") setBody(parsed.body);
        if (parsed.font === "serif" || parsed.font === "hand" || parsed.font === "mono") setFont(parsed.font);
        if (typeof parsed.savedAt === "number") setSavedAt(parsed.savedAt);
      }
    } catch {
      // no-op
    }
    setJustOpened(true);
    setTimeout(() => setJustOpened(false), 100);
  }, [open]);

  // Debounced auto-save (1s after last keystroke)
  useEffect(() => {
    if (!open || justOpened) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(LETTER_KEY, JSON.stringify({ body, font, savedAt: now }));
        setSavedAt(now);
      } catch {
        // no-op
      }
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [body, font, open, justOpened]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Allow Esc to close only if not actively typing Esc within the textarea
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        playChime(392, "sine", 0.4, 0.08);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus the textarea when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => taRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleCopy = useCallback(async () => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const text = `${body}\n\n— for Heena, on ${today}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 16, kind: "gold" });
      playChime(659.25, "sine", 0.5, 0.1);
      incStat("sparklesFired", 1);
    } catch {
      // no-op
    }
  }, [body, incStat]);

  const handlePrint = useCallback(() => {
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 14, kind: "rainbow" });
    playChime(783.99, "sine", 0.6, 0.1);
    incStat("sparklesFired", 1);
    setTimeout(() => window.print(), 200);
  }, [incStat]);

  const handleSealClose = useCallback(() => {
    // Rainbow sparkle + chime when sealing the letter
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 26, kind: "rainbow" });
    playChime(523.25, "sine", 0.5, 0.1);
    playChime(659.25, "sine", 0.5, 0.08);
    incStat("sparklesFired", 1);
    onClose();
  }, [incStat, onClose]);

  const fmtTime = (ts: number | null) => {
    if (!ts) return null;
    const d = new Date(ts);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return sameDay ? `saved today at ${time}` : `saved ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`;
  };

  const savedLabel = fmtTime(savedAt);
  const charCount = body.length;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="letter-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            // Click on backdrop closes
            if (e.target === e.currentTarget) handleSealClose();
          }}
        >
          {/* Breathing aura */}
          <div className="letter-aura" aria-hidden />

          <motion.div
            className={`letter-paper ${font === "serif" ? "letter-font-serif" : font === "hand" ? "letter-font-hand" : "letter-font-mono"}`}
            initial={{ y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Write her a letter"
          >
            {/* Paper grain + ruled lines */}
            <div className="letter-paper-grain" aria-hidden />
            <div className="letter-paper-ruled" aria-hidden />

            {/* Letterhead */}
            <div className="letter-letterhead">
              <div className="no-print mb-1 flex items-center justify-center gap-2">
                <span className="letter-companion-glyph" aria-hidden>✦</span>
                <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.4em]" style={{ color: "rgba(180, 83, 9, 0.7)" }}>
                  a letter, for heena
                </span>
                <span className="letter-companion-glyph" aria-hidden style={{ animationDelay: "1.7s" }}>❋</span>
              </div>
              <h3 className="font-serif-elegant text-2xl font-bold" style={{ color: "rgba(60, 38, 12, 0.92)" }}>
                From the heart, in long form
              </h3>
              <p className="mt-1 font-serif-elegant text-xs italic" style={{ color: "rgba(120, 53, 15, 0.55)" }}>
                take your time. there is no word limit worth keeping.
              </p>
            </div>

            {/* Letter body */}
            <textarea
              ref={taRef}
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
              className="letter-textarea relative z-10"
              placeholder="Begin here…"
              spellCheck
              aria-label="Letter body"
            />

            {/* Toolbar */}
            <div className="letter-ribbon relative z-10">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                {/* Font selector */}
                <div className="flex items-center gap-1.5">
                  {FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFont(opt.id);
                        playChime(440 + FONT_OPTIONS.indexOf(opt) * 80, "sine", 0.3, 0.06);
                      }}
                      className={`letter-font-pill ${font === opt.id ? "active" : ""}`}
                      style={opt.id === "hand" ? { fontFamily: "var(--font-caveat), cursive", fontSize: "0.95rem" } : opt.id === "mono" ? { fontFamily: "var(--font-fira), monospace", fontSize: "0.65rem" } : { fontFamily: "var(--font-playfair), serif", fontSize: "0.75rem" }}
                      aria-pressed={font === opt.id}
                      aria-label={`Switch to ${opt.label} font`}
                    >
                      <span>{opt.sample}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Char count */}
                <span className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em]" style={{ color: "rgba(120, 53, 15, 0.55)" }}>
                  {charCount} / {MAX_LEN}
                </span>

                {/* Saved indicator */}
                {savedLabel && (
                  <span className="letter-saved-pill" title={savedLabel}>
                    <span aria-hidden>✓</span>
                    <span className="hidden sm:inline">{savedLabel}</span>
                    <span className="sm:hidden">saved</span>
                  </span>
                )}

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="letter-tool-btn letter-tool-btn-ghost"
                  aria-label="Copy letter to clipboard"
                >
                  <span aria-hidden>{copied ? "✓" : "⧉"}</span>
                  <span>{copied ? "copied" : "copy"}</span>
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="letter-tool-btn letter-tool-btn-ghost"
                  aria-label="Print this letter"
                >
                  <span aria-hidden>⎙</span>
                  <span>print</span>
                </button>

                {/* Seal & close */}
                <button
                  type="button"
                  onClick={handleSealClose}
                  className="letter-tool-btn letter-tool-btn-primary"
                  aria-label="Seal the letter and close"
                >
                  <span aria-hidden>✦</span>
                  <span>seal &amp; close</span>
                </button>
              </div>
            </div>

            {/* Bottom signature row — date + wax seal (decorative) */}
            <div className="relative z-10 flex items-center justify-between px-8 pb-6 pt-1">
              <span className="font-serif-elegant text-xs italic" style={{ color: "rgba(120, 53, 15, 0.55)" }}>
                {today}
              </span>
              <div className="letter-wax-seal" aria-hidden>H</div>
              <span className="font-serif-elegant text-xs italic" style={{ color: "rgba(120, 53, 15, 0.55)" }}>
                with love
              </span>
            </div>
          </motion.div>

          {/* Hint */}
          <motion.p
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-serif-elegant text-xs italic text-amber-100/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5 }}
          >
            escape or click outside to seal · auto-saved as you write
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
