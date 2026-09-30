import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withFallback } from "@/lib/ai/model";
import { splitDay } from "@/lib/ai/tasks/split";

const Body = z.object({
  dump: z.string().min(3).max(4000),
  capacityMinutes: z.number().int().min(30).max(960).default(360),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  try {
    const result = await withFallback((model) =>
      splitDay(model, parsed.data.dump, parsed.data.capacityMinutes),
    );
    return Response.json(result);
  } catch (e) {
    console.error("split failed", e);
    return Response.json({ error: "Couldn't break that down. Try again." }, { status: 502 });
  }
}
