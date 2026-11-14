"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Appearance } from "@/lib/core/appearance";
import { useAppearanceAccount } from "@/components/theme/AppearanceAccount";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

const OPTIONS: { value: Appearance; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Paper and ink" },
  { value: "dark", label: "Dark", hint: "Dim for night" },
  { value: "system", label: "Auto", hint: "Match your device" },
];

/** Settings-only: Light / Dark / Auto. Saves to the profile when signed in. */
export function AppearanceChoices() {
  const { theme, setTheme } = useTheme();
  const account = useAppearanceAccount();
  const mounted = useMounted();
  const current: Appearance =
    mounted && (theme === "light" || theme === "dark" || theme === "system") ? theme : "system";

  async function pick(next: Appearance) {
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
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map((opt) => {
        const selected = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!mounted}
            onClick={() => void pick(opt.value)}
            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-3 text-left transition-colors ${
              selected
                ? "border-fg bg-fg text-bg"
                : "border-frame bg-bg text-fg hover:border-fg/40"
            }`}
          >
            <span className="text-sm font-semibold">{opt.label}</span>
            <span className={`text-[11px] leading-snug ${selected ? "text-bg/75" : "text-fg-soft"}`}>
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
