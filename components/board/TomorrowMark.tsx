/** Forward-to-tomorrow mark: arrow to send it, moon once it's queued. */

export function TomorrowActionIcon({ on }: { on: boolean }) {
  return on ? <MoonIcon /> : <ArrowIcon />;
}

export function TomorrowBadge() {
  return (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/15 text-ink"
      aria-hidden
    >
      <MoonIcon size={11} />
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MoonIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 14.3A9 9 0 1 1 9.7 3 7 7 0 0 0 21 14.3z" />
    </svg>
  );
}
