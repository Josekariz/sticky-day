"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatSummaryTime } from "@/lib/core/date";
import { ShapePicker, type ShapeChoice } from "@/components/board/ShapePicker";
import { AppearanceSelect } from "@/components/theme/AppearanceSelect";

type Props = {
  userId: string;
  displayName: string;
  summaryTime: string;
  defaultShape: ShapeChoice;
};

export function ProfileForm({
  userId,
  displayName,
  summaryTime,
  defaultShape,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [time, setTime] = useState(formatSummaryTime(summaryTime));
  const [shape, setShape] = useState<ShapeChoice>(defaultShape);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage("Check the name.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setMessage("Pick a summary time.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await createClient()
      .from("profiles")
      .update({
        display_name: name.trim(),
        summary_time: time,
        default_shape: shape,
        // Choosing a shape here answers the board's first-visit card too.
        ...(shape !== defaultShape && { onboarded_at: new Date().toISOString() }),
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Display name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Daily summary time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-11 w-36 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
        />
        <span className="text-xs text-fg-soft">
          After this time (in your timezone), today’s summary writes itself.
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Appearance</span>
        <AppearanceSelect tone="full" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Shape for new notes</span>
        <ShapePicker value={shape} onChange={setShape} tone="page" label="Shape for new notes" />
        <span className="text-xs text-fg-soft">
          Only affects new notes. The ones already on your board keep their shape.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl bg-fg px-5 text-sm font-bold text-bg disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-sm text-fg-soft">{message}</span>}
      </div>
    </form>
  );
}
