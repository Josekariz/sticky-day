import type { SplitResult } from "./split";

/**
 * Intent checks for the split prompt — not exact titles (models drift).
 * Dumps must stay out of the SYSTEM prompt so the rules carry the behaviour.
 * Re-run after any SYSTEM change: `npm run split:regression`
 */
export type SplitRegressionCase = {
  id: string;
  dump: string;
  /** Human-readable expected shape, for the report. */
  want: string;
  check: (r: SplitResult) => string | null; // null = pass, else failure reason
};

function titles(r: SplitResult): string {
  return r.notes.map((n) => n.title).join(" · ");
}

function blob(r: SplitResult): string {
  return r.notes.map((n) => `${n.title} ${n.detail}`).join(" ");
}

function has(r: SplitResult, re: RegExp): boolean {
  return r.notes.some((n) => re.test(n.title) || re.test(n.detail));
}

export const SPLIT_REGRESSION: SplitRegressionCase[] = [
  {
    id: "typo-dog",
    dump: "walk the dg",
    want: "one note; dog fixed quietly",
    check: (r) => {
      if (r.notes.length !== 1) return `expected 1 note, got ${r.notes.length}: ${titles(r)}`;
      if (!/dog/i.test(r.notes[0].title)) return `expected "dog" in title, got "${r.notes[0].title}"`;
      if (/\bdg\b/i.test(r.notes[0].title)) return `typo "dg" left in title: "${r.notes[0].title}"`;
      return null;
    },
  },
  {
    id: "shorthand-then",
    dump: "txt mum n dad then email sam",
    want: "two notes (then → split); text parents + email Sam",
    check: (r) => {
      if (r.notes.length < 2) return `expected ≥2 notes for "then", got ${r.notes.length}: ${titles(r)}`;
      if (r.notes.length > 3) return `expected ≤3 notes, got ${r.notes.length}: ${titles(r)}`;
      if (!has(r, /mum|mom|dad|parent|text|txt|message/i)) {
        return `missing text-parents note: ${titles(r)}`;
      }
      if (!has(r, /email|sam/i)) return `missing email-Sam note: ${titles(r)}`;
      return null;
    },
  },
  {
    id: "gibberish",
    dump: "qwertyuiop",
    want: "empty notes + kind warning",
    check: (r) => {
      if (r.notes.length !== 0) return `expected 0 notes, got ${titles(r)}`;
      if (!r.warning?.trim()) return "expected a warning";
      return null;
    },
  },
  {
    id: "greeting",
    dump: "hey",
    want: "empty notes + kind warning",
    check: (r) => {
      if (r.notes.length !== 0) return `expected 0 notes, got ${titles(r)}`;
      if (!r.warning?.trim()) return "expected a warning";
      return null;
    },
  },
  {
    id: "swahili-keep-then-run",
    dump: "nenda sokoni ununue maji, then run",
    want: "Swahili shopping note kept in language + run (then → split)",
    check: (r) => {
      if (r.notes.length < 2) return `expected ≥2 notes, got ${r.notes.length}: ${titles(r)}`;
      const swahili = r.notes.some((n) =>
        /sokoni|maji|nenda|ununue|nunua/i.test(`${n.title} ${n.detail}`),
      );
      if (!swahili) return `expected Swahili kept in a title/detail: ${titles(r)}`;
      if (!has(r, /run/i)) return `missing run: ${titles(r)}`;
      return null;
    },
  },
  {
    id: "typo-invoice",
    dump: "snd the invoce 2moro",
    want: "one note; send/invoice sense; tomorrow timing",
    check: (r) => {
      if (r.notes.length < 1) return `expected ≥1 note, got none (warning: ${r.warning})`;
      if (r.notes.length > 2) return `expected ≤2 notes, got ${titles(r)}`;
      const text = blob(r);
      if (!/send|snd|invoice|invoce/i.test(text)) return `missing send/invoice sense: ${titles(r)}`;
      if (/snd/i.test(r.notes[0].title) && !/send/i.test(r.notes[0].title)) {
        return `expected quiet typo fix in "${r.notes[0].title}"`;
      }
      if (/invoce/i.test(r.notes[0].title) && !/invoice/i.test(r.notes[0].title)) {
        return `expected quiet typo fix in "${r.notes[0].title}"`;
      }
      return null;
    },
  },
  {
    id: "market-cousins",
    dump:
      "i want to go tothe mkt and get swaet pants and do my gorcery shopping cook supper then go visit my lil cousins",
    want: "3–4 notes: market/sweatpants, groceries, supper, cousins",
    check: (r) => {
      if (r.notes.length < 3) return `expected ≥3 notes, got ${r.notes.length}: ${titles(r)}`;
      if (r.notes.length > 4) return `expected ≤4 notes, got ${r.notes.length}: ${titles(r)}`;
      const text = blob(r);
      if (!/market|mkt|sweat\s*pants|swaet/i.test(text)) {
        return `missing market/sweatpants: ${titles(r)}`;
      }
      if (!/groc|shop/i.test(text)) return `missing groceries: ${titles(r)}`;
      if (!/supper|cook|dinner/i.test(text)) return `missing supper: ${titles(r)}`;
      if (!/cousin/i.test(text)) return `missing cousins: ${titles(r)}`;
      return null;
    },
  },
];
