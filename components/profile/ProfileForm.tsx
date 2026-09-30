"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  displayName: string;
  capacityMinutes: number;
};

export function ProfileForm({ userId, displayName, capacityMinutes }: Props) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [hours, setHours] = useState(String(capacityMinutes / 60));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    if (!name.trim() || !Number.isFinite(h) || h < 1 || h > 16) {
      setMessage("Check the name and hours (1–16).");
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await createClient()
      .from("profiles")
      .upsert({
        id: userId,
        display_name: name.trim(),
        capacity_minutes: Math.round(h * 60),
      });
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
        <span className="text-sm font-semibold">Hours available per day</span>
        <input
          type="number"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          min={1}
          max={16}
          step={0.5}
          className="h-11 w-28 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
        />
        <span className="text-xs text-fg-soft">Used when a brain dump looks overbooked for the day.</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 self-start rounded-xl bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-sm text-fg-soft">{message}</span>}
      </div>
    </form>
  );
}
