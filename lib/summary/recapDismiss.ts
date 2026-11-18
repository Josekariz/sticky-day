/** sessionStorage key: Recap day id armed while viewing /recap (browser only). */
export const RECAP_DAY_KEY = "sticky-recap-day";

export function armRecapDismiss(dayId: string): void {
  try {
    sessionStorage.setItem(RECAP_DAY_KEY, dayId);
  } catch {
    /* private mode / SSR */
  }
}

/** Take and clear the armed Recap day id, if any. */
export function takeRecapDayId(): string | null {
  try {
    const id = sessionStorage.getItem(RECAP_DAY_KEY);
    if (id) sessionStorage.removeItem(RECAP_DAY_KEY);
    return id;
  } catch {
    return null;
  }
}
