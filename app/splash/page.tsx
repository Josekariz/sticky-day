"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

function Launch() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-pwa-splash">
      <div className="pwa-launch-glow pointer-events-none absolute size-[min(92vw,28rem)] rounded-full" />
      <Note className="relative size-[28vw] max-h-40 max-w-40" />
    </div>
  );
}

function Home({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="dark flex min-h-dvh flex-col bg-bg px-8 pt-14 text-fg">
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

  useEffect(() => {
    if (phase !== "launch" || preview !== "home") return;
    const t = setTimeout(() => router.push("/board"), 1600);
    return () => clearTimeout(t);
  }, [phase, preview, router]);

  if (phase === "home") return <Home onOpen={() => setPhase("launch")} />;
  return <Launch />;
}

export default function SplashPage() {
  return (
    <Suspense fallback={<Launch />}>
      <Preview />
    </Suspense>
  );
}
