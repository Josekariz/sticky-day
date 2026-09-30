"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold text-danger">
      Sign out
    </button>
  );
}