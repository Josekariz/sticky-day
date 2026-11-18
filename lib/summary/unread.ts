import { parseStoredSummary } from "@/lib/ai/tasks/summarize";

/** True when a stored letter exists and has not been marked read. */
export function isUnreadLetter(summary: unknown, summaryReadAt: string | null | undefined): boolean {
  return !!parseStoredSummary(summary) && summaryReadAt == null;
}

/** Navbar target for the Your day red dot — page picks yesterday vs today. */
export function unreadYourDayHref(_opts?: {
  todayUnread?: boolean;
  yesterdayUnread?: boolean;
  yesterday?: string;
}): string {
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

/**
 * Which day Your day should show.
 * Valid `?day=` wins; else yesterday when that letter is unread and today isn't.
 */
export function pickSummaryDay(opts: {
  today: string;
  yesterday: string;
  todayUnread: boolean;
  yesterdayUnread: boolean;
  dayParam?: string;
}): string {
  if (opts.dayParam) {
    const resolved = resolveSummaryDate(opts.dayParam, opts.today, opts.yesterday);
    if (resolved === opts.dayParam) return resolved;
  }
  if (opts.yesterdayUnread && !opts.todayUnread) return opts.yesterday;
  return opts.today;
}
