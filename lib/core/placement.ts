import { PAPER_COLORS, type PaperColor } from "./types";

type Pos = { x: number; y: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Picks a spot on a loose grid that no existing note is sitting on. */
export function placeNote(existing: Pos[], cols = 5, rows = 3): Pos {
  const slots: Pos[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      slots.push({ x: c / (cols - 1), y: r / (rows - 1) });

  const free = slots.filter((s) => existing.every((e) => Math.hypot(e.x - s.x, e.y - s.y) > 0.14));
  const base = free.length ? free[Math.floor(Math.random() * free.length)] : { x: Math.random(), y: Math.random() };
  const jitter = () => (Math.random() - 0.5) * 0.06;
  return { x: clamp01(base.x + jitter()), y: clamp01(base.y + jitter()) };
}

export function randomRotation() {
  return Math.round((Math.random() * 8 - 4) * 10) / 10; // -4..4
}

export function randomColor(): PaperColor {
  return PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)];
}