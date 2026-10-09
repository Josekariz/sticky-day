"use client";

import { useMemo, type ReactNode } from "react";
import type { Note, NoteShape } from "@/lib/core/types";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";
import { EXAMPLE_DAYS, type ExampleDay } from "@/lib/core/examples";
import { toBoardNotes } from "@/lib/core/split";
import { useBoard } from "./useBoard";
import { supabaseStore } from "./store";
import { guestStore } from "./guestStore";
import { ExampleDays } from "./ExampleDays";
import { useDropTargets } from "./useDropTargets";
import { BrainDump } from "./BrainDump";
import { Board } from "./Board";
import { Clipboard } from "./Clipboard";
import { DoneTray } from "./DoneTray";
import { Bin } from "./Bin";
import { PickupCard } from "./PickupCard";
import { FirstVisit } from "./FirstVisit";

export function DayView({
  account,
  initialNotes,
  capacityMinutes,
  initialSummary,
  defaultShape,
  onboarded,
  isNewAccount,
  aside,
}: {
  account: { userId: string; dayId: string } | null; // null: the guest board on the landing page
  initialNotes: Note[];
  capacityMinutes: number;
  initialSummary: StoredSummary | null;
  defaultShape: NoteShape | null;
  onboarded: boolean;
  isNewAccount: boolean;
  aside?: ReactNode; // top of the side column
}) {
  const userId = account?.userId ?? null;
  const dayId = account?.dayId ?? null;
  const guest = userId === null || dayId === null;
  const store = useMemo(
    () => (userId && dayId ? supabaseStore(userId, dayId, capacityMinutes) : guestStore()),
    [userId, dayId, capacityMinutes],
  );
  const b = useBoard(initialNotes, store, guest ? null : capacityMinutes, guest || onboarded);
  const drop = useDropTargets();

  function addExample(example: ExampleDay) {
    b.addNotes(toBoardNotes(example.result.notes, b.boardNotes, null, () => crypto.randomUUID()));
  }

  function clearBoard() {
    if (window.confirm("Clear every note on this board?")) b.clear();
  }

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
      <BrainDump onSubmit={b.addFromDump} quick={guest} />
      {guest && (
        <ExampleDays
          examples={EXAMPLE_DAYS}
          canClear={b.boardNotes.length + b.focusNotes.length + b.doneNotes.length + b.trashedNotes.length > 0}
          onPick={addExample}
          onClear={clearBoard}
        />
      )}

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
        <aside className="flex flex-col gap-5 lg:w-72">
          {aside}
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
          <div className="flex items-end gap-3">
            <DoneTray
              notes={b.doneNotes}
              armed={drop.over === "tray"}
              initialSummary={initialSummary}
              onPutBack={b.restore}
            />
            <Bin
              notes={b.trashedNotes}
              armed={drop.over === "bin"}
              onRestore={b.restore}
              onEmpty={b.emptyBin}
            />
          </div>
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
    </div>
  );
}
