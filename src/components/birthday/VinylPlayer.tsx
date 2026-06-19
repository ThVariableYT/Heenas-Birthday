"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { tracks, type Track } from "@/lib/birthday-data";
import { sparkle } from "./SparkleCanvas";
import { playChime, setMasterVolume, getMasterVolume, getAnalyser } from "@/lib/audio";
import { useStatsStore } from "@/lib/stats-store";
import SectionHeader from "./SectionHeader";

type LyricLine = { time: number; text: string };

type UploadedTrack = {
  name: string;
  url: string;
  duration: number;
  lyrics: LyricLine[];
  lrcName?: string;
};

function parseLrc(content: string): LyricLine[] {
  const lines = content.split(/\r?\n/);
  const out: LyricLine[] = [];
  const timeRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of lines) {
    const text = raw.replace(timeRe, "").trim();
    if (!text) continue;
    let m: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(raw)) !== null) {
      const mm = parseInt(m[1], 10);
      const ss = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, "0").slice(0, 3), 10) : 0;
      out.push({ time: mm * 60 + ss + ms / 1000, text });
    }
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

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

function RealtimeWaveform({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const analyser = getAnalyser();
    const buf = analyser ? new Uint8Array(analyser.fftSize) : null;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(167, 139, 250, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      if (!active || !analyser || !buf) {
        phaseRef.current += 0.03;
        const phase = phaseRef.current;
        ctx.strokeStyle = "rgba(167, 139, 250, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = midY + Math.sin(x * 0.04 + phase) * 3 * Math.sin(phase * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      analyser.getByteTimeDomainData(buf);

      ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      const step = w / buf.length;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        const y = midY + v * (h * 0.42);
        const x = i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(0.5, "#fb7185");
      grad.addColorStop(1, "#a78bfa");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        const y = midY + v * (h * 0.42);
        const x = i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="vinyl-waveform-canvas"
      aria-label={active ? "Real-time audio waveform — currently active" : "Real-time audio waveform — idle"}
      role="img"
    />
  );
}

function CircularSpectrum({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(SIZE * dpr);
    canvas.height = Math.floor(SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const analyser = getAnalyser();
    const BAR_COUNT = 64;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const render = () => {
      const w = SIZE;
      const h = SIZE;
      const cx = w / 2;
      const cy = h / 2;
      const innerR = 132;
      const maxBarLen = 24;

      ctx.clearRect(0, 0, w, h);

      phaseRef.current += 0.018;
      const phase = phaseRef.current;

      if (!active || !analyser || !buf) {
        for (let i = 0; i < BAR_COUNT; i++) {
          const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
          const breath = 0.5 + 0.5 * Math.sin(phase + i * 0.2);
          const len = 2 + breath * 3;
          const x1 = cx + Math.cos(angle) * innerR;
          const y1 = cy + Math.sin(angle) * innerR;
          const x2 = cx + Math.cos(angle) * (innerR + len);
          const y2 = cy + Math.sin(angle) * (innerR + len);
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.18 + breath * 0.18})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      analyser.getByteFrequencyData(buf);
      const usableBins = Math.floor(buf.length * 0.75);
      const stride = Math.max(1, Math.floor(usableBins / BAR_COUNT));

      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
        let sum = 0;
        let cnt = 0;
        for (let j = 0; j < stride; j++) {
          const idx = i * stride + j;
          if (idx < buf.length) {
            sum += buf[idx];
            cnt++;
          }
        }
        const avg = cnt ? sum / cnt : 0;
        const norm = avg / 255;
        const len = 2 + norm * maxBarLen;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * (innerR + len);
        const y2 = cy + Math.sin(angle) * (innerR + len);

        const r = Math.round(251 + (167 - 251) * norm);
        const g = Math.round(191 + (139 - 191) * norm);
        const b = Math.round(36 + (250 - 36) * norm);
        const alpha = 0.55 + norm * 0.45;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (norm > 0.4) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.85})`;
          ctx.beginPath();
          ctx.arc(x2, y2, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="vinyl-circular-spectrum"
      style={{ width: "320px", height: "320px" }}
      aria-label={active ? "Circular audio spectrum — currently active" : "Circular audio spectrum — idle"}
      role="img"
    />
  );
}

export default function VinylPlayer() {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [uploaded, setUploaded] = useState<UploadedTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0.35);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(32);
  const [copied, setCopied] = useState(false);
  const [sectionInView, setSectionInView] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const incStat = useStatsStore((s) => s.inc);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setSectionInView(entry.isIntersecting);
      },
      { rootMargin: "-20% 0px -20% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showMiniPlayer = playing && !paused && currentTrack && !sectionInView;

  useEffect(() => {
    setMasterVolume(muted ? 0 : volume);
    if (audioElRef.current) {
      audioElRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;

    const onLoaded = () => {
      setDuration(el.duration || 32);
      el.volume = muted ? 0 : volume;
      if (playing && !paused) {
        el.play().catch(() => {});
      }
    };

    const onTime = () => {
      setElapsed(el.currentTime);
      if (currentTrack) {
        const lyrics = currentTrack.lyrics || [];
        if (lyrics.length > 0) {
          let idx = -1;
          for (let i = 0; i < lyrics.length; i++) {
            if (el.currentTime >= lyrics[i].time) idx = i;
            else break;
          }
          setActiveLyricIndex(idx);
        }
      }
    };

    const onEnd = () => {
      stopPlayback();
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [currentTrack, muted, volume, playing, paused]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing && !paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, paused, currentTrack]);

  useEffect(() => {
    if (!playing || paused) return;
    const interval = setInterval(() => {
      const cx = window.innerWidth / 2;
      sparkle({ x: cx + (Math.random() * 80 - 40), y: window.innerHeight / 2, count: 1, kind: "rainbow" });
    }, 2000);
    return () => clearInterval(interval);
  }, [playing, paused]);

  const selectTrack = (track: any, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sparkle({ x: rect.left + rect.width / 2, y: rect.top, count: 12, kind: "gold" });

    if (currentTrack?.name === track.name && playing) {
      stopPlayback();
      return;
    }

    if (uploaded) {
      setUploaded(null);
    }

    if (!currentTrack || currentTrack.name !== track.name) {
      incStat("tracksPlayed", 1);
      incStat("sparklesFired", 1);
    }

    setCurrentTrack(track);
    setPlaying(true);
    setPaused(false);
    setElapsed(0);
    setActiveLyricIndex(-1);

    playChime(523.25, "sine", 1.5, 0.1);
  };

  const stopPlayback = () => {
    setPlaying(false);
    setPaused(false);
    setCurrentTrack(null);
    setElapsed(0);
    setActiveLyricIndex(-1);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    playChime(220, "sine", 0.8, 0.08);
  };

  const pausePlayback = () => {
    if (!playing) return;
    setPaused(true);
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    playChime(330, "sine", 0.4, 0.08);
  };

  const resumePlayback = () => {
    if (!playing || !paused) return;
    setPaused(false);
    if (audioElRef.current) {
      audioElRef.current.play().catch(() => {});
    }
    playChime(523.25, "sine", 0.4, 0.08);
  };

  const handleVinylClick = () => {
    if (playing) {
      if (paused) {
        resumePlayback();
      } else {
        pausePlayback();
      }
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
    if (audioElRef.current) {
      audioElRef.current.currentTime = newTime;
    }
    setActiveLyricIndex(() => {
      let idx = -1;
      const lyrics = currentTrack.lyrics || [];
      for (let i = 0; i < lyrics.length; i++) {
        if (newTime >= lyrics[i].time) idx = i;
        else break;
      }
      return idx;
    });
    playChime(440 + ratio * 400, "sine", 0.4, 0.08);
  };

  const seekToLyric = (time: number, idx: number) => {
    if (!currentTrack) return;
    const newTime = Math.max(0, Math.min(duration, time));
    setElapsed(newTime);
    if (audioElRef.current) {
      audioElRef.current.currentTime = newTime;
    }
    setActiveLyricIndex(idx);
    playChime(440 + (idx + 1) * 60, "sine", 0.4, 0.08);
    sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 6, kind: "gold" });
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

  const handleUpload = useCallback((files: FileList | null) => {
    setUploadError(null);
    if (!files || files.length === 0) return;
    const audioFile = Array.from(files).find((f) => f.type.startsWith("audio/"));
    const lrcFile = Array.from(files).find((f) => f.name.toLowerCase().endsWith(".lrc") || f.type === "text/plain");
    if (!audioFile) {
      setUploadError("Please choose an audio file (mp3, wav, ogg, m4a…).");
      return;
    }
    const url = URL.createObjectURL(audioFile);
    const reader = new FileReader();
    reader.onload = () => {
      const lrcText = typeof reader.result === "string" ? reader.result : "";
      const lyrics = lrcText ? parseLrc(lrcText) : [];
      const uploadedTrack: UploadedTrack = {
        name: audioFile.name.replace(/\.[^.]+$/, ""),
        url,
        duration: 0,
        lyrics,
        lrcName: lrcFile?.name,
      };
      setUploaded(uploadedTrack);
      setCurrentTrack(uploadedTrack);
      setPlaying(true);
      setPaused(false);
      setElapsed(0);
      setActiveLyricIndex(-1);
      incStat("tracksPlayed", 1);
      incStat("sparklesFired", 1);
      sparkle({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 22, kind: "rainbow" });
      playChime(783.99, "sine", 0.8, 0.12);
    };
    if (lrcFile) {
      reader.readAsText(lrcFile);
    } else {
      reader.onload({ target: { result: "" } } as unknown as ProgressEvent<FileReader>);
    }
  }, [incStat]);

  useEffect(() => {
    return () => {
      if (uploaded) URL.revokeObjectURL(uploaded.url);
    };
  }, [uploaded]);

  const clearUpload = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    setUploaded(null);
    if (currentTrack && currentTrack.url) {
      setCurrentTrack(null);
      setPlaying(false);
      setPaused(false);
      setElapsed(0);
      setActiveLyricIndex(-1);
    }
    playChime(392, "sine", 0.4, 0.08);
  };

  const copyLyrics = async () => {
    if (!currentTrack) return;
    const lyrics = currentTrack.lyrics || [];
    if (lyrics.length === 0) {
      setUploadError("No lyrics available for this track.");
      setTimeout(() => setUploadError(null), 2400);
      return;
    }
    const text =
      `${currentTrack.name}\n${uploaded ? "uploaded track" : currentTrack.mood}\n\n` +
      lyrics.map((l: any) => l.text).join("\n") +
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

  const activeLyrics = currentTrack ? (currentTrack.lyrics || []) : [];
  const isUploadedTrack = !!uploaded && currentTrack?.name === uploaded.name;

  return (
    <section ref={sectionRef} className="relative px-4 py-32">
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

      <SectionHeader
        number="05"
        eyebrow="the record player"
        accent="emerald"
        title={
          <>
            A few songs,
            <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
              {" "}
              pressed in your honour
            </span>
          </>
        }
        subtitle="Three tracks, three moods. Spin one, scrub the bar, shape the volume — let the words find you."
      />

      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.2fr]">
        <motion.div
          className="glass-premium relative flex flex-col items-center rounded-[2rem] p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div className="vinyl-spectrum-wrap" aria-hidden>
              <CircularSpectrum active={playing && !paused} />
            </div>
            <div
              className={`vinyl-glow absolute -inset-3 rounded-full ${playing && !paused ? "playing" : ""}`}
              aria-hidden
            />
            {playing && !paused && (
              <>
                <span className="vinyl-groove-ring" style={{ animationDelay: "0s" }} aria-hidden />
                <span className="vinyl-groove-ring" style={{ animationDelay: "1.1s" }} aria-hidden />
                <span className="vinyl-groove-ring" style={{ animationDelay: "2.2s" }} aria-hidden />
              </>
            )}
            <motion.button
              onClick={handleVinylClick}
              className="relative h-56 w-56 cursor-pointer rounded-full focus-ring-visible"
              aria-label={playing ? (paused ? "Resume" : "Pause") : "Play"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className={`vinyl-metallic absolute inset-0 rounded-full ${playing && !paused ? "" : "paused-record"}`}
                animate={playing && !paused ? { rotate: 360 } : { rotate: 0 }}
                transition={playing && !paused ? { duration: 11, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-stone-900/40" />
              <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-rose-400 to-amber-500 shadow-inner">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-100 to-rose-200 opacity-90">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="font-serif-elegant text-[0.6rem] uppercase tracking-[0.3em] text-rose-800/70">
                      {isUploadedTrack ? "your side a" : "side a"}
                    </span>
                    <span className="mt-1 line-clamp-2 px-2 font-serif-elegant text-sm font-bold text-rose-900">
                      {currentTrack ? currentTrack.name : "for heena"}
                    </span>
                    {paused && (
                      <span className="mt-1 font-mono-elegant text-[0.5rem] uppercase tracking-[0.2em] text-rose-700/70">
                        paused
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900" />
            </motion.button>

            <motion.div
              className="absolute -right-2 -top-6 h-20 w-2 origin-bottom rounded-full bg-gradient-to-b from-stone-300 to-stone-500 shadow-lg"
              animate={{ rotate: playing && !paused ? 5 : -15 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transformOrigin: "bottom right" }}
            >
              <div className="absolute -right-1 top-1 h-5 w-5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow" />
            </motion.div>
          </div>

          <div className="mt-6 w-full">
            <Waveform active={playing && !paused} progress={progress} />
          </div>

          <div className="mt-3 w-full">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.3em] text-violet-500/60">
                ◆ live waveform
              </span>
              <span className={`font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] ${playing && !paused ? "text-emerald-500/80" : "text-stone-400/60"}`}>
                {playing && !paused ? "● signal active" : "○ idle"}
              </span>
            </div>
            <RealtimeWaveform active={playing && !paused} />
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
                  className={`w-1 rounded-full bg-amber-500 ${playing && !paused ? "music-bar-active" : ""}`}
                  style={{
                    height: "4px",
                    animationDelay: playing && !paused ? `${i * 0.15}s` : "0s",
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
                {currentTrack ? (paused ? `${currentTrack.name} · paused` : currentTrack.name) : "tap to play a song"}
              </motion.span>
            </AnimatePresence>
          </div>

          <audio
            ref={audioElRef}
            src={currentTrack ? (currentTrack.url || currentTrack.audioSrc) : undefined}
            preload="metadata"
            className="hidden"
          />

          <div className="mt-5 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.lrc"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              aria-label="Upload an audio file and optional .lrc lyrics"
            />
            {uploaded ? (
              <div className="vinyl-upload has-file">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-emerald-700" aria-hidden>✓</span>
                  <span className="font-mono-elegant text-[0.6rem] uppercase tracking-[0.2em] text-emerald-700">
                    {uploaded.lrcName ? "audio + lyrics loaded" : "audio loaded"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 font-serif-elegant text-xs italic text-stone-600">
                  {uploaded.name}{uploaded.lrcName ? ` · ${uploaded.lrcName}` : ""}
                </p>
                <button
                  type="button"
                  onClick={clearUpload}
                  className="mt-2 font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-rose-600 transition-colors hover:text-rose-800"
                >
                  ✕ remove upload
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="vinyl-upload block w-full cursor-pointer"
              >
                <div className="font-mono-elegant text-[0.55rem] uppercase tracking-[0.2em] text-amber-700/80">
                  ↥ load your own track
                </div>
                <p className="mt-1 font-serif-elegant text-[0.7rem] italic text-stone-500">
                  choose an audio file — add a .lrc for synced lyrics
                </p>
              </button>
            )}
            {uploadError && (
              <p className="mt-2 text-center font-mono-elegant text-[0.55rem] uppercase tracking-[0.15em] text-rose-600">
                {uploadError}
              </p>
            )}
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
                  {activeLyrics.length === 0 ? (
                    <p className="py-8 text-center font-serif-elegant text-sm italic text-stone-500">
                      No lyrics for this track yet — load a .lrc to see synced lines.
                    </p>
                  ) : (
                    activeLyrics.map((line: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => seekToLyric(line.time, i)}
                        className={`lyric-line cursor-pointer font-serif-elegant text-base transition-colors hover:text-amber-700 ${
                          i === activeLyricIndex ? "active" : ""
                        }`}
                        title={`Jump to ${line.text.slice(0, 24)}…`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            seekToLyric(line.time, i);
                          }
                        }}
                      >
                        {line.text}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentTrack && playing && (
            <div className="px-2">
              <div className="mb-1.5 flex items-center justify-between font-mono-elegant text-[0.6rem] text-stone-500">
                <span>{fmt(elapsed)}</span>
                <span className="opacity-60">click bar to seek</span>
                <span>{duration > 0 ? fmt(duration) : "—"}</span>
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

      <div
        className={`now-playing-mini ${showMiniPlayer ? "visible" : ""}`}
        role="region"
        aria-label={`Now playing: ${currentTrack?.name ?? ""}`}
      >
        <button
          type="button"
          onClick={pausePlayback}
          className="npm-jump"
          aria-label="Pause playback"
          title="Pause"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
        <span className="npm-disc" aria-hidden />
        <span className="npm-eq" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="npm-title">{currentTrack?.name ?? ""}</span>
        <button
          type="button"
          onClick={() => {
            sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className="npm-jump"
          aria-label="Jump back to the record player"
          title="Back to record player"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}