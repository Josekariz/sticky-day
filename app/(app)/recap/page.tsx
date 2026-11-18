import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yesterdayFor } from "@/lib/core/date";
import { SummaryView } from "@/components/summary/SummaryView";
import { loadDayLetter } from "@/lib/summary/loadDayLetter";

/**
 * Recap — yesterday's unread letter only.
 * Does not mark on open; soft "done reading" CTA (or leaving the page) marks read.
 * No AI — stored summary only.
 */
export default async function RecapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const yesterday = yesterdayFor(timezone);

  const loaded = await loadDayLetter(supabase, user, {
    date: yesterday,
    requireUnread: true,
  });
  if (!loaded || !loaded.data.summary) redirect("/summary");

  return (
    <main className="flex flex-1 flex-col py-2">
      <SummaryView data={loaded.data} variant="recap" />
    </main>
  );
}
