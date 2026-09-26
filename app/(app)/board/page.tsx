import { DayView } from "@/components/board/DayView";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { Note } from "@/lib/core/types";

const FAKE: Note[] = [
  { id: "1", title: "Reply to client email", detail: "", estMinutes: 15, actualMinutes: null, energy: "low", status: "board", color: "yellow", x: 0.05, y: 0.06, rotation: -3, startedAt: null },
  { id: "2", title: "Finish XML markup for Act 12", detail: "", estMinutes: 90, actualMinutes: null, energy: "high", status: "board", color: "sky", x: 0.3, y: 0.1, rotation: 4, startedAt: null },
  { id: "3", title: "Review PR #42", detail: "", estMinutes: 30, actualMinutes: null, energy: "medium", status: "board", color: "pink", x: 0.6, y: 0.04, rotation: -1, startedAt: null },
  { id: "4", title: "Gym", detail: "", estMinutes: 60, actualMinutes: null, energy: "high", status: "board", color: "peach", x: 0.15, y: 0.55, rotation: 2, startedAt: null },
  { id: "5", title: "Book dentist", detail: "", estMinutes: 10, actualMinutes: null, energy: "low", status: "board", color: "mint", x: 0.5, y: 0.6, rotation: -4, startedAt: null },
];

export default function Page() {
  return (
    <main className="flex-1 p-4 md:p-8 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-hand text-4xl font-bold">Sticky Day</h1>
        <ThemeToggle />
      </header>
      <DayView initialNotes={FAKE} />
    </main>
  );
}
