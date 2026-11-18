/**
 * Mock checks for Your day unread routing + copy helpers (no DB / network).
 * Usage: npm run summary:unread-check
 */
import assert from "node:assert/strict";
import { greetingFor, greetingWithName, storyYouHeading } from "../lib/core/date";
import { DUMP_PLACEHOLDERS, pickDumpPlaceholder } from "../lib/core/dumpPlaceholder";
import {
  isUnreadLetter,
  pickSummaryDay,
  resolveSummaryDate,
  unreadYourDayHref,
} from "../lib/summary/unread";

const TODAY = "2026-11-18";
const YESTERDAY = "2026-11-17";
const OLDER = "2026-11-15"; // Sunday-ish distance from Wed in the story

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

check("href: always /summary", () => {
  assert.equal(
    unreadYourDayHref({
      todayUnread: false,
      yesterdayUnread: true,
      yesterday: YESTERDAY,
    }),
    "/summary",
  );
  assert.equal(unreadYourDayHref(), "/summary");
});

check("pick: yesterday unread → yesterday", () => {
  assert.equal(
    pickSummaryDay({
      today: TODAY,
      yesterday: YESTERDAY,
      todayUnread: false,
      yesterdayUnread: true,
    }),
    YESTERDAY,
  );
});

check("pick: today unread wins", () => {
  assert.equal(
    pickSummaryDay({
      today: TODAY,
      yesterday: YESTERDAY,
      todayUnread: true,
      yesterdayUnread: true,
    }),
    TODAY,
  );
});

check("pick: after yesterday read → today", () => {
  assert.equal(
    pickSummaryDay({
      today: TODAY,
      yesterday: YESTERDAY,
      todayUnread: false,
      yesterdayUnread: false,
    }),
    TODAY,
  );
});

check("pick: ?day= override when valid", () => {
  assert.equal(
    pickSummaryDay({
      today: TODAY,
      yesterday: YESTERDAY,
      todayUnread: false,
      yesterdayUnread: false,
      dayParam: YESTERDAY,
    }),
    YESTERDAY,
  );
});

check("resolve: older than yesterday → today", () => {
  assert.equal(resolveSummaryDate(OLDER, TODAY, YESTERDAY), TODAY);
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

check("greeting: stable for same day+period", () => {
  const now = new Date("2026-11-18T09:00:00+03:00");
  assert.equal(greetingFor(now, "Africa/Nairobi"), greetingFor(now, "Africa/Nairobi"));
  assert.ok(greetingWithName(now, "Africa/Nairobi", "Qariz").includes("Qariz"));
});

check("dump placeholders: pool non-empty + pick", () => {
  assert.ok(DUMP_PLACEHOLDERS.length > 10);
  assert.ok(DUMP_PLACEHOLDERS.includes(pickDumpPlaceholder(() => 0) as typeof DUMP_PLACEHOLDERS[number]));
});

process.stdout.write(`\n${failed === 0 ? "All passed." : `${failed} failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
