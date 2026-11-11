"use client";

import { useEffect } from "react";

/** Brief branded cover; must always clear even under React Strict Mode remounts. */
const MIN_MS = 700;

function markBooted() {
  document.documentElement.dataset.booted = "1";
}

/** Hides the SSR boot splash once the app has painted. */
export function BootSplash() {
  useEffect(() => {
    const id = window.setTimeout(markBooted, MIN_MS);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
