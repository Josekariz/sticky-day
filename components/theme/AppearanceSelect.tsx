"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseAppearance, type Appearance } from "@/lib/core/appearance";
import { useAppearanceAccount } from "@/components/theme/AppearanceAccount";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

const OPTIONS: {
  value: Appearance;
  label: string;
  hint: string;
  icon: "auto" | "light" | "dark";
}[] = [
  { value: "system", label: "Auto", hint: "Match your device", icon: "auto" },
  { value: "light", label: "Light", hint: "Paper board", icon: "light" },
  { value: "dark", label: "Dark", hint: "Neon board", icon: "dark" },
];

function Icon({ name }: { name: "auto" | "light" | "dark" }) {
  if (name === "light") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (name === "dark") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
      <path d="M12 7v6M9.5 9.5 12 7l2.5 2.5" />
    </svg>
  );
}

type Tone = "compact" | "full";

/**
 * Segmented Light / Dark / Auto control.
 * compact = marketing header; full = profile + mobile menu.
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
        className={`block h-11 rounded-xl border border-frame bg-surface ${tone === "compact" ? "w-[11.5rem]" : "w-full"} ${className}`}
        aria-hidden
      />
    );
  }

  const value = parseAppearance(theme);

  async function onChange(next: Appearance) {
    setTheme(next);
    if (!account) return;
    const { error } = await createClient()
      .from("profiles")
      .update({ appearance: next })
      .eq("id", account.userId);
    if (error) console.error("appearance save failed", error.message);
  }

  const active = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        role="radiogroup"
        aria-label="Appearance"
        className={`grid grid-cols-3 rounded-xl border border-frame bg-surface p-1 ${
          tone === "compact" ? "w-[11.5rem]" : "w-full"
        }`}
      >
        {OPTIONS.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${o.label}: ${o.hint}`}
              title={o.hint}
              onClick={() => void onChange(o.value)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selected ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
              }`}
            >
              <Icon name={o.icon} />
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
      {tone === "full" && (
        <p className="text-xs text-fg-soft">
          {active.hint}
          {account ? " · Saved to your account." : ""}
        </p>
      )}
    </div>
  );
}
