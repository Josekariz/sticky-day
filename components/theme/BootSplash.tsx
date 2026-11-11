"use client";

import { useEffect } from "react";

/** Hides the SSR boot splash once the app has painted. */
export function BootSplash() {
  useEffect(() => {
    document.documentElement.dataset.booted = "1";
  }, []);
  return null;
}
