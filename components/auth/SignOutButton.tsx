"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  function signOut() {
    // Day 2: await supabase.auth.signOut() before redirecting
    router.replace("/");
  }

  return (
    <button onClick={signOut} className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold text-danger">
      Sign out
    </button>
  );
}
