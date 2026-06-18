"use client";

let audioCtx: AudioContext | null = null;
let mainGain: GainNode | null = null;
let delayNode: DelayNode | null = null;
let feedbackNode: GainNode | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientActive = false;
let proceduralInterval: ReturnType<typeof setInterval> | null = null;
let proceduralSuspended = false;

export function initAudio() {
  if (audioCtx) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
    mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

    delayNode = audioCtx.createDelay(1.0);
    delayNode.delayTime.setValueAtTime(0.3, audioCtx.currentTime);

    feedbackNode = audioCtx.createGain();
    feedbackNode.gain.setValueAtTime(0.25, audioCtx.currentTime);

    mainGain.connect(audioCtx.destination);
    mainGain.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(audioCtx.destination);
  } catch {
    // no-op
  }
}

export function setMasterVolume(v: number) {
  if (!audioCtx || !mainGain) return;
  const clamped = Math.max(0, Math.min(1, v));
  try {
    mainGain.gain.cancelScheduledValues(audioCtx.currentTime);
    mainGain.gain.linearRampToValueAtTime(clamped, audioCtx.currentTime + 0.1);
  } catch {
    // no-op
  }
}

export function getMasterVolume(): number {
  if (!mainGain) return 0.35;
  try {
    return mainGain.gain.value;
  } catch {
    return 0.35;
  }
}

export function resumeAudio() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

/**
 * Suspend the entire AudioContext — used by the vinyl mini-player's pause
 * button to pause the procedural melody + ambient pad without losing state.
 */
export function suspendAudio() {
  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend();
  }
}

export function playChime(
  freq: number,
  type: OscillatorType = "sine",
  duration = 1.0,
  volume = 0.12,
) {
  if (!audioCtx || !mainGain) return;
  // Resume if suspended — chimes should always be audible
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(mainGain);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // no-op
  }
}

export function playSparkleChord() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => {
    setTimeout(() => playChime(n, "triangle", 1.2, 0.08), i * 60);
  });
}

export function startAmbientPad() {
  if (!audioCtx || !mainGain || ambientActive) return;
  ambientActive = true;
  const freqs = [130.81, 196.0, 261.63];
  freqs.forEach((f) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, audioCtx!.currentTime);
    gain.gain.setValueAtTime(0, audioCtx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, audioCtx!.currentTime + 2);
    osc.connect(gain);
    gain.connect(mainGain!);
    osc.start();
    ambientNodes.push({ osc, gain });
  });
}

export function stopAmbientPad() {
  if (!audioCtx) return;
  ambientActive = false;
  ambientNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 1.2);
      osc.stop(audioCtx!.currentTime + 1.3);
    } catch {
      // no-op
    }
  });
  ambientNodes = [];
}

export function startProceduralMelody(onChord: (time: number) => void) {
  const chords = [
    [261.63, 329.63, 392.0, 493.88],
    [349.23, 440.0, 523.25, 587.33],
    [293.66, 349.23, 440.0, 523.25],
    [392.0, 493.88, 587.33, 698.46],
  ];
  let idx = 0;
  let mockTime = 0;
  proceduralSuspended = false;
  // Clear any existing interval before starting a new one
  if (proceduralInterval) {
    clearInterval(proceduralInterval);
    proceduralInterval = null;
  }
  const interval = setInterval(() => {
    // If the AudioContext is suspended (paused), skip the chord — but keep the interval alive
    if (proceduralSuspended || (audioCtx && audioCtx.state === "suspended")) {
      return;
    }
    const chord = chords[idx];
    chord.forEach((note, i) => {
      setTimeout(() => playChime(note, "sine", 2.8, 0.07), i * 180);
    });
    idx = (idx + 1) % chords.length;
    mockTime += 2;
    onChord(mockTime);
  }, 2000);
  proceduralInterval = interval;
  return interval;
}

/**
 * Mark the procedural melody as paused — the interval keeps running but
 * skips chord playback. Pair with suspendAudio() for a true pause.
 */
export function pauseProceduralMelody() {
  proceduralSuspended = true;
  suspendAudio();
}

/**
 * Resume the procedural melody after a pause.
 */
export function resumeProceduralMelody() {
  proceduralSuspended = false;
  resumeAudio();
}

/**
 * Fully stop the procedural melody (clears the interval).
 */
export function stopProceduralMelody() {
  proceduralSuspended = false;
  if (proceduralInterval) {
    clearInterval(proceduralInterval);
    proceduralInterval = null;
  }
}
