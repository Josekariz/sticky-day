"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AppearanceSelect } from "@/components/theme/AppearanceSelect";
import { flushPendingSaves, hasPendingSaves } from "@/components/board/pendingSaves";
import { ManualTopProgress, NavTopProgress, PendingLabel } from "@/components/nav/PendingNav";
import { useModalHistory } from "@/components/useModalHistory";

const LINKS = [
  { href: "/board", label: "Board" },
  { href: "/calendar", label: "Calendar" },
  { href: "/summary", label: "Your day" },
];

export function Navbar({
  initials,
  avatar,
  unreadLetter = false,
  unreadHref = "/summary",
}: {
  initials: string;
  avatar: string | null;
  /** Red dot on Your day when a letter is waiting. */
  unreadLetter?: boolean;
  /** Your day link target when unread (today vs yesterday in calendar). */
  unreadHref?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [flushHref, setFlushHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sheet = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const flushNav = flushHref !== null && path !== flushHref && !path.startsWith(flushHref);
  const unread = unreadLetter;

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

  useModalHistory(menuOpen, () => setMenuOpen(false));

  /** Let Link navigate (useLinkStatus works) unless in-flight saves need a brief flush. */
  async function onNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    setMenuOpen(false);
    if (!hasPendingSaves()) return;
    e.preventDefault();
    setFlushHref(href);
    await flushPendingSaves(1000);
    router.push(href);
  }

  async function onRefresh() {
    if (isPending) return;
    await flushPendingSaves(1000);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <ManualTopProgress active={flushNav || isPending} />
      <header className="relative flex h-16 items-center justify-between border-b border-frame px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Link
          href="/board"
          onClick={(e) => void onNavClick(e, "/board")}
          className="justify-self-start whitespace-nowrap font-hand text-3xl font-bold leading-none"
        >
          <NavTopProgress />
          <PendingLabel>Sticky Day</PendingLabel>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            const isYourDay = l.href === "/summary";
            const href = isYourDay && unread ? unreadHref : l.href;
            return (
              <Link
                key={l.href}
                href={href}
                onClick={(e) => {
                  void onNavClick(e, href);
                }}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-9 items-center rounded-xl px-3.5 text-sm font-semibold ${
                  active ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
                }`}
              >
                <NavTopProgress />
                <PendingLabel>{l.label}</PendingLabel>
                {isYourDay && unread && (
                  <span
                    className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger"
                    aria-label="Unread Your day"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end md:gap-3">
          {/* Always visible — on phones this was buried in the menu and felt broken. */}
          <AppearanceSelect tone="compact" />
          <button
            type="button"
            aria-label="Refresh"
            disabled={isPending}
            aria-busy={isPending}
            onClick={() => void onRefresh()}
            className="hidden place-items-center rounded-full text-fg-soft hover:bg-frame/40 hover:text-fg disabled:opacity-60 md:grid md:h-10 md:w-10"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
              className={isPending ? "animate-spin" : undefined}
            >
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8m0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4z" />
            </svg>
          </button>
          <Link
            href="/profile"
            onClick={(e) => void onNavClick(e, "/profile")}
            aria-label="Profile"
            className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-fg text-sm font-semibold text-bg md:h-10 md:w-10"
          >
            <NavTopProgress />
            <PendingLabel className="grid h-full w-full place-items-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Google URL, no need for next/image
                <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </PendingLabel>
          </Link>
          <button
            ref={toggle}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-frame bg-surface md:hidden"
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
              const isYourDay = l.href === "/summary";
              const href = isYourDay && unread ? unreadHref : l.href;
              return (
                <Link
                  key={l.href}
                  href={href}
                  onClick={(e) => {
                    void onNavClick(e, href);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-12 items-center justify-center rounded-xl px-4 font-semibold ${
                    active ? "bg-fg text-bg" : "text-fg"
                  }`}
                >
                  <NavTopProgress />
                  <PendingLabel>{l.label}</PendingLabel>
                  {isYourDay && unread && (
                    <span
                      className="absolute right-3 top-3 size-2 rounded-full bg-danger"
                      aria-label="Unread Your day"
                    />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              disabled={isPending}
              aria-busy={isPending}
              onClick={() => {
                setMenuOpen(false);
                void onRefresh();
              }}
              className="flex h-12 items-center justify-center rounded-xl px-4 font-semibold text-fg"
            >
              {isPending ? "Refreshing…" : "Refresh"}
            </button>
            <SignOutButton className="flex h-12 items-center justify-center rounded-xl px-4 font-semibold text-danger" />
          </div>
        )}
      </header>
    </>
  );
}
