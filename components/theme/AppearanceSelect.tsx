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

type Tone = "compact" | "full";

/**
 * One icon for the opposite of what’s on screen (sun in dark, moon in light).
 * Starts as Auto (device); first tap locks Light or Dark. Signed-in saves to profile.
 */
export function AppearanceSelect({
  className = "",
  tone = "full",
}: {
  className?: string;
  tone?: Tone;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const account = useAppearanceAccount();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <span
        className={`inline-block h-11 w-11 rounded-full border border-frame bg-surface md:h-10 md:w-10 ${className}`}
        aria-hidden
      />
    );
  }

  const dark = resolvedTheme === "dark";
  const next = dark ? "light" : "dark";

  async function toggle() {
    setTheme(next);
    if (!account) return;
    const { error } = await createClient()
      .from("profiles")
      .update({ appearance: next })
      .eq("id", account.userId);
    if (error) console.error("appearance save failed", error.message);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light" : "Dark"}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-frame bg-surface text-fg md:h-10 md:w-10"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      {tone === "full" && (
        <p className="text-xs text-fg-soft">
          {dark ? "Dark on — tap for paper." : "Light on — tap for neon."}
          {account ? " Saved to your account." : ""}
        </p>
      )}
    </div>
  );
}
