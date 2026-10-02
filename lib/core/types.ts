export type NoteStatus = "board" | "focus" | "done" | "trashed";
export type Energy = "low" | "medium" | "high";

export const PAPER_COLORS = [
  "yellow", "lime", "mint", "teal", "sky", "lavender",
  "lilac", "pink", "coral", "peach", "sand", "grey",
] as const;
export type PaperColor = (typeof PAPER_COLORS)[number];

export function paperVar(color: PaperColor) {
  return `var(--paper-${color})`;
}

export type Note = {
  id: string;
  title: string;
  detail: string;
  estMinutes: number;
  actualMinutes: number | null;
  energy: Energy;
  status: NoteStatus;
  color: PaperColor;
  x: number; // 0..1, fraction of the board's usable width
  y: number; // 0..1, fraction of the board's usable height
  rotation: number;
  startedAt: number | null; // epoch ms while this focus note's timer is running
  spentMs: number; // accumulated focus time across pauses
  carriedFrom: string | null; // YYYY-MM-DD of the day first written; set on rollover
};

export const MAX_FOCUS = 3;
 