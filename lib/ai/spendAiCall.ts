import type { SupabaseClient } from "@supabase/supabase-js";
import { todayFor } from "@/lib/core/date";
import { AI_DAILY_LIMIT, canSpend } from "@/lib/core/quota";

export class QuotaExceededError extends Error {
  constructor() {
    super("You've used today's AI allowance. Try again tomorrow.");
    this.name = "QuotaExceededError";
  }
}

/** Reset/increment the per-user daily AI counter. Throws QuotaExceededError when over. */
export async function spendAiCall(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, ai_calls_date, ai_calls_count")
    .eq("id", userId)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const today = todayFor(timezone);
  const decision = canSpend(today, {
    ai_calls_date: (profile?.ai_calls_date as string | null | undefined) ?? null,
    ai_calls_count: (profile?.ai_calls_count as number | null | undefined) ?? 0,
  }, AI_DAILY_LIMIT);

  if (!decision.allowed) throw new QuotaExceededError();

  const { error } = await supabase
    .from("profiles")
    .update({ ai_calls_date: today, ai_calls_count: decision.nextCount })
    .eq("id", userId);
  if (error) console.error("ai quota update failed", error.message);
}
