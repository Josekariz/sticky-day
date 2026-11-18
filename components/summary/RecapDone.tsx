"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markSummaryRead } from "@/lib/summary/markRead";
import { armRecapDismiss, takeRecapDayId } from "@/lib/summary/recapDismiss";

/**
 * Soft exit from Recap: optional CTA to the board, marks the letter read.
 * Leaving Recap via the nav also marks (see Navbar) — this is not a gate.
 */
export function RecapDone({ dayId }: { dayId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    armRecapDismiss(dayId);
  }, [dayId]);

  async function finish() {
    if (busy) return;
    setBusy(true);
    takeRecapDayId();
    await markSummaryRead(createClient(), dayId);
    router.push("/board");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void finish()}
      className="self-start text-left font-hand text-2xl text-fg-soft underline decoration-frame underline-offset-4 transition-colors hover:text-fg hover:decoration-fg disabled:opacity-60"
    >
      {busy ? "Heading over…" : "Done reading — let's move on to the board"}
    </button>
  );
}
