"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppearanceAccount } from "@/components/theme/AppearanceAccount";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </svg>
  );
}

/**
 * Header toggle: one icon for the opposite of what’s on screen.
 * Full Light / Dark / Auto choices live in Settings (`AppearanceChoices`).
 */
export function AppearanceSelect({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const account = useAppearanceAccount();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";
  const next = dark ? "light" : "dark";

  async function toggle() {
    if (!mounted) return;
    setTheme(next);
    if (!account) return;
    const { data, error } = await createClient()
      .from("profiles")
      .update({ appearance: next })
      .eq("id", account.userId)
      .select("id");
    if (error || !data?.length) {
      console.error("appearance save failed", error?.message ?? "no row");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={!mounted}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light" : "Dark"}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-frame bg-surface text-fg md:h-10 md:w-10 ${className}`}
    >
      {/* Same shell on server + client; icon waits for theme so hydration stays quiet. */}
      <span className="grid h-[18px] w-[18px] place-items-center" suppressHydrationWarning>
        {mounted ? dark ? <SunIcon /> : <MoonIcon /> : null}
      </span>
    </button>
  );
}
