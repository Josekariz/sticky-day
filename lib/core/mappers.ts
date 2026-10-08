import { parseShape, type Note, type NoteStatus, type Energy, type PaperColor, type NoteShape } from "./types";

export type NoteRow = {
  id: string; day_id: string; user_id: string;
  title: string; detail: string; est_minutes: number; actual_minutes: number | null;
  spent_ms: number; energy: Energy; status: NoteStatus; color: PaperColor; shape: NoteShape;
  x: number; y: number; rotation: number; started_at: string | null;
  completed_at?: string | null;
  carried_from: string | null;
};

export function rowToNote(r: NoteRow): Note {
  return {
    id: r.id, title: r.title, detail: r.detail,
    estMinutes: r.est_minutes, actualMinutes: r.actual_minutes, spentMs: Number(r.spent_ms),
    energy: r.energy, status: r.status, color: r.color, shape: parseShape(r.shape) ?? "square",
    x: r.x, y: r.y, rotation: r.rotation,
    startedAt: r.started_at ? new Date(r.started_at).getTime() : null,
    carriedFrom: r.carried_from,
  };
}

export function noteToRow(n: Note, dayId: string, userId: string): NoteRow {
  return {
    id: n.id, day_id: dayId, user_id: userId,
    title: n.title, detail: n.detail, est_minutes: n.estMinutes, actual_minutes: n.actualMinutes,
    spent_ms: n.spentMs, energy: n.energy, status: n.status, color: n.color, shape: n.shape,
    x: n.x, y: n.y, rotation: n.rotation,
    started_at: n.startedAt ? new Date(n.startedAt).toISOString() : null,
    carried_from: n.carriedFrom,
  };
}

/** Partial<Note> -> partial row, for updates. */
export function patchToRow(p: Partial<Note>): Partial<NoteRow> {
  const r: Partial<NoteRow> = {};
  if (p.title !== undefined) r.title = p.title;
  if (p.detail !== undefined) r.detail = p.detail;
  if (p.estMinutes !== undefined) r.est_minutes = p.estMinutes;
  if (p.actualMinutes !== undefined) r.actual_minutes = p.actualMinutes;
  if (p.spentMs !== undefined) r.spent_ms = p.spentMs;
  if (p.energy !== undefined) r.energy = p.energy;
  if (p.status !== undefined) {
    r.status = p.status;
    // Useful audit field; staleness uses notes.updated_at (DB trigger), not this.
    r.completed_at = p.status === "done" ? new Date().toISOString() : null;
  }
  if (p.color !== undefined) r.color = p.color;
  if (p.shape !== undefined) r.shape = p.shape;
  if (p.x !== undefined) r.x = p.x;
  if (p.y !== undefined) r.y = p.y;
  if (p.rotation !== undefined) r.rotation = p.rotation;
  if (p.startedAt !== undefined) r.started_at = p.startedAt ? new Date(p.startedAt).toISOString() : null;
  if (p.carriedFrom !== undefined) r.carried_from = p.carriedFrom;
  return r;
}
