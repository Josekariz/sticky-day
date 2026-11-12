"use client";

import { useEffect } from "react";

function markBooted() {
  document.documentElement.dataset.booted = "1";
}

/** Hides the SSR boot splash once the app has painted. */
export function BootSplash() {
  useEffect(() => {
    markBooted();
  }, []);
  return null;
}
