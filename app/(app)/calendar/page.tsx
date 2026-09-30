import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold">History</h1>
      <CalendarView />
    </main>
  );
}