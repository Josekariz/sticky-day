/**
 * Mock checks for Your day unread routing (no DB / network).
 * Usage: npm run summary:unread-check
 */
import assert from "node:assert/strict";
import {
  isUnreadLetter,
  resolveSummaryDate,
  unreadYourDayHref,
} from "../lib/summary/unread";

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

check("unread letter: garbage summary", () => {
  assert.equal(isUnreadLetter({ nope: true }, null), false);
});

check("href: only yesterday unread → /summary?day=yesterday", () => {
  assert.equal(
    unreadYourDayHref({
      todayUnread: false,
      yesterdayUnread: true,
      yesterday: YESTERDAY,
    }),
    `/summary?day=${YESTERDAY}`,
  );
});

check("href: today unread wins → /summary", () => {
  assert.equal(
    unreadYourDayHref({
      todayUnread: true,
      yesterdayUnread: true,
      yesterday: YESTERDAY,
    }),
    "/summary",
  );
});

check("href: nothing unread → /summary", () => {
  assert.equal(
    unreadYourDayHref({
      todayUnread: false,
      yesterdayUnread: false,
      yesterday: YESTERDAY,
    }),
    "/summary",
  );
});

check("href: never points at calendar", () => {
  const href = unreadYourDayHref({
    todayUnread: false,
    yesterdayUnread: true,
    yesterday: YESTERDAY,
  });
  assert.ok(!href.includes("/calendar"), href);
  assert.ok(href.startsWith("/summary"), href);
});

check("resolve: ?day=yesterday opens yesterday", () => {
  assert.equal(resolveSummaryDate(YESTERDAY, TODAY, YESTERDAY), YESTERDAY);
});

check("resolve: ?day=today opens today", () => {
  assert.equal(resolveSummaryDate(TODAY, TODAY, YESTERDAY), TODAY);
});

check("resolve: missing day → today", () => {
  assert.equal(resolveSummaryDate(undefined, TODAY, YESTERDAY), TODAY);
});

check("resolve: older than yesterday → today (reject)", () => {
  assert.equal(resolveSummaryDate(OLDER, TODAY, YESTERDAY), TODAY);
});

check("resolve: junk → today", () => {
  assert.equal(resolveSummaryDate("not-a-date", TODAY, YESTERDAY), TODAY);
});

check("resolve: future day → today", () => {
  assert.equal(resolveSummaryDate("2026-11-19", TODAY, YESTERDAY), TODAY);
});

process.stdout.write(`\n${failed === 0 ? "All passed." : `${failed} failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
