"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Once per mount: keep profiles.timezone in sync with the browser. */
export function SyncTimezone({ userId, storedTimezone }: { userId: string; storedTimezone: string }) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === storedTimezone) return;
    void createClient()
      .from("profiles")
      .update({ timezone: tz })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.error("timezone sync failed", error.message);
      });
  }, [userId, storedTimezone]);

  return null;
}
