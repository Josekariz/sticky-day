"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  className = "h-11 rounded-xl border border-frame px-5 text-sm font-semibold text-danger",
}: {
  className?: string;
}) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button onClick={signOut} className={className}>
      Sign out
    </button>
  );
}