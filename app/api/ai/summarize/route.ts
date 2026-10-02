import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { QuotaExceededError } from "@/lib/ai/spendAiCall";
import { writeDaySummary } from "@/lib/ai/writeDaySummary";

const Body = z.object({
  dayId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  try {
    const force = parsed.data.force;
    const result = await writeDaySummary(supabase, user.id, parsed.data.dayId, {
      force,
      // Auto layout write does not count; manual force does.
      countTowardQuota: force,
    });
    return Response.json(result);
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return Response.json({ error: e.message }, { status: 429 });
    }
    const msg = e instanceof Error ? e.message : "Couldn't write the summary. Try again.";
    if (msg === "Day not found") return Response.json({ error: msg }, { status: 404 });
    console.error("summarize failed", e);
    return Response.json({ error: "Couldn't write the summary. Try again." }, { status: 502 });
  }
}
