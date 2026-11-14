import { after } from "next/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/nav/Navbar";
import { SyncTimezone } from "@/components/profile/SyncTimezone";
import { AppearanceAccount } from "@/components/theme/AppearanceAccount";
import { isSummaryDue, todayFor, yesterdayFor } from "@/lib/core/date";
import { parseAppearance } from "@/lib/core/appearance";
import { isUnreadLetter } from "@/lib/summary/unread";
import { resolveDisplayName } from "@/lib/core/name";
import { isSummaryBusy, parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { writeDaySummary } from "@/lib/ai/writeDaySummary";
import { getSessionUser } from "@/lib/supabase/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, summary_time, appearance")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const appearance = parseAppearance(profile?.appearance);
  const today = todayFor(timezone);
  const yesterday = yesterdayFor(timezone);

  if (isSummaryDue(new Date(), timezone, summaryTime)) {
    const { data: day } = await supabase
      .from("days")
      .select("id, summary")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (day && !parseStoredSummary(day.summary) && !isSummaryBusy(day.summary)) {
      const dayId = day.id as string;
      const userId = user.id;
      after(() => {
        void writeDaySummary(supabase, userId, dayId).catch((e) => {
          console.error("auto summary failed", e instanceof Error ? e.message : e);
        });
      });
    }
  }

  const { data: unreadRows } = await supabase
    .from("days")
    .select("date, summary, summary_read_at")
    .eq("user_id", user.id)
    .in("date", [today, yesterday]);

  const todayUnread = (unreadRows ?? []).find(
    (r) => r.date === today && isUnreadLetter(r.summary, r.summary_read_at as string | null | undefined),
  );
  const yesterdayUnread = (unreadRows ?? []).find(
    (r) =>
      r.date === yesterday && isUnreadLetter(r.summary, r.summary_read_at as string | null | undefined),
  );
  const unreadLetter = !!(todayUnread || yesterdayUnread);
  const unreadHref = todayUnread
    ? "/summary"
    : yesterdayUnread
      ? `/calendar?m=${yesterday.slice(0, 7)}&day=${yesterday}`
      : "/summary";

  const name = resolveDisplayName(
    profile?.display_name as string | null | undefined,
    user.user_metadata ?? {},
    user.email,
  ) || "?";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar: string | null = user.user_metadata.avatar_url ?? null;

  return (
    <AppearanceAccount userId={user.id} appearance={appearance}>
      <SyncTimezone userId={user.id} storedTimezone={timezone} />
      <Navbar
        initials={initials}
        avatar={avatar}
        unreadLetter={unreadLetter}
        unreadHref={unreadHref}
      />
      <div className="flex flex-1 flex-col overflow-x-clip px-2 py-4 md:overflow-x-visible md:p-8">{children}</div>
    </AppearanceAccount>
  );
}
