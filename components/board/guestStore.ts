import { GUEST_BOARD_KEY, parseGuestBoard, serializeGuestBoard } from "@/lib/core/guest";
import { splitLocal } from "@/lib/core/splitLocal";
import { toBoardNotes } from "@/lib/core/split";
import type { BoardStore } from "@/components/board/store";

export function readGuestBoard() {
  try {
    return parseGuestBoard(localStorage.getItem(GUEST_BOARD_KEY), Date.now());
  } catch {
    return [];
  }
}

export function clearGuestBoard() {
  try {
    localStorage.removeItem(GUEST_BOARD_KEY);
  } catch {
    // Storage blocked: nothing was saved either.
  }
}

/** A board kept in this browser only. It never calls the server or an AI. */
export function guestStore(): BoardStore {
  return {
    save() {},
    remove() {},
    async saveOnboarding() {},

    async split(text, board) {
      const split = splitLocal(text);
      const onBoard = board.filter((n) => n.status === "board");
      return {
        notes: toBoardNotes(split, onBoard, null, () => crypto.randomUUID()),
        warning: null,
        replayed: false,
      };
    },

    persist(notes) {
      try {
        if (notes.length === 0) localStorage.removeItem(GUEST_BOARD_KEY);
        else localStorage.setItem(GUEST_BOARD_KEY, serializeGuestBoard(notes, Date.now()));
      } catch {
        // Storage blocked or full: the board still works until the tab closes.
      }
    },
  };
}
