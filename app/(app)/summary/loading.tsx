export default function SummaryLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[35rem] flex-col gap-10 py-2">
      <div className="flex flex-col gap-2">
        <div className="h-12 w-56 animate-pulse rounded-lg bg-frame/50 font-hand" />
        <div className="h-4 w-32 animate-pulse rounded bg-frame/40" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-full animate-pulse rounded bg-frame/35" />
        <div className="h-4 w-[92%] animate-pulse rounded bg-frame/35" />
        <div className="h-4 w-[70%] animate-pulse rounded bg-frame/35" />
      </div>
    </main>
  );
}
