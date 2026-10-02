/** Short end-of-day themes. Pure: no React, no globals beyond Date maths. */

export const THEMES = [
  "why writing it down makes it lighter",
  "what a half-done day actually means",
  "carrying something over is deciding, not failing",
  "small notes beat big intentions",
  "the clear board, and why it feels quiet",
  "estimates are guesses, and guessing is fine",
  "what to do with a day that went sideways",
  "rest counts as a note",
] as const;

export const SIGN_OFFS = [
  "See you tomorrow 🌙",
  "Same board, fresh start ☀️",
  "Rest well, the notes will wait.",
  "That's enough for today ✨",
  "Tomorrow gets the leftovers 🌱",
  "Board's here when you are ☕",
] as const;

function dayNum(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Deterministic theme for a YYYY-MM-DD date. Consecutive days never share one. */
export function themeFor(isoDate: string): string {
  const n = dayNum(isoDate);
  return THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length];
}

/** Deterministic handwritten sign-off for a YYYY-MM-DD date. */
export function signOffFor(isoDate: string): string {
  const n = dayNum(isoDate);
  return SIGN_OFFS[((n % SIGN_OFFS.length) + SIGN_OFFS.length) % SIGN_OFFS.length];
}
