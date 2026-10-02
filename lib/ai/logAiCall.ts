import type { SupabaseClient } from "@supabase/supabase-js";

/** Fire-and-forget AI attempt log. Never throws into the request. */
export async function logAiCall(
  supabase: SupabaseClient,
  row: {
    task: string;
    model: string;
    ok: boolean;
    error?: string | null;
    durationMs: number;
    input?: string | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_ai_call", {
      p_task: row.task,
      p_model: row.model,
      p_ok: row.ok,
      p_error: row.error ?? null,
      p_duration_ms: row.durationMs,
      p_input: row.input ?? null,
    });
    if (error) console.error("ai log failed", error.message);
  } catch (e) {
    console.error("ai log failed", e instanceof Error ? e.message : e);
  }
}
