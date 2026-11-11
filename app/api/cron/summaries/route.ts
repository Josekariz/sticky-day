import { createAdminClient } from "@/lib/supabase/admin";
import { shiftDate, todayFor } from "@/lib/core/date";
import { isSummaryBusy, parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { writeDaySummary } from "@/lib/ai/writeDaySummary";

export const maxDuration = 300;

const BATCH = 20;
/** Forward-only floor — never walk history before the return-loop launch. */
const FLOOR = process.env.SUMMARY_CRON_SINCE || "2026-11-11";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function dryRun(req: Request): boolean {
  if (process.env.CRON_DRY_RUN === "1") return true;
  return new URL(req.url).searchParams.get("dry") === "1";
}

/** Hobby: once per day (~21:00 UTC ≈ midnight EAT). Write missing Your day letters. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error("cron summaries: admin client", e instanceof Error ? e.message : e);
    return Response.json({ error: "Service role not configured" }, { status: 503 });
  }

  const dry = dryRun(req);
  const now = new Date();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, timezone")
    .limit(500);
  if (error) {
    console.error("cron summaries: profiles", error.message);
    return Response.json({ error: "Could not load profiles" }, { status: 500 });
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;
  const planned: { userId: string; date: string; action: string }[] = [];

  for (const p of (profiles ?? []).slice(0, BATCH)) {
    const userId = p.id as string;
    const tz = (p.timezone as string | null | undefined) ?? "UTC";
    const userToday = todayFor(tz, now);
    const candidates = [shiftDate(userToday, -1), shiftDate(userToday, -2)].filter(
      (d) => d >= FLOOR && d < userToday,
    );

    for (const date of candidates) {
      try {
        const { data: day } = await supabase
          .from("days")
          .select("id, summary")
          .eq("user_id", userId)
          .eq("date", date)
          .maybeSingle();
        if (!day) {
          skipped += 1;
          continue;
        }

        const { count: noteCount } = await supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("day_id", day.id)
          .eq("user_id", userId)
          .neq("status", "trashed");
        if (!noteCount) {
          skipped += 1;
          continue;
        }

        if (parseStoredSummary(day.summary)) {
          skipped += 1;
          continue;
        }
        if (isSummaryBusy(day.summary)) {
          skipped += 1;
          continue;
        }

        planned.push({ userId, date, action: "write" });
        if (!dry) {
          await writeDaySummary(supabase, userId, day.id as string, {
            countTowardQuota: false,
          });
          written += 1;
        }
      } catch (e) {
        failed += 1;
        console.error("cron summary failed", userId, e instanceof Error ? e.message : e);
      }
    }
  }

  return Response.json({
    ok: true,
    dry,
    written,
    skipped,
    failed,
    planned: dry ? planned : undefined,
  });
}
