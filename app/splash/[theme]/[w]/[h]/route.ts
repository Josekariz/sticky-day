import { pwaSplash, SPLASH_SIZES } from "@/lib/pwa/icon";

const allowed = new Set(SPLASH_SIZES.map((s) => `${s.theme}-${s.w}x${s.h}`));

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ theme: string; w: string; h: string }> },
) {
  const { theme, w, h } = await ctx.params;
  if (theme !== "light" && theme !== "dark") return new Response("Not found", { status: 404 });
  if (!allowed.has(`${theme}-${w}x${h}`)) return new Response("Not found", { status: 404 });
  return pwaSplash(Number(w), Number(h), theme);
}
