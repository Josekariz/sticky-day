"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const LINKS = [
  { href: "/board", label: "Board" },
  { href: "/calendar", label: "Calendar" },
  { href: "/summary", label: "Summary" },
];

export function Navbar({ initials, avatar }: { initials: string; avatar: string | null }) {
  const path = usePathname();

  return (
    <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-frame px-4 md:px-8">
      <Link href="/board" className="justify-self-start font-hand text-3xl font-bold leading-none">
        Sticky Day
      </Link>

      <nav className="flex gap-1">
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

      <div className="flex items-center gap-3 justify-self-end">
        <ThemeToggle />
        <Link href="/profile" aria-label="Profile" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-fg text-sm font-semibold text-bg">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Google URL, no need for next/image
            <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
