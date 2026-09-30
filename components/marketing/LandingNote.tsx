"use client";

import { motion } from "framer-motion";
import { SignInButton } from "@/components/auth/SignInButton";

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
      <SignInButton className="relative mt-2 flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-on-ink" />
      <p className="relative text-center text-xs text-ink-soft">Google is only used to sign you in.</p>
    </motion.div>
  );
}