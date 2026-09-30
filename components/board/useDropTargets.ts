"use client";

import { useRef, useState } from "react";

export type DropTarget = "clipboard" | "bin" | "board" | "tray" | null;

// The first element for a target that is actually on screen. On phones the drop
// bar comes before the desktop targets in the DOM; from md up it is display:none
// and measures 0 wide. Measured on every move because the bar slides in after
// the drag starts.
function rectOf(key: Exclude<DropTarget, null>): DOMRect | undefined {
  for (const el of document.querySelectorAll(`[data-drop='${key}']`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0) return r;
  }
  return undefined;
}

export function useDropTargets() {
  const overRef = useRef<DropTarget>(null);
  const [over, setOver] = useState<DropTarget>(null);
  const [dragging, setDragging] = useState(false);

  function start() {
    setDragging(true);
  }

  function move(px: number, py: number) {
    const hit = (key: Exclude<DropTarget, null>) => {
      const r = rectOf(key);
      return !!r && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
    };
    const t: DropTarget =
      hit("clipboard") ? "clipboard" :
      hit("tray") ? "tray" :
      hit("bin") ? "bin" :
      hit("board") ? "board" : null;
    if (t !== overRef.current) {
      overRef.current = t;
      setOver(t);
    }
  }

  function end(): DropTarget {
    const t = overRef.current;
    overRef.current = null;
    setOver(null);
    setDragging(false);
    return t;
  }

  return { over, dragging, start, move, end };
}
