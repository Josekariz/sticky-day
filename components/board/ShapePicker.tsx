import { NOTE_SHAPES, type NoteShape, type PaperColor } from "@/lib/core/types";
import { SHAPE_LABELS, ShapeSwatch } from "./ShapeSwatch";

/** A note's default shape choice: one of the five, or null for a random mix. */
export type ShapeChoice = NoteShape | null;

const SWATCH_COLOR: Record<NoteShape, PaperColor> = {
  square: "pink",
  rounded: "sky",
  circle: "lime",
  heart: "coral",
  pill: "lavender",
};

const OPTIONS: ShapeChoice[] = [null, ...NOTE_SHAPES];

type Props = {
  value: ShapeChoice;
  onChange: (choice: ShapeChoice) => void;
  /** Hovered option, or undefined when the pointer leaves. */
  onHover?: (choice: ShapeChoice | undefined) => void;
  /** "paper" sits on a sticky note (ink text); "page" sits on the app surface. */
  tone: "paper" | "page";
  label: string;
};

function RandomSwatch() {
  return (
    <span aria-hidden className="relative block h-9 w-12">
      <span className="absolute left-0 top-1 -rotate-6"><ShapeSwatch shape="square" color="yellow" size={20} /></span>
      <span className="absolute left-3.5 top-3 rotate-3"><ShapeSwatch shape="heart" color="pink" size={20} /></span>
      <span className="absolute right-0 top-0"><ShapeSwatch shape="circle" color="teal" size={20} /></span>
    </span>
  );
}

export function ShapePicker({ value, onChange, onHover, tone, label }: Props) {
  const text = tone === "paper" ? "text-ink" : "text-fg";
  const soft = tone === "paper" ? "text-ink-soft" : "text-fg-soft";
  const picked = tone === "paper" ? "bg-black/10 ring-2 ring-ink" : "bg-bg ring-2 ring-fg";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-3 gap-1.5 sm:grid-cols-6"
      onPointerLeave={() => onHover?.(undefined)}
    >
      {OPTIONS.map((choice) => {
        const selected = choice === value;
        const name = choice ? SHAPE_LABELS[choice] : "Random";
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice)}
            onPointerEnter={() => onHover?.(choice)}
            onFocus={() => onHover?.(choice)}
            onBlur={() => onHover?.(undefined)}
            className={`flex flex-col items-center gap-1.5 rounded-xl px-1 pb-1.5 pt-2.5 outline-none focus-visible:ring-2 ${
              selected ? picked : "hover:bg-black/5 focus-visible:ring-current"
            }`}
          >
            <span className="grid h-10 place-items-center">
              {choice ? <ShapeSwatch shape={choice} color={SWATCH_COLOR[choice]} size={32} /> : <RandomSwatch />}
            </span>
            <span className={`text-xs font-semibold ${selected ? text : soft}`}>{name}</span>
          </button>
        );
      })}
    </div>
  );
}
