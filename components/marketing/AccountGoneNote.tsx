"use client";

import { useEffect } from "react";

export function AccountGoneNote() {
  // Drop ?deleted=1 so a refresh or shared link doesn't show the note again.
  useEffect(() => {
    window.history.replaceState(null, "", "/");
  }, []);

  return (
    <p role="status" className="text-sm text-fg-soft">
      Your account is gone. Thanks for trying it.
    </p>
  );
}
