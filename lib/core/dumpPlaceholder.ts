/** Curated brain-dump placeholders — pick one per mount, never AI. */
export const DUMP_PLACEHOLDERS = [
  "What's on today?",
  "Let's list 'em.",
  "Ready when you are.",
  "Spill the day.",
  "What are we doing?",
  "Hit me with the pile.",
  "Brain → stickies.",
  "Dump it here.",
  "What's calling you?",
  "Name the next few.",
  "Out of your head, onto the board.",
  "What needs a sticky?",
  "Lay it out.",
  "Start anywhere.",
  "What's rattling around?",
  "One thought, or twenty.",
  "Clear the fog.",
  "What stays on the list?",
  "Type it like you'd say it.",
  "Let's make some notes.",
  "What's worth doing?",
  "Park it here.",
  "The messy version is fine.",
  "What should move today?",
  "Go on — unload.",
] as const;

/** Fresh line each call (board mount). */
export function pickDumpPlaceholder(random = Math.random): string {
  const i = Math.floor(random() * DUMP_PLACEHOLDERS.length);
  return DUMP_PLACEHOLDERS[i] ?? DUMP_PLACEHOLDERS[0];
}
