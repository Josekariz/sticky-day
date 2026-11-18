import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { greetingWithName, todayFor } from "@/lib/core/date";
import { firstNameOf, resolveDisplayName } from "@/lib/core/name";
import type { SummaryBlock } from "@/components/summary/SummaryView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";
import { markSummaryRead } from "@/lib/summary/markRead";
import { isUnreadLetter } from "@/lib/summary/unread";

type NoteRowWithTimes = NoteRow & {
  created_at?: string;
  updated_at?: string;
};

export type LoadDayLetterResult = {
  data: SummaryBlock;
  didMark: boolean;
};

/**
 * Load one day's letter + notes into a SummaryBlock.
 * No AI — reads stored summary only; optionally marks unread as read.
 */
export async function loadDayLetter(
  supabase: SupabaseClient,
  user: User,
  opts: {
    date: string;
    /** Create today's day row if missing (Your day only). */
    ensureDay?: boolean;
    /** Mark letter read when it is currently unread. */
    markReadIfUnread?: boolean;
    /** Return null unless the letter is unread (Recap gate). */
    requireUnread?: boolean;
  },
): Promise<LoadDayLetterResult | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, summary_time")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const today = todayFor(timezone);
  const userId = user.id;

  let dayId: string;
  let summaryRaw: unknown;
  let summaryReadAt: string | null | undefined;

  if (opts.ensureDay && opts.date === today) {
    const day = await ensureTodayDay(supabase, userId, today);
    const { data: meta } = await supabase
      .from("days")
      .select("summary, summary_read_at")
      .eq("id", day.id)
      .eq("user_id", userId)
      .maybeSingle();
    dayId = day.id;
    summaryRaw = meta?.summary ?? day.summary;
    summaryReadAt = meta?.summary_read_at as string | null | undefined;
  } else {
    const { data: day } = await supabase
      .from("days")
      .select("id, summary, summary_read_at")
      .eq("user_id", userId)
      .eq("date", opts.date)
      .maybeSingle();
    if (!day) return null;
    dayId = day.id as string;
    summaryRaw = day.summary;
    summaryReadAt = day.summary_read_at as string | null | undefined;
  }

  if (opts.requireUnread && !isUnreadLetter(summaryRaw, summaryReadAt)) {
    return null;
  }

  const summary = parseStoredSummary(summaryRaw);
  let didMark = false;
  if (opts.markReadIfUnread && summary && summaryReadAt == null) {
    didMark = await markSummaryRead(supabase, dayId);
    if (didMark) revalidatePath("/", "layout");
  }

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", dayId)
    .eq("user_id", userId)
    .neq("status", "trashed");

  const noteRows = (rows as NoteRowWithTimes[] | null) ?? [];
  const notes = noteRows.map(rowToNote);

  let latestNoteMs = 0;
  for (const r of noteRows) {
    for (const iso of [r.created_at, r.updated_at]) {
      if (!iso) continue;
      const t = new Date(iso).getTime();
      if (Number.isFinite(t) && t > latestNoteMs) latestNoteMs = t;
    }
  }
  const summaryMs = summary?.createdAt ? new Date(summary.createdAt).getTime() : 0;
  const stale = !!summary?.createdAt && latestNoteMs > summaryMs;

  const displayName = resolveDisplayName(
    profile?.display_name as string | null | undefined,
    user.user_metadata ?? {},
    user.email,
  );
  const firstName = firstNameOf(displayName);

  const data: SummaryBlock = {
    date: opts.date,
    today,
    dayId,
    firstName,
    timezone,
    greeting: greetingWithName(new Date(), timezone, firstName),
    summary,
    doneNotes: notes.filter((n) => n.status === "done"),
    focusNotes: notes.filter((n) => n.status === "focus"),
    unfinishedNotes: notes.filter((n) => n.status === "board"),
    summaryTime,
    stale,
  };

  return { data, didMark };
}
