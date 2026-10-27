"use client";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <span className="inline-block h-11 w-11 md:h-10 md:w-10" />;

  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to paper" : "Switch to neon"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-frame bg-surface md:h-10 md:w-10"
    >
      {dark ? "☼" : "☾"}
    </button>
  );
}
