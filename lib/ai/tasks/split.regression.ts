import type { SplitResult } from "./split";

/**
 * Intent checks for the split prompt — not exact titles (models drift).
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

function has(r: SplitResult, re: RegExp): boolean {
  return r.notes.some((n) => re.test(n.title) || re.test(n.detail));
}

export const SPLIT_REGRESSION: SplitRegressionCase[] = [
  {
    id: "typo-cow",
    dump: "milk the cwo",
    want: "one note; cow fixed quietly; no empty warning needed",
    check: (r) => {
      if (r.notes.length !== 1) return `expected 1 note, got ${r.notes.length}: ${titles(r)}`;
      if (!/cow/i.test(r.notes[0].title)) return `expected "cow" in title, got "${r.notes[0].title}"`;
      if (/cwo/i.test(r.notes[0].title)) return `typo "cwo" left in title: "${r.notes[0].title}"`;
      return null;
    },
  },
  {
    id: "shorthand-then",
    dump: "buy mlk n bread then call jhon",
    want: "two notes (then → split); milk+bread together; John fixed",
    check: (r) => {
      if (r.notes.length < 2) return `expected ≥2 notes for "then", got ${r.notes.length}: ${titles(r)}`;
      if (r.notes.length > 3) return `expected ≤3 notes, got ${r.notes.length}: ${titles(r)}`;
      const shop = r.notes.some(
        (n) => /milk|mlk|bread/i.test(n.title) || /milk|bread/i.test(n.detail),
      );
      if (!shop) return `missing shopping note: ${titles(r)}`;
      if (!has(r, /john|jhon|call/i)) return `missing call-John note: ${titles(r)}`;
      // Prefer quiet John fix when confident
      const call = r.notes.find((n) => /john|jhon|call/i.test(n.title));
      if (call && /jhon/i.test(call.title) && !/john/i.test(call.title)) {
        return `expected John typo fix in "${call.title}"`;
      }
      return null;
    },
  },
  {
    id: "gibberish",
    dump: "asdfgh",
    want: "empty notes + kind warning",
    check: (r) => {
      if (r.notes.length !== 0) return `expected 0 notes, got ${titles(r)}`;
      if (!r.warning?.trim()) return "expected a warning";
      return null;
    },
  },
  {
    id: "greeting",
    dump: "hi",
    want: "empty notes + kind warning",
    check: (r) => {
      if (r.notes.length !== 0) return `expected 0 notes, got ${titles(r)}`;
      if (!r.warning?.trim()) return "expected a warning";
      return null;
    },
  },
  {
    id: "swahili-then-gym",
    dump: "nunua unga na maziwa, then gym",
    want: "flour+milk shopping note + gym (then → split)",
    check: (r) => {
      if (r.notes.length < 2) return `expected ≥2 notes, got ${r.notes.length}: ${titles(r)}`;
      const shop = r.notes.some((n) =>
        /unga|flour|maziwa|milk|shop|buy|nunua/i.test(`${n.title} ${n.detail}`),
      );
      if (!shop) return `missing shopping/Swahili intent: ${titles(r)}`;
      if (!has(r, /gym/i)) return `missing gym: ${titles(r)}`;
      return null;
    },
  },
  {
    id: "typo-report",
    dump: "fnsh the rport b4 3",
    want: "one note; finish/report sense; before-3 in title or detail",
    check: (r) => {
      if (r.notes.length < 1) return `expected ≥1 note, got none (warning: ${r.warning})`;
      if (r.notes.length > 2) return `expected ≤2 notes, got ${titles(r)}`;
      const blob = r.notes.map((n) => `${n.title} ${n.detail}`).join(" ");
      if (!/finish|fnsh|report|rport/i.test(blob)) return `missing finish/report sense: ${titles(r)}`;
      if (!/before\s*3|b4\s*3|by\s*3|3\s*(pm|am)?/i.test(blob)) {
        return `expected before-3 timing in title/detail: ${blob.trim()}`;
      }
      if (/fnsh/i.test(r.notes[0].title) && !/finish/i.test(r.notes[0].title)) {
        return `expected quiet typo fix in "${r.notes[0].title}"`;
      }
      if (/rport/i.test(r.notes[0].title) && !/report/i.test(r.notes[0].title)) {
        return `expected quiet typo fix in "${r.notes[0].title}"`;
      }
      return null;
    },
  },
];
