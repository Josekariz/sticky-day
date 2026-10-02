"use client";

import { useLinkStatus } from "next/link";

/** Dim the link label while this Link's navigation is pending. */
export function PendingLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <span className={`transition-opacity ${pending ? "opacity-50" : ""} ${className}`.trim()}>
      {children}
    </span>
  );
}

/** Fixed 2px top bar; CSS delays show so sub-150ms navigations never flash. */
export function NavTopProgress() {
  const { pending } = useLinkStatus();
  return <div aria-hidden className={`nav-top-progress${pending ? " is-pending" : ""}`} />;
}

/** Same bar, driven manually when navigation goes through router.push after a save flush. */
export function ManualTopProgress({ active }: { active: boolean }) {
  return <div aria-hidden className={`nav-top-progress${active ? " is-pending" : ""}`} />;
}
