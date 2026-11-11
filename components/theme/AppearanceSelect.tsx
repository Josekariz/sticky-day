"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseAppearance, type Appearance } from "@/lib/core/appearance";
import { useAppearanceAccount } from "@/components/theme/AppearanceAccount";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

const OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/** Light / Dark / Auto — default Auto; signed-in saves to the profile. */
export function AppearanceSelect({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const account = useAppearanceAccount();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <span
        className={`inline-block h-10 w-28 rounded-xl border border-frame bg-surface ${className}`}
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

  return (
    <select
      value={value}
      onChange={(e) => void onChange(parseAppearance(e.target.value))}
      aria-label="Appearance"
      className={`h-10 rounded-xl border border-frame bg-surface px-3 text-sm font-semibold text-fg outline-none focus:border-fg ${className}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
