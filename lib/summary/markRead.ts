import type { SupabaseClient } from "@supabase/supabase-js";

/** Mark a day's letter as read (works for past days via security definer RPC). */
export async function markSummaryRead(
  supabase: SupabaseClient,
  dayId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("mark_summary_read", { p_day_id: dayId });
  if (error) {
    console.error("mark_summary_read failed", error.message);
    return false;
  }
  return data === true;
}
