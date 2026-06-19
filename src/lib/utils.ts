import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLRC(lrcText: string): { time: number; text: string }[] {
  if (!lrcText) return [];
  const lines = lrcText.split("\n");
  const result: { time: number; text: string }[] = [];
  
  // Regex designed to parse timestamps matching standard layout variations: [mm:ss.xx] or [mm:ss:xx]
  const timeRegex = /\[(\d+):(\d+)(?:[\.:](\d+))?\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const totalSeconds = minutes * 60 + seconds;
      const text = line.replace(timeRegex, "").trim();
      
      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}