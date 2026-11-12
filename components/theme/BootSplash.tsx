"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

function markBooted() {
  document.documentElement.dataset.booted = "1";
}

/** Hides the SSR boot splash once the theme has resolved. */
export function BootSplash() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    markBooted();
  }, [resolvedTheme]);

  return null;
}
