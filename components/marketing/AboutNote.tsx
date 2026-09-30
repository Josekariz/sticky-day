"use client";

import { motion } from "framer-motion";
import type { PaperColor } from "@/lib/core/types";
import { paperVar } from "@/lib/core/types";

type Props = {
  title: string;
  color: PaperColor;
  rotation: number;
  delay?: number;
  children: React.ReactNode;
};

export function AboutNote({ title, color, rotation, delay = 0, children }: Props) {
  return (
    <motion.article
      className="sticky-note relative flex flex-col gap-3 p-6 text-ink"
      style={{ backgroundColor: paperVar(color), ["--paper" as string]: paperVar(color) }}
      initial={{ scale: 0.6, rotate: rotation + 10, opacity: 0 }}
      animate={{ scale: 1, rotate: rotation, opacity: 1 }}
      whileHover={{ rotate: 0, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
      <h2 className="relative font-hand text-4xl font-bold leading-none">{title}</h2>
      <div className="relative flex flex-col gap-2 text-[15px] leading-snug">{children}</div>
    </motion.article>
  );
}
