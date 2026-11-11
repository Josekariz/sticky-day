"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

const OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/** Light / Dark / Auto — default is Auto (follows the phone). */
export function AppearanceSelect({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <span
        className={`inline-block h-10 w-28 rounded-xl border border-frame bg-surface ${className}`}
        aria-hidden
      />
    );
  }

  const value = theme === "light" || theme === "dark" ? theme : "system";

  return (
    <select
      value={value}
      onChange={(e) => setTheme(e.target.value)}
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
