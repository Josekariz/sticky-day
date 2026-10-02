import type { SupabaseClient } from "@supabase/supabase-js";

export const AI_DAILY_LIMIT = 60;

export class QuotaExceededError extends Error {
  constructor() {
    super("You've used today's AI allowance. Try again tomorrow.");
    this.name = "QuotaExceededError";
  }
}

/** Spend one AI call via DB RPC. Throws QuotaExceededError when over the daily cap. */
export async function spendAiCall(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase.rpc("spend_ai_call", { limit: AI_DAILY_LIMIT });
  if (error) {
    console.error("ai quota rpc failed", error.message);
    throw new Error("Couldn't check AI allowance. Try again.");
  }
  if (data !== true) throw new QuotaExceededError();
}
