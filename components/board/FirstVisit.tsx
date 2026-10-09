"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { NoteShape, PaperColor } from "@/lib/core/types";
import { ShapeSwatch } from "./ShapeSwatch";
import { ShapePicker, type ShapeChoice } from "./ShapePicker";

type Props = {
  /** New accounts get the how-it-works step first; everyone else gets a one-line intro. */
  isNewAccount: boolean;
  /** The shape new notes already get; null = a random mix. */
  defaultShape: ShapeChoice;
  /** Saves the choice; rejects if it couldn't be saved. */
  onFinish: (choice: ShapeChoice) => Promise<void>;
  /** Dismisses the card without changing the shape; rejects if it couldn't be saved. */
  onSkip: () => Promise<void>;
};

const HOW_IT_WORKS = [
  "Type your day into the box above. Messy is fine.",
  "Each thing you mention becomes a sticky note on this board.",
  "Drag a note to the clipboard to start it, and into the tray when it’s done.",
];

const MINI_NOTES: { title: string; color: PaperColor; mix: NoteShape }[] = [
  { title: "Call mum", color: "yellow", mix: "square" },
  { title: "Gym", color: "mint", mix: "heart" },
  { title: "Draft report", color: "peach", mix: "circle" },
];

export function FirstVisit({ isNewAccount, defaultShape, onFinish, onSkip }: Props) {
  const [step, setStep] = useState<"how" | "paper">(isNewAccount ? "how" : "paper");
  const [choice, setChoice] = useState<ShapeChoice>(defaultShape);
  const [hovered, setHovered] = useState<ShapeChoice | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = hovered === undefined ? choice : hovered;

  async function answer(write: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await write();
    } catch {
      setError("Couldn’t save that. Try again?");
      setSaving(false);
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-labelledby="first-visit-title"
      className="sticky-note relative flex w-full max-w-lg flex-col gap-4 p-5 text-ink md:gap-5 md:p-9 md:pb-7"
      style={{ backgroundColor: "var(--paper-yellow)", ["--paper" as string]: "var(--paper-yellow)" }}
      initial={{ scale: 0.6, rotate: 6, opacity: 0 }}
      animate={{ scale: 1, rotate: -1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      {step === "how" ? (
        <>
          <h2 id="first-visit-title" className="relative font-hand text-4xl font-bold leading-none md:text-5xl">
            Here’s how it works
          </h2>
          <ol className="relative flex flex-col gap-2 text-[15px] leading-snug md:gap-2.5 md:text-[17px]">
            {HOW_IT_WORKS.map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="font-hand text-2xl font-bold leading-none">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
          <div className="relative mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep("paper")}
              className="h-12 flex-1 rounded-xl bg-ink text-sm font-bold text-on-ink"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => answer(onSkip)}
              disabled={saving}
              className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-40"
            >
              Skip
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative flex flex-col gap-1.5">
            {!isNewAccount && (
              <p className="text-sm font-semibold text-ink-soft">New: your notes can have a shape now.</p>
            )}
            <h2 id="first-visit-title" className="font-hand text-4xl font-bold leading-none md:text-5xl">
              Pick your paper
            </h2>
            <p className="text-sm leading-snug md:text-[15px]">
              New notes come out in this shape. You can still change any single note later.
            </p>
          </div>

          <div className="relative hidden h-20 items-center justify-center gap-4 sm:flex" aria-hidden>
            {MINI_NOTES.map((m, i) => {
              const shape = shown ?? m.mix;
              return (
                <motion.span
                  key={`${m.title}-${shape}`}
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1, rotate: [-3, 2, -1][i] }}
                  transition={{ type: "spring", stiffness: 420, damping: 20 }}
                >
                  <ShapeSwatch shape={shape} color={m.color} size={64}>
                    <span className="max-w-12 font-hand text-sm font-semibold leading-none">{m.title}</span>
                  </ShapeSwatch>
                </motion.span>
              );
            })}
          </div>

          <div className="relative">
            <ShapePicker
              value={choice}
              onChange={setChoice}
              onHover={setHovered}
              tone="paper"
              label="Shape for your notes"
            />
          </div>

          <div className="relative flex items-center gap-4">
            <button
              type="button"
              onClick={() => answer(() => onFinish(choice))}
              disabled={saving}
              className="h-12 flex-1 rounded-xl bg-ink text-sm font-bold text-on-ink disabled:opacity-60"
            >
              {saving ? "Saving…" : "Start my day"}
            </button>
            <button
              type="button"
              onClick={() => answer(onSkip)}
              disabled={saving}
              className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-40"
            >
              Skip
            </button>
          </div>
          {error && <p className="relative -mt-2 text-sm font-semibold text-danger">{error}</p>}
        </>
      )}
    </motion.div>
  );
}
