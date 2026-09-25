"use client";

import type { Note } from "@/lib/core/types";
import { useBoard } from "./useBoard";
import { BrainDump } from "./BrainDump";
import { Board } from "./Board";
import { Clipboard } from "./Clipboard";
import { Bin } from "./Bin";
import { PickupCard } from "./PickupCard";

export function DayView({ initialNotes }: { initialNotes: Note[] }) {
  const b = useBoard(initialNotes);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BrainDump onSubmit={b.addFromDump} />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <Board notes={b.boardNotes} onMove={b.move} onOpen={b.open} onDone={b.done} />
        <aside className="flex flex-col gap-5 lg:w-72">
          <Clipboard note={b.focusNote} onDone={b.done} onPutBack={b.putBack} />
        </aside>
      </div>

      <PickupCard
        note={b.openNote}
        onClose={b.close}
        onWorkOn={b.workOn}
        onDone={b.done}
        onTearUp={b.tearUp}
      />
      <Bin notes={b.doneNotes} />
    </div>
  );
}
