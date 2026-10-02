"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SignOutButton } from "@/components/auth/SignOutButton";

const LINKS = [
  { href: "/board", label: "Board" },
  { href: "/calendar", label: "Calendar" },
  { href: "/summary", label: "Your day" },
];

export function Navbar({ initials, avatar }: { initials: string; avatar: string | null }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!(e.target instanceof Node)) return;
      if (sheet.current?.contains(e.target) || toggle.current?.contains(e.target)) return;
      setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-frame px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8">
      <Link href="/board" className="justify-self-start whitespace-nowrap font-hand text-3xl font-bold leading-none">
        Sticky Day
      </Link>

      <nav className="hidden gap-1 md:flex">
        {LINKS.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center rounded-xl px-3.5 text-sm font-semibold ${
                active ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 justify-self-end md:gap-3">
        <ThemeToggle />
        <Link href="/profile" aria-label="Profile" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-fg text-sm font-semibold text-bg">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Google URL, no need for next/image
            <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
        </Link>
        <button
          ref={toggle}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-frame bg-surface md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            {menuOpen ? (
              <path d="M6 6l12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          ref={sheet}
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-40 flex flex-col gap-1 border-b border-frame bg-surface p-2 shadow-lg md:hidden"
        >
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center justify-center rounded-xl px-4 font-semibold ${
                  active ? "bg-fg text-bg" : "text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <SignOutButton className="flex h-12 items-center justify-center rounded-xl px-4 font-semibold text-danger" />
        </div>
      )}
    </header>
  );
}
