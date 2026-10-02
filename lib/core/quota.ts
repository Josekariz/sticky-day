/** Daily shared-key AI call budget. Pure: no I/O. */

export const AI_DAILY_LIMIT = 60;

export type QuotaRow = {
  ai_calls_date: string | null;
  ai_calls_count: number | null;
};

/** Whether one more call is allowed for `today` (YYYY-MM-DD in the user's tz). */
export function canSpend(
  today: string,
  row: QuotaRow,
  limit: number = AI_DAILY_LIMIT,
): { allowed: boolean; nextCount: number } {
  const count = row.ai_calls_date === today ? (row.ai_calls_count ?? 0) : 0;
  if (count >= limit) return { allowed: false, nextCount: count };
  return { allowed: true, nextCount: count + 1 };
}
