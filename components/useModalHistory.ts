"use client";

import { useEffect, useId, useRef } from "react";

type Entry = { id: string; dismiss: () => void };

/** Top-of-stack dismiss on browser/Android back; nested overlays pop one at a time. */
const stack: Entry[] = [];
let listening = false;
/** Ignore the next popstate(s) we caused ourselves via history.back() in cleanup. */
let suppress = 0;

function onPop() {
  if (suppress > 0) {
    suppress -= 1;
    return;
  }
  const top = stack.pop();
  top?.dismiss();
}

function ensureListen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("popstate", onPop);
}

/**
 * Phone back closes this overlay instead of leaving the page.
 * Pushes a history entry while open; popstate dismisses; X/cleanup pops that entry.
 */
export function useModalHistory(open: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const id = useId();

  useEffect(() => {
    if (!open) return;

    let closedByPop = false;
    const entry: Entry = {
      id,
      dismiss: () => {
        closedByPop = true;
        dismiss.current();
      },
    };

    ensureListen();
    history.pushState({ stickyModal: id }, "");
    stack.push(entry);

    return () => {
      const idx = stack.findIndex((e) => e.id === id);
      if (idx >= 0) stack.splice(idx, 1);

      if (closedByPop) return;

      // Closed via UI — drop our history entry without dismissing the overlay under us.
      if ((history.state as { stickyModal?: string } | null)?.stickyModal === id) {
        suppress += 1;
        history.back();
      }
    };
  }, [open, id]);
}
