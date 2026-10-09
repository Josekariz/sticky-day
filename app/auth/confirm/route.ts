import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/core/redirect";

// Email links that carry a token_hash (set up in the Supabase email templates).
// Unlike /auth/callback's code, these work in any browser, not only the one that asked.
const EMAIL_TYPES: EmailOtpType[] = ["recovery", "signup", "email", "email_change", "invite", "magiclink"];

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const tokenHash = searchParams.get("token_hash");
  const type = EMAIL_TYPES.find((t) => t === searchParams.get("type"));
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // Default templates still send ?code=, which only works in the browser that asked.
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/?error=auth`);
}
