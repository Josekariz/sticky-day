import type { SplitNote } from "./split";

const DEFAULT_MINUTES = 30;
const MAX_NOTES = 12;

// Where one thing ends and the next begins: new lines, sentence ends, commas, and linking words.
const BREAKS = /\r?\n|[;,]|[.!?](?=\s|$)|\s+(?:and then|then|after that|afterwards|and)\s+/i;
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s*/;
const FILLER = /^(?:(?:i\s+)?(?:need|have|want|got)\s+to|gotta|also|maybe|finally|first|then|and)\s+/i;
const DURATION = /\s*(?:for\s+)?(?:about\s+)?(\d+(?:\.\d+)?)\s*(h|hrs?|hours?|m|mins?|minutes?)\b/i;
const URGENT = /\b(?:urgent|asap|deadline)\b/i;

function minutesIn(fragment: string): number | null {
  const m = DURATION.exec(fragment);
  if (!m) return null;
  const value = Number(m[1]) * (m[2].toLowerCase().startsWith("h") ? 60 : 1);
  return Math.min(240, Math.max(5, Math.round(value / 5) * 5));
}

/**
 * A quick split with no AI: one note per line, comma, sentence or "and/then".
 * Minutes are 30 unless the text names a duration ("2h", "45 min").
 */
export function splitLocal(text: string): SplitNote[] {
  const notes: SplitNote[] = [];
  for (const raw of text.split(BREAKS)) {
    let words = raw.replace(BULLET, "").trim();
    while (FILLER.test(words)) words = words.replace(FILLER, "");
    const minutes = minutesIn(words);
    const title = words.replace(DURATION, "").trim();
    if (!title) continue;

    notes.push({
      title: (title[0].toUpperCase() + title.slice(1)).slice(0, 60),
      detail: title.length > 60 ? title.slice(0, 240) : "",
      estMinutes: minutes ?? DEFAULT_MINUTES,
      priority: URGENT.test(words) ? "high" : "medium",
    });
    if (notes.length === MAX_NOTES) break;
  }
  return notes;
}
