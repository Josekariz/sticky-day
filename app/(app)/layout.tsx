import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/nav/Navbar";
import { SyncTimezone } from "@/components/profile/SyncTimezone";
import { isSummaryDue, todayFor } from "@/lib/core/date";
import { isSummaryBusy, parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { writeDaySummary } from "@/lib/ai/writeDaySummary";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, summary_time")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const today = todayFor(timezone);

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

  const googleName: string = user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "?";
  const name: string = (profile?.display_name as string | null | undefined)?.trim() || googleName;
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar: string | null = user.user_metadata.avatar_url ?? null;

  return (
    <>
      <SyncTimezone userId={user.id} storedTimezone={timezone} />
      <Navbar initials={initials} avatar={avatar} />
      <div className="flex flex-1 flex-col overflow-x-clip px-2 py-4 md:overflow-x-visible md:p-8">{children}</div>
    </>
  );
}
