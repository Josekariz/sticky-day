"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** After the server marks a letter read, refresh the shared layout so the unread dot clears. */
export function RefreshAfterRead({ didMark }: { didMark: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (didMark) router.refresh();
  }, [didMark, router]);
  return null;
}
