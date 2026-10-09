"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";
import { paperVar, type Note, type NoteShape } from "@/lib/core/types";
import { weekdayShort } from "@/lib/core/date";
import { centreOf, type DropTarget } from "./useDropTargets";

type InteractiveProps = {
  readOnly?: false;
  board: RefObject<HTMLDivElement | null>;
  over: DropTarget;
  onMove: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number, pointer?: [number, number]) => void;
  onDragEnd: (id: string) => boolean;
};

type ReadOnlyProps = {
  readOnly: true;
  /** Soften colour and show a tick — used for finished notes on Your day. */
  faded?: boolean;
};

type Props = { note: Note } & (InteractiveProps | ReadOnlyProps);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Framer starts a drag after 3 px, but a real mouse press wobbles more than
// that; only count it as a drag (and swallow the click) past this distance.
const DRAG_PX = 8;

// Text box per shape from md up (below md every note is a square). Sized so a
// three-line title and the chips stay inside the outline.
const BODY: Record<NoteShape, string> = {
  square: "md:p-4 md:pb-3",
  rounded: "md:p-5 md:pb-5",
  circle: "md:items-center md:justify-center md:gap-1 md:px-6 md:py-6 md:text-center",
  // Padding is % of the width (= height): the content box spans the band from
  // just under the cleft to where the sides get too narrow for the chips.
  heart: "md:items-center md:justify-center md:gap-1 md:px-6 md:pt-[17%] md:pb-[34%] md:text-center",
  pill: "md:items-center md:justify-center md:gap-1 md:px-11 md:py-2 md:text-center",
};
const TITLE: Record<NoteShape, string> = {
  square: "md:px-6",
  rounded: "md:px-6",
  circle: "",
  heart: "",
  pill: "",
};
const CHIPS: Record<NoteShape, string> = {
  square: "md:pr-8",
  rounded: "md:pr-0",
  circle: "md:mt-0 md:pr-0 md:justify-center",
  heart: "md:mt-0 md:pr-0 md:justify-center",
  pill: "md:mt-0 md:pr-0 md:justify-center",
};
const STAMP: Record<NoteShape, string> = {
  square: "absolute bottom-9 left-3 md:bottom-10 md:left-4",
  rounded: "absolute bottom-9 left-3 md:bottom-11 md:left-5",
  circle: "absolute bottom-9 left-3 md:static",
  heart: "absolute bottom-9 left-3 md:bottom-[24%] md:left-1/2 md:-translate-x-1/2",
  pill: "absolute bottom-9 left-3 md:static",
};

