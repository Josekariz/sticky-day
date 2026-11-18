"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** After today's letter is marked read, refresh so shared layout state stays current. */
export function RefreshAfterRead({ didMark }: { didMark: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (didMark) router.refresh();
  }, [didMark, router]);
  return null;
}
