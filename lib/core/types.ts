export type NoteStatus = "board" | "focus" | "done";
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
  startedAt: number | null; // epoch ms, set while status === "focus"
}; 