"use client";

import { useRef, useState } from "react";

export type DropTarget = "clipboard" | "bin" | "board" | "tray" | null;

export function useDropTargets() {
  const rects = useRef<Partial<Record<Exclude<DropTarget, null>, DOMRect>>>({});
  const overRef = useRef<DropTarget>(null);
  const [over, setOver] = useState<DropTarget>(null);
  const [dragging, setDragging] = useState(false);

  function start() {
    const q = (k: string) => document.querySelector(`[data-drop='${k}']`)?.getBoundingClientRect();
    rects.current = { clipboard: q("clipboard"), bin: q("bin"), board: q("board"), tray: q("tray") };
    setDragging(true);
  }

  function move(px: number, py: number) {
    const hit = (r?: DOMRect) => !!r && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
    const t: DropTarget =
      hit(rects.current.clipboard) ? "clipboard" :
      hit(rects.current.tray) ? "tray" :
      hit(rects.current.bin) ? "bin" :
      hit(rects.current.board) ? "board" : null;
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
