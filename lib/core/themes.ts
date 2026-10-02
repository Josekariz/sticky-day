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

/** Deterministic theme for a YYYY-MM-DD date. Consecutive days never share one. */
export function themeFor(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Days since a fixed epoch; consecutive dates differ by 1, so % length never repeats next door.
  const dayNum = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return THEMES[((dayNum % THEMES.length) + THEMES.length) % THEMES.length];
}
