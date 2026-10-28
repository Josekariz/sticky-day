import { pwaSplash, SPLASH_SIZES } from "@/lib/pwa/icon";

const allowed = new Set(SPLASH_SIZES.map((s) => `${s.w}x${s.h}`));

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ w: string; h: string }> },
) {
  const { w, h } = await ctx.params;
  const key = `${w}x${h}`;
  if (!allowed.has(key)) return new Response("Not found", { status: 404 });
  return pwaSplash(Number(w), Number(h));
}
