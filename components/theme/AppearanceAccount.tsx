"use client";

import { createContext, useContext, useLayoutEffect } from "react";
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

  useLayoutEffect(() => {
    setTheme(appearance);
  }, [appearance, setTheme]);

  return <Ctx.Provider value={{ userId }}>{children}</Ctx.Provider>;
}
