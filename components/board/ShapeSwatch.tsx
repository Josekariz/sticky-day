import type { ReactNode } from "react";
import { paperVar, type NoteShape, type PaperColor } from "@/lib/core/types";

export const SHAPE_LABELS: Record<NoteShape, string> = {
  square: "Square",
  rounded: "Rounded",
  circle: "Circle",
  heart: "Heart",
  pill: "Pill",
};

/** Pill is wide and short; every other shape keeps the square footprint. */
export function shapeBox(shape: NoteShape, size: number) {
  return shape === "pill" ? { width: size * 1.5, height: size * 0.7 } : { width: size, height: size };
}

type Props = {
  shape: NoteShape;
  color: PaperColor;
  size: number;
  /** Outline only (for use on paper of the same colour); `strong` marks the current one. */
  outline?: boolean;
  strong?: boolean;
  children?: ReactNode;
};

export function ShapeSwatch({ shape, color, size, outline, strong, children }: Props) {
  const vars = {
    ...shapeBox(shape, size),
    ["--shape-clip" as string]: `var(--clip-${shape})`,
    ["--paper" as string]: paperVar(color),
  };

  if (outline) {
    return (
      <span aria-hidden className={`shape-clip relative block ${strong ? "bg-ink" : "bg-ink-soft/70"}`} style={vars}>
        <span className="shape-clip shape-paper absolute" style={{ inset: strong ? 3 : 1.5 }} />
      </span>
    );
  }

  return (
    <span aria-hidden className="shape-glow relative block" style={vars}>
      <span className="shape-clip shape-paper absolute inset-0" />
      {children && (
        <span className="absolute inset-0 grid place-items-center text-center text-ink">{children}</span>
      )}
    </span>
  );
}
