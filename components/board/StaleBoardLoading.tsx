"use client";

import { useEffect, useState } from "react";
import { paperVar } from "@/lib/core/types";
import { readBoardSnap, type BoardSnap } from "@/components/board/boardCache";

function localYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Skeleton, or anonymous sticky silhouettes after mount (avoids hydration + title leaks). */
export function StaleBoardLoading() {
  const [snap, setSnap] = useState<BoardSnap | null>(null);

  useEffect(() => {
    const s = readBoardSnap();
    if (s && s.date === localYmd()) setSnap(s);
  }, []);

  const board = snap?.notes.filter((n) => n.status === "board") ?? [];
  const focus = snap?.notes.filter((n) => n.status === "focus") ?? [];
  const hasStale = board.length + focus.length > 0;

  return (
    <main className="flex flex-1 flex-col gap-4" aria-busy="true" aria-label="Loading board">
      <div className="h-14 animate-pulse rounded-xl bg-frame/40 md:h-16" />
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-2xl border-4 border-frame bg-board md:min-h-[520px] md:border-[6px]">
          {hasStale ? (
            board.map((n) => (
              <div
                key={n.id}
                className="sticky-note absolute w-[42%] max-w-40 p-3 opacity-70 md:w-36"
                style={{
                  left: `${n.x * 100}%`,
                  top: `${n.y * 100}%`,
                  backgroundColor: paperVar(n.color),
                  ["--paper" as string]: paperVar(n.color),
                  rotate: `${n.rotation}deg`,
                }}
                aria-hidden
              >
                <span className="block h-3 w-3/4 rounded-sm bg-ink/15" />
                <span className="mt-2 block h-3 w-1/2 rounded-sm bg-ink/10" />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 animate-pulse bg-board" />
          )}
        </div>
        <aside className="mx-auto flex w-full max-w-sm flex-col gap-5 lg:mx-0 lg:w-72 lg:max-w-none">
          {focus.length > 0 ? (
            <div className="relative overflow-hidden rounded-xl bg-clipboard p-4 pt-8 opacity-70 shadow-lg" aria-hidden>
              <span
                className="absolute left-1/2 top-[-12px] h-7 w-28 -translate-x-1/2 rounded-lg bg-clipboard-clip"
              />
              <div className="flex flex-col gap-3 rounded bg-clipboard-paper p-4">
                {focus.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-md p-3"
                    style={{ backgroundColor: paperVar(n.color) }}
                  >
                    <span className="block h-3 w-2/3 rounded-sm bg-ink/15" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden h-52 animate-pulse rounded-xl bg-clipboard/25 lg:block" />
          )}
          <div className="h-32 animate-pulse rounded-xl bg-tray-front/25" />
        </aside>
      </div>
    </main>
  );
}
