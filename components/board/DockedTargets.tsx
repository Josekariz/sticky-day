"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DropTarget } from "./useDropTargets";
import { BinShape } from "./Bin";
import { TRAY_MESH } from "./DoneTray";

type Target = Exclude<DropTarget, null | "board">;

type Props = {
  show: boolean;
  over: DropTarget;
  board: RefObject<HTMLDivElement | null>;
};

export function DockedTargets({ show, over, board }: Props) {
  const row = useRef<HTMLDivElement>(null);

  // Sit just above the board's top edge, but never off the top of the screen.
  // Runs before useDropTargets measures the slots (child layout effects run first).
  useLayoutEffect(() => {
    const el = row.current;
    const b = board.current;
    if (!show || !el || !b) return;
    el.style.top = `${Math.max(8, b.getBoundingClientRect().top - el.offsetHeight - 8)}px`;
  }, [show, board]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={row}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 z-10 mx-auto flex w-fit gap-5 rounded-2xl bg-board/80 px-3 py-2 backdrop-blur-sm lg:hidden"
        >
          <Slot target="clipboard"><MiniClipboard armed={over === "clipboard"} /></Slot>
          <Slot target="tray"><MiniTray armed={over === "tray"} /></Slot>
          <Slot target="bin"><MiniBin armed={over === "bin"} /></Slot>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// The slot stays still and carries data-drop so its rect can be measured once;
// only the drawing inside slides.
function Slot({ target, children }: { target: Target; children: React.ReactNode }) {
  return (
    <div data-drop={target} className="h-16 w-20">
      <motion.div
        className="h-full w-full"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function MiniClipboard({ armed }: { armed: boolean }) {
  return (
    <div
      className={`relative h-full w-full rounded-lg bg-clipboard p-1.5 pt-3 shadow-md transition-shadow ${
        armed ? "shadow-[0_0_0_3px_var(--paper-yellow)]" : ""
      }`}
    >
      <motion.span
        animate={{ y: armed ? -6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="absolute left-1/2 top-[-6px] h-3.5 w-10 -translate-x-1/2 rounded bg-clipboard-clip shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_3px_rgba(0,0,0,0.3)]"
      />
      <div className="flex h-full flex-col justify-center gap-1.5 rounded-sm bg-clipboard-paper px-2">
        <span className="h-px bg-clipboard-line" />
        <span className="h-px bg-clipboard-line" />
        <span className="h-px bg-clipboard-line" />
      </div>
    </div>
  );
}

function MiniTray({ armed }: { armed: boolean }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-2 top-2 h-9 rounded-t-md bg-tray-back" style={TRAY_MESH} />
      <motion.div
        animate={{ y: armed ? 6 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={`absolute inset-x-0 bottom-1 flex h-7 items-center justify-center rounded-b-md rounded-t-sm border-t-2 shadow-md transition-colors ${
          armed ? "border-paper-yellow bg-tray-front-armed" : "border-tray-line bg-tray-front"
        }`}
        style={TRAY_MESH}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-on-tray">Done</span>
      </motion.div>
    </div>
  );
}

function MiniBin({ armed }: { armed: boolean }) {
  return (
    <motion.div
      animate={armed ? { rotate: [-8, 8, -8], scale: 1.12 } : { rotate: 0, scale: 1 }}
      transition={
        armed
          ? { rotate: { repeat: Infinity, duration: 0.35, ease: "easeInOut" }, scale: { duration: 0.15 } }
          : { type: "spring", stiffness: 300, damping: 20 }
      }
      className="h-full w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]"
    >
      <BinShape />
    </motion.div>
  );
}
