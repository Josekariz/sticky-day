"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { DayView } from "./DayView";
import { readGuestBoard } from "./guestStore";

const noSubscribe = () => () => {};

/**
 * The landing page's board. It lives in localStorage, so it renders only in the
 * browser: an empty board drawn first would save over the stored one.
 */
export function GuestBoard({ signIn }: { signIn: ReactNode }) {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!inBrowser) return <div className="flex-1" />;

  return (
    <DayView
      account={null}
      initialNotes={readGuestBoard()}
      capacityMinutes={360}
      initialSummary={null}
      defaultShape={null}
      onboarded
      isNewAccount={false}
      aside={signIn}
    />
  );
}
