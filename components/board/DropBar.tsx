"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { DropTarget } from "./useDropTargets";

const ZONES: { key: Exclude<DropTarget, null | "board">; label: string }[] = [
  { key: "clipboard", label: "Work on it" },
  { key: "tray", label: "Done" },
  { key: "bin", label: "Trash" },
];

export function DropBar({ show, over }: { show: boolean; over: DropTarget }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-2 top-2 z-50 grid grid-cols-3 gap-2 md:hidden"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {ZONES.map((z) => (
            <div
              key={z.key}
              data-drop={z.key}
              className={`grid h-20 place-items-center rounded-2xl border-2 text-sm font-bold transition-colors ${
                over === z.key ? "border-fg bg-fg text-bg" : "border-frame bg-surface text-fg"
              }`}
            >
              {z.label}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
