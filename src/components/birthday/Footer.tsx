"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { footerSignature } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

export default function Footer() {
  const incStat = useStatsStore((s) => s.inc);
  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);
  const idxRef = useRef(0);

  // Typewriter effect for the signature (triggers on in-view)
  useEffect(() => {
    const timer = setInterval(() => {
      idxRef.current += 1;
      if (idxRef.current >= footerSignature.length) {
        setTyped(footerSignature);
        setDoneTyping(true);
        clearInterval(timer);
        return;
      }
      setTyped(footerSignature.slice(0, idxRef.current));
    }, 45);
    return () => clearInterval(timer);
  }, []);

  const celebrate = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      count: 30,
      kind: "rainbow",
    });
    incStat("sparklesFired", 1);
    playChime(783.99, "sine", 0.6, 0.1);
  };

  return (
    <footer className="relative mt-24 px-4 pb-10 pt-16">
      <div className="mx-auto max-w-3xl">
        <div className="editorial-line mb-12" />

        {/* Art-deco ornamental rule above the signature */}
        <div className="footer-ornament" aria-hidden>
          <span className="footer-ornament-rule" />
          <span className="footer-ornament-glyph">✦</span>
          <span className="footer-ornament-rule" />
          <span className="footer-ornament-glyph" style={{ animationDelay: "0.5s" }}>—</span>
          <span className="footer-ornament-rule" />
          <span className="footer-ornament-glyph" style={{ animationDelay: "1s" }}>✦</span>
          <span className="footer-ornament-rule" />
        </div>

        <motion.div
          className="flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Wax-seal stamp — decorative embossed monogram */}
          <div className="relative flex items-center justify-center" aria-hidden>
            <span className="wax-seal-rotate" />
            <div className="wax-seal-stamp">H</div>
          </div>

          <motion.button
            onClick={celebrate}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/50 bg-gradient-to-br from-amber-100/80 to-rose-100/80 shadow-lg backdrop-blur"
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="One more sparkle"
          >
            <div
              className="absolute -inset-2 rounded-full opacity-60"
              style={{
                background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
              }}
            />
            <span className="relative text-3xl text-amber-600">✦</span>
          </motion.button>

          <p className="max-w-md font-serif-elegant text-lg italic leading-relaxed text-stone-600">
            &ldquo;{typed}
            <motion.span
              className="ml-0.5 inline-block w-0.5 -translate-y-0.5 text-amber-500"
              animate={{ opacity: doneTyping ? [1, 0, 1] : [1, 0] }}
              transition={{ duration: doneTyping ? 1.4 : 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              |
            </motion.span>
            &rdquo;
          </p>

          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-amber-400/40" />
            <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.4em] text-stone-400">
              fin
            </span>
            <div className="h-px w-8 bg-amber-400/40" />
          </div>

          <p className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-stone-400">
            composed with light, sound &amp; care
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
