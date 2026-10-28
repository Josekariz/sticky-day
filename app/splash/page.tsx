"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

function Note({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <g transform="rotate(-6 16 16)">
        <path d="M5 5h22v17l-5 5H5z" className="fill-paper-yellow" />
        <path d="M22 27l5-5h-5z" className="pwa-note-fold" />
        <path d="M5 5h22v4H5z" className="pwa-note-top" />
      </g>
    </svg>
  );
}

function Launch({ framed }: { framed?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-pwa-splash ${framed ? "min-h-full flex-1" : "min-h-dvh"}`}
    >
      <div className="pwa-launch-glow pointer-events-none absolute size-[min(70%,18rem)] rounded-full" />
      <Note className="relative size-24" />
    </div>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-black p-4">
      <div className="relative flex h-[min(844px,100dvh)] w-[min(390px,100%)] flex-col overflow-hidden rounded-[2.25rem] ring-1 ring-fg/20">
        {children}
      </div>
    </div>
  );
}

function Home({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="dark flex min-h-full flex-1 flex-col bg-bg px-8 pt-14 text-fg">
      <p className="text-center text-sm text-fg-soft">9:41</p>
      <div className="flex flex-1 flex-col items-center justify-end pb-24">
        <button type="button" onClick={onOpen} className="flex flex-col items-center gap-2">
          <img
            src="/icons/192"
            alt="Open Sticky Day"
            width={72}
            height={72}
            className="size-[72px] rounded-[22%] shadow-[0_8px_24px_color-mix(in_oklch,black_45%,transparent)]"
          />
          <span className="text-xs font-medium">Sticky Day</span>
        </button>
      </div>
    </div>
  );
}

function Preview() {
  const preview = useSearchParams().get("preview");
  const router = useRouter();
  const [phase, setPhase] = useState<"home" | "launch">(preview === "home" ? "home" : "launch");
  const framed = preview === "home";

  useEffect(() => {
    if (phase !== "launch" || preview !== "home") return;
    const t = setTimeout(() => router.push("/board"), 1600);
    return () => clearTimeout(t);
  }, [phase, preview, router]);

  const screen =
    phase === "home" ? <Home onOpen={() => setPhase("launch")} /> : <Launch framed={framed} />;
  if (framed) return <Phone>{screen}</Phone>;
  return screen;
}

export default function SplashPage() {
  return (
    <Suspense fallback={<Launch />}>
      <Preview />
    </Suspense>
  );
}
