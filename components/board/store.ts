import { SplitResponseSchema, type Note, type NoteShape, type SplitResponse } from "@/lib/core/types";
import { createClient } from "@/lib/supabase/client";
import { noteToRow, patchToRow } from "@/lib/core/mappers";
import { notesToImport } from "@/lib/core/guest";
import { trackSave } from "@/components/board/pendingSaves";
import { clearGuestBoard, readGuestBoard } from "@/components/board/guestStore";

/** Where a board's notes live: the account in Supabase, or a guest's browser. */
export type BoardStore = {
  save(id: string, patch: Partial<Note>): void;
  remove(ids: string[]): void;
  /** Rejects if the profile couldn't be saved, so the first-visit card can say so. */
  saveOnboarding(fields: { default_shape?: NoteShape | null }): Promise<void>;
  /** New notes for this text, placed clear of the board. Throws with a message to show. */
  split(text: string, board: Note[]): Promise<SplitResponse>;
  /** Called with every note after each change; the guest store keeps its copy this way. */
  persist?(notes: Note[]): void;
  /** Moves notes made before signing in into this board, returning the ones added. */
  importGuest?(): Promise<Note[]>;
};

export function supabaseStore(userId: string, dayId: string, capacityMinutes: number): BoardStore {
  const supabase = createClient();

  // Optimistic UI; track in-flight writes so nav can flush briefly.
  return {
    save(id, patch) {
      void trackSave(
        Promise.resolve(
          supabase.from("notes").update(patchToRow(patch)).eq("id", id).eq("user_id", userId),
        ).then(({ error }) => {
          if (error) console.error("save failed", id, error.message);
        }),
      );
    },

    remove(ids) {
      void trackSave(
        Promise.resolve(
          supabase.from("notes").delete().in("id", ids).eq("user_id", userId),
        ).then(({ error }) => {
          if (error) console.error("delete failed", error.message);
        }),
      );
    },

    async saveOnboarding(fields) {
      const { error } = await trackSave(
        Promise.resolve(
          supabase
            .from("profiles")
            .update({ ...fields, onboarded_at: new Date().toISOString() })
            .eq("id", userId),
        ),
      );
      if (error) throw new Error(error.message);
    },

    async split(text) {
      const res = await fetch("/api/ai/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump: text, capacityMinutes }),
      });
      if (!res.ok) {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong";
        throw new Error(err);
      }
      const parsed = SplitResponseSchema.safeParse(await res.json());
      if (!parsed.success) throw new Error("Something went wrong");
      return parsed.data;
    },

    // Ids are fresh UUIDs, so running this twice adds nothing the second time.
    async importGuest() {
      const notes = notesToImport(readGuestBoard(), Date.now());
      if (notes.length === 0) return [];
      const rows = notes.map((n) => ({
        ...noteToRow(n, dayId, userId),
        completed_at: n.status === "done" ? new Date().toISOString() : null,
      }));
      const { error } = await supabase.from("notes").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      if (error) {
        console.error("guest import failed", error.message);
        return [];
      }
      clearGuestBoard();
      return notes;
    },
  };
}
