"use client";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <span className="inline-block w-10 h-10" />;

  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to paper" : "Switch to neon"}
      className="w-10 h-10 rounded-full border border-frame bg-surface flex items-center justify-center"
    >
      {dark ? "☼" : "☾"}
    </button>
  );
}
