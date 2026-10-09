"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type DropTarget = "clipboard" | "bin" | "board" | "tray" | null;

type Rects = Partial<Record<Exclude<DropTarget, null>, DOMRect>>;

// The first element for a target that is actually on screen. On phones the docked
// targets live inside the board, so they come before the clipboard, tray and bin
// in the DOM and win; from md up they are display:none and measure 0 wide.
function rectOf(key: Exclude<DropTarget, null>): DOMRect | undefined {
  for (const el of document.querySelectorAll(`[data-drop='${key}']`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0) return r;
  }
  return undefined;
}

function measureAll(): Rects {
  return { clipboard: rectOf("clipboard"), tray: rectOf("tray"), bin: rectOf("bin"), board: rectOf("board") };
}

/** Centre of an element in viewport coordinates; drops hit-test by this, not the pointer. */
export function centreOf(el: Element): [number, number] {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

export function useDropTargets() {
  const rects = useRef<Rects>({});
  const overRef = useRef<DropTarget>(null);
  const [over, setOver] = useState<DropTarget>(null);
  const [dragging, setDragging] = useState(false);

  // Measure again once the docked targets have mounted, and whenever the window resizes.
  useLayoutEffect(() => {
    if (!dragging) return;
    const measure = () => {
      rects.current = measureAll();
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [dragging]);

  function start() {
    rects.current = measureAll();
    setDragging(true);
  }

  /** Points are viewport coordinates: the note's centre, and the pointer when known. */
  function move(px: number, py: number, pointer?: [number, number]) {
    const points = pointer ? [[px, py], pointer] : [[px, py]];
    const hit = (r?: DOMRect) =>
      !!r && points.some(([x, y]) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
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
