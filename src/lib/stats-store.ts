"use client";

import { create } from "zustand";

/**
 * Global, lightweight interaction stats store.
 * Tracks tiny moments across the experience so the StatsFinale section
 * can render an animated "your birthday in numbers" summary.
 *
 * The store initializes synchronously from localStorage on the client
 * (so cumulative stats survive reloads and aren't overwritten by
 * component mount effects that call `set`).
 */

export type StatsState = {
  memoriesRevealed: number;
  favoritesPinned: number;
  thoughtsKept: number;
  complimentsPlucked: number;
  tracksPlayed: number;
  candlesBlown: number;
  wishesSealed: number;
  lanternsReleased: number;
  sparklesFired: number;
  lastVisit: number | null;
};

const STORAGE_KEY = "heena:stats-v1";

const DEFAULTS: StatsState = {
  memoriesRevealed: 0,
  favoritesPinned: 0,
  thoughtsKept: 0,
  complimentsPlucked: 0,
  tracksPlayed: 0,
  candlesBlown: 0,
  wishesSealed: 0,
  lanternsReleased: 0,
  sparklesFired: 0,
  lastVisit: null,
};

type Store = {
  stats: StatsState;
  inc: (key: keyof StatsState, by?: number) => void;
  set: (key: keyof StatsState, value: number) => void;
  reset: () => void;
};

function load(): StatsState {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, lastVisit: Date.now() };
    const parsed = JSON.parse(raw) as Partial<StatsState>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(s: StatsState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // no-op
  }
}

// Initialize synchronously from localStorage on the client.
// This ensures cumulative stats are available BEFORE any component
// effect runs, avoiding race conditions where a component's `set`
// call would overwrite persisted values with defaults.
const initialStats = load();

export const useStatsStore = create<Store>((set, get) => ({
  stats: initialStats,
  inc: (key, by = 1) => {
    const next = { ...get().stats, [key]: (get().stats[key] as number) + by } as StatsState;
    set({ stats: next });
    persist(next);
  },
  set: (key, value) => {
    const next = { ...get().stats, [key]: value } as StatsState;
    set({ stats: next });
    persist(next);
  },
  reset: () => {
    const next = { ...DEFAULTS, lastVisit: Date.now() };
    set({ stats: next });
    persist(next);
  },
}));
