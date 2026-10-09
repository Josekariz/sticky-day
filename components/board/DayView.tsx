"use client";

import type { Note, NoteShape } from "@/lib/core/types";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";
import { useBoard } from "./useBoard";
import { useDropTargets } from "./useDropTargets";
import { BrainDump } from "./BrainDump";
import { Board } from "./Board";
import { Clipboard } from "./Clipboard";
import { DoneTray } from "./DoneTray";
import { Bin } from "./Bin";
import { PickupCard } from "./PickupCard";
import { FirstVisit } from "./FirstVisit";

export function DayView({
  dayId,
  userId,
  initialNotes,
  capacityMinutes,
  initialSummary,
  defaultShape,
  onboarded,
  isNewAccount,
}: {
  dayId: string;
  userId: string;
  initialNotes: Note[];
  capacityMinutes: number;
  initialSummary: StoredSummary | null;
  defaultShape: NoteShape | null;
  onboarded: boolean;
  isNewAccount: boolean;
}) {
  const b = useBoard(initialNotes, dayId, userId, capacityMinutes, defaultShape, onboarded);
  const drop = useDropTargets();

  function dropFromBoard(id: string): boolean {
    const t = drop.end();
    if (t === "clipboard") b.workOn(id);
    else if (t === "tray") b.done(id);
    else if (t === "bin") b.trash(id);
    return t === "clipboard" || t === "tray" || t === "bin";
  }

  function dropFromClipboard(id: string) {
    const t = drop.end();
    if (t === "tray") b.done(id);
    else if (t === "bin") b.trash(id);
    else if (t === "board") b.putBack(id);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BrainDump onSubmit={b.addFromDump} />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="relative flex flex-1 flex-col">
          <Board
            notes={b.boardNotes}
            dragging={drop.dragging}
            over={drop.over}
            onMove={b.move}
            onOpen={b.open}
            onDone={b.done}
            onTrash={b.trash}
            onDragStart={drop.start}
            onDragMove={drop.move}
            onDragEnd={dropFromBoard}
          />
          {!b.onboarded && (
            <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto p-3 md:items-center md:overflow-visible md:p-6">
              <FirstVisit
                isNewAccount={isNewAccount}
                defaultShape={defaultShape}
                onFinish={b.finishOnboarding}
                onSkip={b.skipOnboarding}
              />
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-5 pb-24 md:pb-0 lg:w-72">
          <Clipboard
            notes={b.focusNotes}
            armed={drop.over === "clipboard"}
            onDone={b.done}
            onPutBack={b.putBack}
            onResume={b.resume}
            onDragStart={drop.start}
            onDragMove={drop.move}
            onDragEnd={dropFromClipboard}
          />
          <DoneTray
            notes={b.doneNotes}
            armed={drop.over === "tray"}
            initialSummary={initialSummary}
            onPutBack={b.restore}
          />
        </aside>
      </div>

      <PickupCard
        note={b.openNote}
        onClose={b.close}
        onWorkOn={b.workOn}
        onDone={b.done}
        onTrash={b.trash}
        onEdit={b.edit}
      />
      <Bin
        notes={b.trashedNotes}
        armed={drop.over === "bin"}
        onRestore={b.restore}
        onEmpty={b.emptyBin}
      />
    </div>
  );
}
