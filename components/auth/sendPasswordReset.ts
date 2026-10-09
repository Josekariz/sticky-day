import { createClient } from "@/lib/supabase/client";

/** Emails a link that signs the person in and opens the new-password note. */
export function sendPasswordReset(email: string) {
  return createClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
  });
}
