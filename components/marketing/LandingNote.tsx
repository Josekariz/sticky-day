"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SignInButton } from "@/components/auth/SignInButton";
import { EmailSignIn, type EmailMode } from "@/components/auth/EmailSignIn";

export function LandingNote() {
  const [email, setEmail] = useState<EmailMode | null>(null);

  return (
    <AnimatePresence mode="wait">
      {email ? (
        <EmailSignIn key="email" mode={email} onModeChange={setEmail} onBack={() => setEmail(null)} />
      ) : (
        <motion.div
          key="landing"
          className="sticky-note relative flex w-full max-w-sm flex-col gap-5 p-8 text-ink"
          style={{ backgroundColor: "var(--paper-yellow)", ["--paper" as string]: "var(--paper-yellow)" }}
          initial={{ scale: 0.6, rotate: 8, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          exit={{ scale: 0.6, rotate: -8, opacity: 0 }}
          whileHover={{ rotate: 0, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <h1 className="relative font-hand text-6xl font-bold leading-none">Sticky Day</h1>
          <p className="relative text-lg leading-snug">
            Type what you hope to get done. It becomes sticky notes. Work a few at a time, then drop them in the Done tray.
          </p>
          <SignInButton className="relative mt-2 flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-on-ink" />
          <p className="relative flex justify-center gap-2 text-sm font-semibold">
            <button type="button" onClick={() => setEmail("signIn")} className="underline underline-offset-2">
              Sign in with email
            </button>
            <span aria-hidden className="text-ink-soft">·</span>
            <button type="button" onClick={() => setEmail("signUp")} className="underline underline-offset-2">
              Create account
            </button>
          </p>
          <p className="relative text-center text-xs text-ink-soft">
            Your email is only used to sign you in ·{" "}
            <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
