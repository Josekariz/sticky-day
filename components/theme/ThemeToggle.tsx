"use client";

import { AppearanceSelect } from "@/components/theme/AppearanceSelect";

/** Desktop header control — same Light / Dark / Auto choices as the menu. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  return <AppearanceSelect className={className} />;
}
