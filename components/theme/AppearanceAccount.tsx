"use client";

import { createContext, useContext, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import type { Appearance } from "@/lib/core/appearance";

const Ctx = createContext<{ userId: string } | null>(null);

export function useAppearanceAccount() {
  return useContext(Ctx);
}

/** Signed-in: apply account appearance, expose userId for saves. */
export function AppearanceAccount({
  userId,
  appearance,
  children,
}: {
  userId: string;
  appearance: Appearance;
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  // Apply each server value once. Re-running when `theme` changes was stomping
  // the header toggle (tap light → effect saw profiles.appearance still "dark" → dark again).
  const applied = useRef<Appearance | null>(null);

  useLayoutEffect(() => {
    // Apply each server value once. Never re-run off local `theme` — that stomped the toggle.
    if (applied.current === appearance) return;
    applied.current = appearance;
    setTheme(appearance);
  }, [appearance, setTheme]);

  return <Ctx.Provider value={{ userId }}>{children}</Ctx.Provider>;
}
