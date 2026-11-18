import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayFor } from "@/lib/core/date";
import { SummaryView } from "@/components/summary/SummaryView";
import { loadDayLetter } from "@/lib/summary/loadDayLetter";
import { RefreshAfterRead } from "@/components/summary/RefreshAfterRead";

/** Your day — always today (waiting board or today's letter). */
export default async function SummaryPage() {
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
  const today = todayFor(timezone);

  const loaded = await loadDayLetter(supabase, user, {
    date: today,
    ensureDay: true,
    markReadIfUnread: true,
  });
  if (!loaded) redirect("/");

  return (
    <main className="flex flex-1 flex-col py-2">
      <RefreshAfterRead didMark={loaded.didMark} />
      <SummaryView data={loaded.data} />
    </main>
  );
}
