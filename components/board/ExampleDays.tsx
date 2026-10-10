"use client";

import { useState } from "react";
import type { ExampleDay } from "@/lib/core/examples";

export function ExampleDays({
  examples,
  canClear,
  onPick,
  onClear,
}: {
  examples: ExampleDay[];
  canClear: boolean;
  onPick: (example: ExampleDay) => void;
  onClear: () => void;
}) {
  const [picked, setPicked] = useState<ExampleDay | null>(null);

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-fg-soft">Or try an example:</span>
        {examples.map((e) => (
          <button
            key={e.label}
            type="button"
            onClick={() => {
              setPicked(e);
              onPick(e);
            }}
            className="h-9 rounded-full border border-frame bg-surface px-3 text-sm font-semibold hover:bg-bg"
          >
            {e.label}
          </button>
        ))}
        {canClear && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto h-9 px-2 text-sm text-fg-soft underline-offset-4 hover:text-fg hover:underline"
          >
            Clear board
          </button>
        )}
      </div>
      {picked && (
        <p className="text-xs text-fg-soft">
          What the AI made of: <span className="italic">“{picked.dump}”</span>
        </p>
      )}
    </div>
  );
}