export function StickyNote(props: Props) {
  const { note } = props;
  const readOnly = props.readOnly === true;
  const faded = readOnly && !!props.faded;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const paper = paperVar(note.color);
  const over = !readOnly ? props.over : null;
  const overTarget = over === "clipboard" || over === "tray" || over === "bin";
  // A drag ends with pointerup on the note, which the browser turns into a click.
  // Remember that this gesture was a drag so the click doesn't open the note.
  const dragged = useRef(false);
  // Separate from `dragged`: that click runs before Framer's onDragEnd and clears it.
  const boardSawDrag = useRef(false);
  const self = useRef<HTMLDivElement>(null);
  const carried = !!note.carriedFrom;
  const shape = note.shape;
  // Below md the "from <day>" stamp sits where a third title line would go.
  const clamp = `${carried ? "line-clamp-2" : "line-clamp-3"} ${shape === "heart" ? "md:line-clamp-2" : "md:line-clamp-3"}`;

  function handleDragEnd() {
    if (readOnly) return;
    const dx = x.get();
    const dy = y.get();
    x.set(0);
    y.set(0);
    if (!boardSawDrag.current) return; // never got past DRAG_PX
    boardSawDrag.current = false;
    if (props.onDragEnd(note.id)) return; // it left the board; don't save a position
    if (Math.hypot(dx, dy) <= DRAG_PX) return; // a wobbly click; the reset above puts it back
    const el = props.board.current;
    const me = self.current;
    if (!el || !me) return;
    props.onMove(
      note.id,
      clamp01(note.x + dx / (el.clientWidth - me.offsetWidth)),
      clamp01(note.y + dy / (el.clientHeight - me.offsetHeight)),
    );
  }

  const stamp = carried && (
    <span
      className={`pointer-events-none text-[9px] font-semibold tracking-wide text-ink-soft/80 md:text-[10px] ${STAMP[shape]}`}
      aria-hidden
    >
      from {weekdayShort(note.carriedFrom!)}
    </span>
  );

  return (
    <motion.div
      ref={self}
      data-shape={shape}
      data-muted={faded || carried || undefined}
      drag={!readOnly}
      dragMomentum={false}
      style={
        readOnly
          ? {
              rotate: note.rotation,
              ["--paper" as string]: paper,
              opacity: faded ? 0.72 : 1,
            }
          : {
              left: `calc(${note.x} * (100% - var(--note-w)))`,
              top: `calc(${note.y} * (100% - var(--note-h)))`,
              x,
              y,
              rotate: note.rotation,
              ["--paper" as string]: paper,
            }
      }
      onPointerDown={
        readOnly
          ? undefined
          : () => {
              dragged.current = false;
            }
      }
      onDrag={
        readOnly
          ? undefined
          : (_e, info) => {
              if (!dragged.current) {
                if (Math.hypot(x.get(), y.get()) <= DRAG_PX) return;
                dragged.current = true;
                boardSawDrag.current = true;
                props.onDragStart();
              }
              if (self.current) {
                props.onDragMove(...centreOf(self.current), [
                  info.point.x - window.scrollX,
                  info.point.y - window.scrollY,
                ]);
              }
            }
      }
      onDragEnd={readOnly ? undefined : handleDragEnd}
      initial={{ scale: 0.6, rotate: note.rotation + 12, opacity: 0 }}
      animate={{ scale: 1, rotate: note.rotation, opacity: faded ? 0.72 : 1 }}
      exit={{ scale: 0.15, rotate: note.rotation + 40, opacity: 0, transition: { duration: 0.35 } }}
      whileHover={readOnly ? undefined : { scale: 1.04, rotate: 0, translateY: -4 }}
      whileDrag={readOnly ? undefined : { scale: overTarget ? 0.5 : 1.05, rotate: overTarget ? -12 : 0, zIndex: 50 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={
        readOnly
          ? "note-root relative h-(--note-h) w-(--note-w) shrink-0 select-none text-ink"
          : "note-root group absolute h-(--note-h) w-(--note-w) touch-none select-none text-ink cursor-grab active:cursor-grabbing"
      }
    >
      <div className="note-glow pointer-events-none absolute inset-0" aria-hidden>
        <div className="sticky-note note-paper absolute inset-0" style={{ backgroundColor: paper }} />
      </div>

      {readOnly ? (
        <div className={`relative flex h-full w-full flex-col p-3 text-left ${BODY[shape]}`}>
          {stamp}
          <span className={`font-hand text-(length:--note-font) font-semibold leading-tight ${clamp}`}>
            {note.title}
          </span>
          {faded && (
            <span
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/15"
              aria-hidden
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              props.onOpen(note.id);
            }}
            className={`relative flex h-full w-full flex-col p-3 text-left ${BODY[shape]}`}
          >
            {stamp}
            <span className={`font-hand text-(length:--note-font) font-semibold leading-tight ${clamp} ${TITLE[shape]}`}>
              {note.title}
            </span>
            <span className={`mt-auto flex items-center gap-1 pr-5 text-[10px] font-semibold text-ink-soft md:gap-1.5 md:text-[11px] ${CHIPS[shape]}`}>
              <span className="whitespace-nowrap px-1 py-0.5 rounded-full bg-black/10 tabular-nums md:px-1.5">{note.estMinutes} min</span>
              <span className="whitespace-nowrap px-1 py-0.5 rounded-full bg-black/10 capitalize md:px-1.5">{note.priority}<span className="sr-only"> priority</span></span>
            </span>
          </button>

          {/* Hover-only: touch screens never hover, so these must not take taps while invisible. */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); props.onTrash(note.id); }}
            aria-label={`Trash "${note.title}"`}
            className="absolute left-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity pointer-events-none hover:bg-black/30 focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              props.onDone(note.id);
            }}
            aria-label={`Mark "${note.title}" done`}
            className="absolute right-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity pointer-events-none hover:bg-black/30 focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );
}
