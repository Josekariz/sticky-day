import { parseStoredSummary } from "@/lib/ai/tasks/summarize";

/** True when a stored letter exists and has not been marked read. */
export function isUnreadLetter(summary: unknown, summaryReadAt: string | null | undefined): boolean {
  return !!parseStoredSummary(summary) && summaryReadAt == null;
}

/**
 * Navbar target for the Your day red dot.
 * Yesterday's letter opens on /summary?day=… — never the calendar.
 */
export function unreadYourDayHref(opts: {
  todayUnread: boolean;
  yesterdayUnread: boolean;
  yesterday: string;
}): string {
  if (opts.yesterdayUnread && !opts.todayUnread) {
    return `/summary?day=${opts.yesterday}`;
  }
  return "/summary";
}

/** Only today or yesterday — same window as the navbar unread dot. */
export function resolveSummaryDate(
  raw: string | undefined,
  today: string,
  yesterday: string,
): string {
  if (
    raw &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    raw <= today &&
    (raw === today || raw === yesterday)
  ) {
    return raw;
  }
  return today;
}
