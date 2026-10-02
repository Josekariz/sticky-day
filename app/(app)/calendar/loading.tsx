export default function CalendarLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold text-fg-soft/50">Calendar</h1>
      <div className="mx-auto w-full max-w-[35rem] animate-pulse rounded-2xl border border-frame bg-surface p-5">
        <div className="mb-4 h-8 w-48 rounded-lg bg-frame/60" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-16 rounded-lg border border-frame bg-bg/60" />
          ))}
        </div>
      </div>
    </main>
  );
}
