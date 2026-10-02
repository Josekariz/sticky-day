export default function BoardLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <p className="font-hand text-5xl font-bold text-fg-soft/50">Board</p>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="relative min-h-[60vh] flex-1 animate-pulse rounded-2xl border-4 border-frame bg-board md:min-h-[520px] md:border-[6px]" />
        <aside className="flex flex-col gap-5 lg:w-72">
          <div className="h-52 animate-pulse rounded-xl bg-clipboard/25" />
          <div className="h-32 animate-pulse rounded-xl bg-tray-front/25" />
        </aside>
      </div>
    </main>
  );
}
