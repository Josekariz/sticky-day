"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInButton({ className }: { className?: string }) {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <button type="button" onClick={signIn} className={className}>
      Continue with Google
    </button>
  );
}