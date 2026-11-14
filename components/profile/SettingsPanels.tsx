"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatSummaryTime } from "@/lib/core/date";
import { ShapePicker, type ShapeChoice } from "@/components/board/ShapePicker";
import { AppearanceChoices } from "@/components/theme/AppearanceChoices";
import { EditableCard } from "@/components/profile/EditableCard";

type Props = {
  userId: string;
  summaryTime: string;
  defaultShape: ShapeChoice;
};

/** Fixed formatting — avoid toLocaleTimeString (server/client ICU can disagree). */
function timeLabel(hhmm: string) {
  const [hs, ms] = hhmm.split(":");
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Look + Notes stay visible; Your day uses pencil → save when dirty. */
export function SettingsPanels({ userId, summaryTime, defaultShape }: Props) {
  const router = useRouter();
  const savedTime = formatSummaryTime(summaryTime);

  const [timeEditing, setTimeEditing] = useState(false);
  const [time, setTime] = useState(savedTime);
  const [timeBusy, setTimeBusy] = useState(false);
  const [timeMsg, setTimeMsg] = useState<string | null>(null);

  const [shape, setShape] = useState<ShapeChoice>(defaultShape);
  const [shapeBusy, setShapeBusy] = useState(false);
  const [shapeMsg, setShapeMsg] = useState<string | null>(null);
  const shapeDirty = shape !== defaultShape;

  useEffect(() => {
    if (!timeEditing) setTime(savedTime);
  }, [savedTime, timeEditing]);

  useEffect(() => {
    setShape(defaultShape);
  }, [defaultShape]);

  async function saveTime(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setTimeMsg("Pick a summary time.");
      return;
    }
    setTimeBusy(true);
    setTimeMsg(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ summary_time: time })
      .eq("id", userId);
    setTimeBusy(false);
    if (error) {
      setTimeMsg(error.message);
      return;
    }
    setTimeEditing(false);
    setTimeMsg(null);
    router.refresh();
  }

  async function saveShape(e: FormEvent) {
    e.preventDefault();
    setShapeBusy(true);
    setShapeMsg(null);
    const { error } = await createClient()
      .from("profiles")
      .update({
        default_shape: shape,
        // Choosing a shape here answers the board's first-visit card too.
        ...(shape !== defaultShape && { onboarded_at: new Date().toISOString() }),
      })
      .eq("id", userId);
    setShapeBusy(false);
    if (error) {
      setShapeMsg(error.message);
      return;
    }
    setShapeMsg(null);
    router.refresh();
  }

  function cancelShape() {
    setShape(defaultShape);
    setShapeMsg(null);
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Look</h2>
          <p className="text-sm text-fg-soft">How Sticky Day appears on this device.</p>
        </header>
        <AppearanceChoices />
      </section>

      <EditableCard
        title="Your day"
        blurb="When today’s letter writes itself."
        summary={timeLabel(savedTime)}
        editing={timeEditing}
        dirty={time !== savedTime}
        saving={timeBusy}
        message={timeMsg}
        onEdit={() => {
          setTime(savedTime);
          setTimeMsg(null);
          setTimeEditing(true);
        }}
        onCancel={() => {
          setTime(savedTime);
          setTimeMsg(null);
          setTimeEditing(false);
        }}
        onSave={saveTime}
      >
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
      </EditableCard>

      <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Notes</h2>
          <p className="text-sm text-fg-soft">Default shape for notes you create.</p>
        </header>
        <form onSubmit={saveShape} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Shape for new notes</span>
            <ShapePicker value={shape} onChange={setShape} tone="page" label="Shape for new notes" />
            <span className="text-xs text-fg-soft">
              Only affects new notes. The ones already on your board keep their shape.
            </span>
          </div>
          {(shapeDirty || shapeMsg) && (
            <div className="flex flex-wrap items-center gap-3">
              {shapeDirty && (
                <button
                  type="submit"
                  disabled={shapeBusy}
                  className="h-11 rounded-xl bg-fg px-5 text-sm font-bold text-bg disabled:opacity-60"
                >
                  {shapeBusy ? "Saving…" : "Save"}
                </button>
              )}
              {shapeDirty && (
                <button
                  type="button"
                  onClick={cancelShape}
                  disabled={shapeBusy}
                  className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
              {shapeMsg && <span className="text-sm text-fg-soft">{shapeMsg}</span>}
            </div>
          )}
        </form>
      </section>
    </>
  );
}
