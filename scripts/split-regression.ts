/**
 * Split prompt regression — soft intent checks, not exact titles.
 * Usage: npm run split:regression
 */
import { withFallback } from "../lib/ai/model";
import { splitDay } from "../lib/ai/tasks/split";
import { SPLIT_REGRESSION } from "../lib/ai/tasks/split.regression";

const CAPACITY = 360;

async function runCase(c: (typeof SPLIT_REGRESSION)[number], attempt = 1): Promise<boolean> {
  process.stdout.write(
    `${attempt > 1 ? "  retry…\n" : ""}\n▸ ${c.id}\n  dump: ${JSON.stringify(c.dump)}\n  want: ${c.want}\n`,
  );
  try {
    const result = await withFallback((model) => splitDay(model, c.dump, CAPACITY));
    const notes = result.notes.map((n) => `${n.title} (${n.estMinutes}m, ${n.energy})`).join("\n       ");
    process.stdout.write(`  notes: ${result.notes.length ? `\n       ${notes}` : "(none)"}\n`);
    process.stdout.write(`  warning: ${result.warning?.trim() ? result.warning : "(null)"}\n`);
    const err = c.check(result);
    if (err) {
      if (attempt < 2) {
        process.stdout.write(`  soft-fail: ${err}\n`);
        return runCase(c, attempt + 1);
      }
      process.stdout.write(`  FAIL: ${err}\n`);
      return false;
    }
    process.stdout.write(`  PASS\n`);
    return true;
  } catch (e) {
    if (attempt < 2) {
      process.stdout.write(`  soft-fail: ${e instanceof Error ? e.message : e}\n`);
      return runCase(c, attempt + 1);
    }
    process.stdout.write(`  FAIL: ${e instanceof Error ? e.message : e}\n`);
    return false;
  }
}

async function main() {
  let failed = 0;
  for (const c of SPLIT_REGRESSION) {
    const ok = await runCase(c);
    if (!ok) failed += 1;
  }
  process.stdout.write(`\n${failed === 0 ? "All passed." : `${failed} failed.`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
