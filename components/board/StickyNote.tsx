"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";
import { paperVar, type Note } from "@/lib/core/types";
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
  onDragMove: (px: number, py: number) => void;
  onDragEnd: (id: string) => boolean;
};

type ReadOnlyProps = {
  readOnly: true;
  /** Soften colour and show a tick — used for finished notes on Your day. */
  faded?: boolean;
};

type Props = { note: Note } & (InteractiveProps | ReadOnlyProps);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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
  const self = useRef<HTMLDivElement>(null);
  const carried = !!note.carriedFrom;

  function handleDragEnd() {
    if (readOnly) return;
    const dx = x.get();
    const dy = y.get();
    x.set(0);
    y.set(0);
    if (props.onDragEnd(note.id)) return; // it left the board; don't save a position
    const el = props.board.current;
    const me = self.current;
    if (!el || !me) return;
    props.onMove(
      note.id,
      clamp01(note.x + dx / (el.clientWidth - me.offsetWidth)),
      clamp01(note.y + dy / (el.clientHeight - me.offsetHeight)),
    );
  }

  return (
    <motion.div
      ref={self}
      drag={!readOnly}
      dragMomentum={false}
      style={
        readOnly
          ? {
              rotate: note.rotation,
              backgroundColor: paper,
              ["--paper" as string]: paper,
              filter: faded || carried ? "saturate(0.55)" : undefined,
              opacity: faded ? 0.72 : 1,
            }
          : {
              left: `calc(${note.x} * (100% - var(--note-size)))`,
              top: `calc(${note.y} * (100% - var(--note-size)))`,
              x,
              y,
              rotate: note.rotation,
              backgroundColor: paper,
              ["--paper" as string]: paper,
              filter: carried ? "saturate(0.55)" : undefined,
            }
      }
      onPointerDown={
        readOnly
          ? undefined
          : () => {
              dragged.current = false;
            }
      }
      onDragStart={
        readOnly
          ? undefined
          : () => {
              dragged.current = true;
              props.onDragStart();
            }
      }
      onDrag={
        readOnly
          ? undefined
          : () => {
              if (self.current) props.onDragMove(...centreOf(self.current));
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
          ? "sticky-note relative size-(--note-size) shrink-0 select-none text-ink"
          : "sticky-note group absolute size-(--note-size) touch-none select-none text-ink cursor-grab active:cursor-grabbing"
      }
    >
      {readOnly ? (
        <div className="relative flex h-full w-full flex-col p-3 text-left md:p-4 md:pb-3">
          {carried && (
            <span
              className="pointer-events-none absolute bottom-9 left-3 text-[9px] font-semibold tracking-wide text-ink-soft/80 md:bottom-10 md:left-4 md:text-[10px]"
              aria-hidden
            >
              from {weekdayShort(note.carriedFrom!)}
            </span>
          )}
          <span className="font-hand text-(length:--note-font) font-semibold leading-tight line-clamp-3">
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
            className="relative flex h-full w-full flex-col p-3 text-left md:p-4 md:pb-3"
          >
            {carried && (
              <span
                className="pointer-events-none absolute bottom-9 left-3 text-[9px] font-semibold tracking-wide text-ink-soft/80 md:bottom-10 md:left-4 md:text-[10px]"
                aria-hidden
              >
                from {weekdayShort(note.carriedFrom!)}
              </span>
            )}
            <span className="font-hand text-(length:--note-font) font-semibold leading-tight line-clamp-3 md:px-7">{note.title}</span>
            <span className="mt-auto flex items-center gap-1 pr-5 text-[10px] font-semibold text-ink-soft md:gap-1.5 md:pr-8 md:text-[11px]">
              <span className="whitespace-nowrap px-1 py-0.5 rounded-full bg-black/10 tabular-nums md:px-1.5">{note.estMinutes} min</span>
              <span className="whitespace-nowrap px-1 py-0.5 rounded-full bg-black/10 capitalize md:px-1.5">{note.energy}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); props.onTrash(note.id); }}
            aria-label={`Trash "${note.title}"`}
            className="absolute left-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity hover:bg-black/30 focus-visible:opacity-100 group-hover:opacity-100"
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
            className="absolute right-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity hover:bg-black/30 focus-visible:opacity-100 group-hover:opacity-100"
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
