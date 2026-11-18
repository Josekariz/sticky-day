import { parseStoredSummary } from "@/lib/ai/tasks/summarize";

/** True when a stored letter exists and has not been marked read. */
export function isUnreadLetter(summary: unknown, summaryReadAt: string | null | undefined): boolean {
  return !!parseStoredSummary(summary) && summaryReadAt == null;
}

/** Recap nav item only while yesterday's letter is unread. */
export function shouldShowRecap(yesterdayUnread: boolean): boolean {
  return yesterdayUnread;
}
