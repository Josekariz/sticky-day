"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRef, useSyncExternalStore, type RefObject } from "react";
import { paperVar, type Note, type NoteShape } from "@/lib/core/types";
import { weekdayShort } from "@/lib/core/date";
import { noteSizeVars } from "@/lib/core/noteSize";
import { centreOf, type DropTarget } from "./useDropTargets";
import { TomorrowBadge } from "./TomorrowMark";

/** Real mouse hover only — touch/PWA "hover" sticky-states make notes feel laggy. */
function useFineHover() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );
}

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

// Title + priority sit as one centered stack — short notes (no detail on the
// face) used to look empty with the title up top and a lone chip at the bottom.
const BODY: Record<NoteShape, string> = {
  square: "items-center justify-center gap-1.5 p-3 text-center md:gap-2 md:p-4",
  rounded: "items-center justify-center gap-1.5 p-3.5 text-center md:gap-2 md:p-5",
  circle: "items-center justify-center gap-0.5 px-4 py-4 text-center md:gap-1 md:px-6 md:py-6",
  // Padding is % of the width (= height): the content box spans the band from
  // just under the cleft to where the sides get too narrow for the chips.
  heart: "items-center justify-center gap-0.5 px-4 pt-[17%] pb-[34%] text-center md:gap-1 md:px-6",
  pill: "items-center justify-center gap-0.5 px-6 py-1.5 text-center md:gap-1 md:px-11 md:py-2",
};
const TITLE: Record<NoteShape, string> = {
  square: "px-2 md:px-3",
  rounded: "px-2 md:px-3",
  circle: "",
  heart: "",
  pill: "",
};
const CHIPS: Record<NoteShape, string> = {
  square: "justify-center",
  rounded: "justify-center",
  circle: "justify-center",
  heart: "justify-center",
  pill: "justify-center",
};
const STAMP: Record<NoteShape, string> = {
  square: "absolute bottom-8 left-2.5 md:bottom-10 md:left-4",
  rounded: "absolute bottom-8 left-2.5 md:bottom-11 md:left-5",
  circle: "static",
  heart: "absolute bottom-[24%] left-1/2 -translate-x-1/2",
  pill: "static",
};

export function StickyNote(props: Props) {
  const { note } = props;
  const readOnly = props.readOnly === true;
  const faded = readOnly && !!props.faded;
  const fineHover = useFineHover();
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
  const queued = note.againTomorrow;
  // Carried needs the "from …" stamp; queued already has the moon chip — don't stack both.
  const stamped = carried;
  const shape = note.shape;
  const sizeVars = noteSizeVars(note.title, shape);
  // Heart + stamps leave less room for a third title line.
  const clamp = stamped || queued || shape === "heart" ? "line-clamp-2" : "line-clamp-3";

  function handleDragEnd() {
    if (readOnly) return;
    self.current?.removeAttribute("data-dragging");
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

  const stamp = stamped && (
    <span
      className={`pointer-events-none text-[9px] font-semibold tracking-wide text-ink-soft/80 md:text-[10px] ${STAMP[shape]}`}
      aria-hidden
    >
      {`from ${weekdayShort(note.carriedFrom!)}`}
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
              ...sizeVars,
            }
          : {
              left: `calc(${note.x} * (100% - var(--note-w)))`,
              top: `calc(${note.y} * (100% - var(--note-h)))`,
              x,
              y,
              rotate: note.rotation,
              ["--paper" as string]: paper,
              ...sizeVars,
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
                self.current?.setAttribute("data-dragging", "");
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
      whileHover={readOnly || !fineHover ? undefined : { scale: 1.04, rotate: 0, translateY: -4 }}
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
        <div className={`relative flex h-full w-full flex-col ${BODY[shape]}`}>
          {stamp}
          <span className={`font-hand text-(length:--note-font) font-semibold leading-tight ${clamp} ${TITLE[shape]}`}>
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
            className={`note-hit relative flex h-full w-full flex-col ${BODY[shape]}`}
          >
            {stamp}
            <span className={`font-hand text-(length:--note-font) font-semibold leading-tight ${clamp} ${TITLE[shape]}`}>
              {note.title}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold text-ink-soft md:gap-1.5 md:text-[11px] ${CHIPS[shape]}`}>
              {queued && <TomorrowBadge />}
              <span className="whitespace-nowrap px-1 py-0.5 rounded-full bg-black/10 capitalize md:px-1.5">{note.priority}<span className="sr-only"> priority</span></span>
              {queued && <span className="sr-only">on for tomorrow</span>}
            </span>
          </button>

          {/* Hover-only: touch screens never hover, so these must not take taps while invisible. */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); props.onTrash(note.id); }}
            aria-label={`Trash "${note.title}"`}
            className="absolute left-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-on-ink text-ink opacity-0 transition-opacity pointer-events-none hover:bg-on-ink/80 focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
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
            className="absolute right-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-on-ink text-ink opacity-0 transition-opacity pointer-events-none hover:bg-on-ink/80 focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
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
