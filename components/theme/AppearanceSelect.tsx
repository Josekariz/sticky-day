"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseAppearance, type Appearance } from "@/lib/core/appearance";
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
 * Auto by default. Sun / moon lock Light or Dark; tap the active one again for Auto.
 * Signed-in choices save to the profile.
 */
export function AppearanceSelect({
  className = "",
  tone = "full",
}: {
  className?: string;
  tone?: Tone;
}) {
  const { theme, setTheme } = useTheme();
  const account = useAppearanceAccount();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <span
        className={`inline-flex h-11 w-[5.5rem] rounded-full border border-frame bg-surface ${className}`}
        aria-hidden
      />
    );
  }

  const value = parseAppearance(theme);
  const lightOn = value === "light";
  const darkOn = value === "dark";

  async function save(next: Appearance) {
    setTheme(next);
    if (!account) return;
    const { error } = await createClient()
      .from("profiles")
      .update({ appearance: next })
      .eq("id", account.userId);
    if (error) console.error("appearance save failed", error.message);
  }

  function pick(mode: "light" | "dark") {
    // Second tap on the active icon returns to Auto (device).
    void save(value === mode ? "system" : mode);
  }

  const hint =
    value === "light"
      ? "Paper board. Tap the sun again to match your device."
      : value === "dark"
        ? "Neon board. Tap the moon again to match your device."
        : "Matching your device. Tap sun or moon to lock a look.";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        role="group"
        aria-label="Appearance"
        className="inline-flex h-11 items-center gap-0.5 rounded-full border border-frame bg-surface p-1"
      >
        <button
          type="button"
          aria-pressed={lightOn}
          aria-label={lightOn ? "Light mode on. Tap again for Auto." : "Use light mode"}
          title="Light"
          onClick={() => pick("light")}
          className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
            lightOn ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
          }`}
        >
          <SunIcon />
        </button>
        <button
          type="button"
          aria-pressed={darkOn}
          aria-label={darkOn ? "Dark mode on. Tap again for Auto." : "Use dark mode"}
          title="Dark"
          onClick={() => pick("dark")}
          className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
            darkOn ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
          }`}
        >
          <MoonIcon />
        </button>
      </div>
      {tone === "full" && <p className="text-xs text-fg-soft">{hint}</p>}
    </div>
  );
}
