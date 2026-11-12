import type { NoteShape } from "./types";

/** Multipliers of `--note-size` for a sticky's face. */
export type NoteSizeMul = { wMul: number; hMul: number };

/**
 * Short titles get a smaller face; everything else stays at the original
 * size (the max). One long token still counts as "not short".
 */
function isShortTitle(title: string): boolean {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const chars = title.trim().length;
  if (words.length >= 3 || chars >= 22) return false;
  if (chars >= 18 && words.length <= 2) return false;
  return true;
}

/**
 * Per-shape face size from the title. The pre-variable size is the ceiling —
 * short titles shrink; longer titles stay at the original face.
 */
export function noteSizeMul(title: string, shape: NoteShape): NoteSizeMul {
  const short = isShortTitle(title);

  switch (shape) {
    case "square":
    case "rounded":
      // Original max: 1 × 1.
      return short ? { wMul: 0.82, hMul: 0.78 } : { wMul: 1, hMul: 1 };

    case "circle":
    case "heart":
      // Original max: 1 × 1.
      return short ? { wMul: 0.82, hMul: 0.82 } : { wMul: 1, hMul: 1 };

    case "pill":
      // Original max: 1.5 × 0.7.
      return short ? { wMul: 1.25, hMul: 0.62 } : { wMul: 1.5, hMul: 0.7 };
  }
}

/** CSS lengths as `calc(var(--note-size) * mul)` for inline `--note-w` / `--note-h`. */
export function noteSizeVars(title: string, shape: NoteShape): {
  ["--note-w"]: string;
  ["--note-h"]: string;
} {
  const { wMul, hMul } = noteSizeMul(title, shape);
  return {
    "--note-w": `calc(var(--note-size) * ${wMul})`,
    "--note-h": `calc(var(--note-size) * ${hMul})`,
  };
}
