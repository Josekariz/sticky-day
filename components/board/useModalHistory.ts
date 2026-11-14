"use client";

import { useEffect, useRef } from "react";

/**
 * Phone back closes the overlay instead of leaving / refreshing the board.
 * Pushes a history entry while open; popstate dismisses; X/cleanup pops that entry.
 */
export function useModalHistory(open: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const marker = { stickyModal: true as const };
    history.pushState(marker, "");
    let closedByPop = false;

    function onPop() {
      closedByPop = true;
      dismiss.current();
    }

    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!closedByPop && (history.state as { stickyModal?: boolean } | null)?.stickyModal) {
        history.back();
      }
    };
  }, [open]);
}
