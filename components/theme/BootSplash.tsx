"use client";

import { useEffect } from "react";

/** Keep the branded splash up briefly so Android’s icon-only OS splash isn’t the only thing you see. */
const MIN_MS = 700;

/** Hides the SSR boot splash once the app has painted. */
export function BootSplash() {
  useEffect(() => {
    const started = performance.now();
    let timeout = 0;
    const hide = () => {
      const left = MIN_MS - (performance.now() - started);
      timeout = window.setTimeout(() => {
        document.documentElement.dataset.booted = "1";
      }, Math.max(0, left));
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("load", hide);
    };
  }, []);
  return null;
}
