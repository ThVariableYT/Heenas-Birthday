"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { tracks, type Track } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime, startProceduralMelody, setMasterVolume, getMasterVolume } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";

function parseDuration(d: string): number {
  const m = d.match(/(\d+):(\d+)/);
  if (!m) return 32;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function Waveform({ active, progress }: { active: boolean; progress: number }) {
  const bars = useMemo(() => Array.from({ length: 48 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.7)) * 0.8), []);
  return (
    <div className="flex h-10 items-end gap-[2px]">
      {bars.map((b, i) => {
        const filled = i / bars.length <= progress;
        const animName = active && filled ? "bounce-bar" : "none";
        const animDur = `${0.6 + (i % 4) * 0.1}s`;
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-colors ${filled ? "bg-gradient-to-t from-amber-500 to-rose-400" : "bg-stone-300/70"}`}
            style={{
              height: `${b * 100}%`,
              animationName: animName,
              animationDuration: animDur,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationDelay: `${i * 0.03}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function VinylPlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0.35);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(32);
  const [copied, setCopied] = useState(false);
  const proceduralRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const incStat = useStatsStore((s) => s.inc);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    setMasterVolume(muted ? 0 : volume);
  }, [volume, muted]);

  useEffect(() => {
    if (!playing || !currentTrack) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.5;
        if (next >= duration) {
          return prev;
        }
        const lyrics = currentTrack.lyrics;
        let idx = -1;
        for (let i = 0; i < lyrics.length; i++) {
          if (next >= lyrics[i].time) idx = i;
          else break;
        }
        setActiveLyricIndex(idx);
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [playing, currentTrack, duration]);

  const selectTrack = (track: Track, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({ x: rect.left + rect.width / 2, y: rect.top, count: 12, kind: "gold" });

    if (currentTrack?.name === track.name && playing) {
      stopPlayback();
      return;
    }

    // Count a newly-selected track (only when switching to a different one or starting fresh)
    if (!currentTrack || currentTrack.name !== track.name) {
      incStat("tracksPlayed", 1);
      incStat("sparklesFired", 1);
    }

    if (proceduralRef.current) {
      clearInterval(proceduralRef.current);
      proceduralRef.current = null;
    }

    setDuration(parseDuration(track.duration));
    setCurrentTrack(track);
    setPlaying(true);
    setElapsed(0);
    setActiveLyricIndex(-1);

    proceduralRef.current = startProceduralMelody(() => {
      const cx = window.innerWidth / 2;
      sparkle({ x: cx + (Math.random() * 80 - 40), y: window.innerHeight / 2, count: 1, kind: "rainbow" });
    });
    playChime(523.25, "sine", 1.5, 0.1);
  };

  const stopPlayback = () => {
    setPlaying(false);
    setCurrentTrack(null);
    setElapsed(0);
    setActiveLyricIndex(-1);
    if (proceduralRef.current) {
      clearInterval(proceduralRef.current);
      proceduralRef.current = null;
    }
    playChime(220, "sine", 0.8, 0.08);
  };

  const handleVinylClick = () => {
    if (playing) {
      stopPlayback();
    } else if (tracks[0]) {
      selectTrack(tracks[0], { currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) } } as unknown as React.MouseEvent);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    setElapsed(newTime);
    setActiveLyricIndex(() => {
      let idx = -1;
      for (let i = 0; i < currentTrack.lyrics.length; i++) {
        if (newTime >= currentTrack.lyrics[i].time) idx = i;
        else break;
      }
      return idx;
    });
    playChime(440 + ratio * 400, "sine", 0.4, 0.08);
  };

  const toggleMute = () => {
    setMuted((m) => !m);
    if (!muted) {
      setMasterVolume(0);
    } else {
      setMasterVolume(getMasterVolume() || volume);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progress = currentTrack ? Math.min(elapsed / duration, 1) : 0;

  const copyLyrics = async () => {
    if (!currentTrack) return;
    const text =
      `${currentTrack.name}\n${currentTrack.mood}\n\n` +
      currentTrack.lyrics.map((l) => l.text).join("\n") +
      `\n\n— for Heena`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sparkle({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        count: 14,
        kind: "gold",
      });
      playChime(659.25, "sine", 0.5, 0.08);
    } catch {
      // no-op
    }
  };

  return (
    <section className="relative px-4 py-32">
      {/* Ambient star field — a quiet cosmic backdrop for the record player */}
      <div className="vinyl-star-field" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="vs-star"
            style={{
              top: `${(i * 37 + 5) % 95}%`,
              left: `${(i * 53 + 8) % 95}%`,
              animationDelay: `${(i % 7) * 0.4}s`,
              animationDuration: `${4 + (i % 4) * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto mb-16 max-w-3xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-10 bg-amber-400/40" />
          <span className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.4em] text-amber-700/70">
            the record player
          </span>
          <div className="h-px w-10 bg-amber-400/40" />
        </div>
        <h2 className="font-serif-elegant text-4xl font-bold text-stone-800 sm:text-5xl">
          A few songs,
          <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
            {" "}
            pressed in your honour
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base text-stone-600">
          Three tracks, three moods. Spin one, scrub the bar, shape the volume — let the words find
          you.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.2fr]">
        <motion.div
          className="glass-premium relative flex flex-col items-center rounded-[2rem] p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div
              className={`vinyl-glow absolute -inset-3 rounded-full ${playing ? "playing" : ""}`}
              aria-hidden
            />
            <motion.button
              onClick={handleVinylClick}
              className="relative h-56 w-56 cursor-pointer rounded-full focus-ring-visible"
              aria-label={playing ? "Pause" : "Play"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className={`vinyl-metallic absolute inset-0 rounded-full ${playing ? "" : "paused-record"}`}
                animate={playing ? { rotate: 360 } : { rotate: 0 }}
                transition={playing ? { duration: 11, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-stone-900/40" />
              <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-rose-400 to-amber-500 shadow-inner">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-100 to-rose-200 opacity-90">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="font-serif-elegant text-[0.6rem] uppercase tracking-[0.3em] text-rose-800/70">
                      side a
                    </span>
                    <span className="mt-1 font-serif-elegant text-sm font-bold text-rose-900">
                      {currentTrack ? currentTrack.name : "for heena"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900" />
            </motion.button>

            <motion.div
              className="absolute -right-2 -top-6 h-20 w-2 origin-bottom rounded-full bg-gradient-to-b from-stone-300 to-stone-500 shadow-lg"
              animate={{ rotate: playing ? 5 : -15 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transformOrigin: "bottom right" }}
            >
              <div className="absolute -right-1 top-1 h-5 w-5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow" />
            </motion.div>
          </div>

          <div className="mt-6 w-full">
            <Waveform active={playing} progress={progress} />
          </div>

          <div className="mt-5 flex w-full items-center gap-3">
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-stone-600 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-ring-visible"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
              className="heena-range flex-1"
              aria-label="Volume"
            />
            <span className="w-10 text-right font-mono-elegant text-[0.6rem] text-stone-500">
              {Math.round((muted ? 0 : volume) * 100)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-6 items-end gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-amber-500 ${playing ? "music-bar-active" : ""}`}
                  style={{
                    height: "4px",
                    animationDelay: playing ? `${i * 0.15}s` : "0s",
                  }}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentTrack?.name || "idle"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="font-serif-elegant text-sm italic text-stone-600"
              >
                {currentTrack ? currentTrack.name : "tap to play a song"}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-2">
            {tracks.map((track, i) => {
              const isActive = currentTrack?.name === track.name && playing;
              const indexStr = String(i + 1).padStart(2, "0");
              return (
                <motion.button
                  key={track.name}
                  onClick={(e) => selectTrack(track, e)}
                  className={`group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all interactive-scale focus-ring-visible ${
                    isActive
                      ? "border-amber-300 bg-amber-50/80 shadow-md"
                      : "border-white/70 bg-white/60 hover:border-amber-200 hover:bg-white/90 hover:shadow-md"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-serif-elegant text-lg text-stone-400 group-hover:text-amber-700">
                      {indexStr}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-stone-800">
                        {isActive && (
                          <motion.span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
                            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            aria-hidden
                          />
                        )}
                        {track.name}
                      </div>
                      <div className="font-mono-elegant text-[0.65rem] uppercase tracking-[0.2em] text-stone-400">
                        {track.mood} · {track.duration}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isActive ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600"
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isActive ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <rect x="2" y="1" width="3" height="10" rx="1" />
                        <rect x="7" y="1" width="3" height="10" rx="1" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 1 L10 6 L3 11 Z" />
                      </svg>
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {currentTrack && playing && (
              <motion.div
                className="glass-card overflow-hidden rounded-2xl"
                initial={{ maxHeight: 0, opacity: 0, marginTop: 0 }}
                animate={{ maxHeight: 320, opacity: 1, marginTop: 16 }}
                exit={{ maxHeight: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between border-b border-amber-200/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-amber-500"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      ♪
                    </motion.span>
                    <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.3em] text-amber-700/70">
                      now playing · {currentTrack.name}
                    </span>
                  </div>
                  <button
                    onClick={copyLyrics}
                    className="flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-white/70 px-2.5 py-1 font-mono-elegant text-[0.5rem] uppercase tracking-[0.2em] text-amber-700 transition-colors hover:bg-amber-50 focus-ring-visible"
                    aria-label="Copy lyrics to clipboard"
                  >
                    <span>{copied ? "✓ copied" : "⧉ copy lyrics"}</span>
                  </button>
                </div>
                <div className="no-scrollbar overflow-y-auto p-5" style={{ maxHeight: 240 }}>
                  {currentTrack.lyrics.map((line, i) => (
                    <div
                      key={i}
                      className={`lyric-line font-serif-elegant text-base ${
                        i === activeLyricIndex ? "active" : ""
                      }`}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentTrack && playing && (
            <div className="px-2">
              <div className="mb-1.5 flex items-center justify-between font-mono-elegant text-[0.6rem] text-stone-500">
                <span>{fmt(elapsed)}</span>
                <span className="opacity-60">click bar to seek</span>
                <span>{fmt(duration)}</span>
              </div>
              <div
                onClick={seek}
                className="group relative h-2 cursor-pointer rounded-full bg-stone-200 focus-ring-visible"
                role="slider"
                aria-label="Seek"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                  style={{ width: `${progress * 100}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500 bg-white shadow-md transition-transform group-hover:scale-110"
                  style={{ left: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
