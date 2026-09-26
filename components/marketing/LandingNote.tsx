"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingNote() {
  return (
    <motion.div
      className="sticky-note relative flex w-full max-w-sm flex-col gap-5 p-8 text-ink"
      style={{ backgroundColor: "var(--paper-yellow)", ["--paper" as string]: "var(--paper-yellow)" }}
      initial={{ scale: 0.6, rotate: 8, opacity: 0 }}
      animate={{ scale: 1, rotate: -2, opacity: 1 }}
      whileHover={{ rotate: 0, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <h1 className="relative font-hand text-6xl font-bold leading-none">Sticky Day</h1>
      <p className="relative text-lg leading-snug">
        Type what you hope to get done. It becomes sticky notes. Work one at a time, then throw them in the bin.
      </p>
      <Link
        href="/board"
        className="relative mt-2 flex h-12 items-center justify-center rounded-xl bg-[#1F1D1A] text-sm font-semibold text-[#FBFAF6]"
      >
        Continue with Google
      </Link>
      <p className="relative text-center text-xs text-ink-soft">Google is only used to sign you in.</p>
    </motion.div>
  );
}
