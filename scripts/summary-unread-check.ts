/**
 * Mock checks for Recap nav + Your day copy helpers (no DB / network).
 * Usage: npm run summary:unread-check
 */
import assert from "node:assert/strict";
import { greetingFor, greetingWithName, storyYouHeading } from "../lib/core/date";
import { DUMP_PLACEHOLDERS, pickDumpPlaceholder } from "../lib/core/dumpPlaceholder";
import { isUnreadLetter, shouldShowRecap } from "../lib/summary/unread";

const TODAY = "2026-11-18";
const YESTERDAY = "2026-11-17";
const OLDER = "2026-11-15";

const letter = {
  story: "You moved a few stickies.",
  read: "Rest counts.",
  tomorrowNudge: "",
  carryOver: [] as string[],
  model: "test",
  createdAt: "2026-11-17T18:00:00.000Z",
  theme: "rest",
};

let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    process.stdout.write(`PASS  ${name}\n`);
  } catch (e) {
    failed += 1;
    process.stdout.write(`FAIL  ${name}\n  ${e instanceof Error ? e.message : e}\n`);
  }
}

check("unread letter: has summary + null read_at", () => {
  assert.equal(isUnreadLetter(letter, null), true);
});

check("unread letter: already read", () => {
  assert.equal(isUnreadLetter(letter, "2026-11-17T20:00:00.000Z"), false);
});

check("recap: show while yesterday unread", () => {
  assert.equal(shouldShowRecap(true), true);
});

check("recap: hide after yesterday read", () => {
  assert.equal(shouldShowRecap(false), false);
});

check("story: today → Today you…", () => {
  assert.equal(storyYouHeading(TODAY, TODAY), "Today you…");
});

check("story: yesterday → Yesterday you…", () => {
  assert.equal(storyYouHeading(YESTERDAY, TODAY), "Yesterday you…");
});

check("story: older → On weekday you… (not Yesterday)", () => {
  const h = storyYouHeading(OLDER, TODAY);
  assert.ok(h.startsWith("On "), h);
  assert.ok(h.endsWith(" you…"), h);
  assert.ok(!h.includes("Yesterday"), h);
});

check("greeting: period pool + name on refresh pick", () => {
  const now = new Date("2026-11-18T09:00:00+03:00");
  const g = greetingFor(now, "Africa/Nairobi", () => 0);
  assert.ok(g.length > 0);
  assert.ok(greetingWithName(now, "Africa/Nairobi", "Qariz", () => 0).includes("Qariz"));
});

check("dump placeholders: pool non-empty + pick", () => {
  assert.ok(DUMP_PLACEHOLDERS.length > 10);
  assert.ok(
    DUMP_PLACEHOLDERS.includes(pickDumpPlaceholder(() => 0) as (typeof DUMP_PLACEHOLDERS)[number]),
  );
});

process.stdout.write(`\n${failed === 0 ? "All passed." : `${failed} failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
