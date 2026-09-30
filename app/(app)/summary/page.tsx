import { SummaryView } from "@/components/summary/SummaryView";

export default function SummaryPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-hand text-5xl font-bold">Wednesday summary</h1>
        <p className="text-sm text-fg-soft">Written from yesterday’s bin and today’s board. Nothing to type.</p>
      </div>
      <SummaryView />
    </main>
  );
}
