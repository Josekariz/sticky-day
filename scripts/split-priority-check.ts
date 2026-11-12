/**
 * Hit every configured model with a priority-only dump (no estimates).
 * Usage: npx tsx --env-file=.env.local scripts/split-priority-check.ts
 */
import { getModelChain } from "../lib/ai/model";
import { splitDay } from "../lib/ai/tasks/split";
import { SplitResultSchema } from "../lib/core/split";

const DUMP =
  "urgent: call the landlord about the leak before noon, then email Sam the invoice, " +
  "maybe start reading that book if there's time, and buy milk on the way home";

const WANT = {
  // Soft intent — models drift on exact titles.
  minNotes: 3,
  maxNotes: 5,
  needHigh: /landlord|leak|call/i,
  needMedium: /email|sam|invoice|milk|buy/i,
  needLow: /book|read/i,
};

const PER_MODEL_MS = 20_000;

async function runOne(modelId: string, model: Parameters<typeof splitDay>[0]): Promise<boolean> {
  process.stdout.write(`\n▸ ${modelId}\n`);
  try {
    const raw = await splitDay(model, DUMP, { abortSignal: AbortSignal.timeout(PER_MODEL_MS) });
    const parsed = SplitResultSchema.safeParse(raw);
    if (!parsed.success) {
      process.stdout.write(`  FAIL: schema — ${parsed.error.message}\n`);
      return false;
    }
    const result = parsed.data;

    // Estimates must be gone from the AI contract.
    const sneaky = JSON.stringify(result);
    if (/estMinutes|est_minutes|estimate|minutesAvailable|capacity/i.test(sneaky)) {
      process.stdout.write(`  FAIL: response still mentions estimates/capacity\n`);
      return false;
    }

    for (const n of result.notes) {
      if (!["low", "medium", "high"].includes(n.priority)) {
        process.stdout.write(`  FAIL: bad priority on "${n.title}": ${n.priority}\n`);
        return false;
      }
      if ("estMinutes" in n) {
        process.stdout.write(`  FAIL: note still has estMinutes: ${n.title}\n`);
        return false;
      }
    }

    const lines = result.notes.map((n) => `       ${n.title} [${n.priority}]`).join("\n");
    process.stdout.write(`  notes (${result.notes.length}):\n${lines || "       (none)"}\n`);
    process.stdout.write(`  warning: ${result.warning?.trim() || "(null)"}\n`);

    if (result.notes.length < WANT.minNotes || result.notes.length > WANT.maxNotes) {
      process.stdout.write(
        `  FAIL: expected ${WANT.minNotes}–${WANT.maxNotes} notes, got ${result.notes.length}\n`,
      );
      return false;
    }

    const blob = result.notes.map((n) => `${n.title} ${n.detail}`).join(" ");
    if (!WANT.needHigh.test(blob)) {
      process.stdout.write(`  FAIL: missing landlord/leak task\n`);
      return false;
    }
    if (!WANT.needMedium.test(blob)) {
      process.stdout.write(`  FAIL: missing email/Sam or milk task\n`);
      return false;
    }
    if (!WANT.needLow.test(blob)) {
      process.stdout.write(`  FAIL: missing book/read task\n`);
      return false;
    }

    const high = result.notes.find((n) => WANT.needHigh.test(`${n.title} ${n.detail}`));
    const low = result.notes.find((n) => WANT.needLow.test(`${n.title} ${n.detail}`));
    if (high && high.priority !== "high") {
      process.stdout.write(`  FAIL: landlord/leak should be high, got ${high.priority}\n`);
      return false;
    }
    if (low && low.priority === "high") {
      process.stdout.write(`  FAIL: book should not be high, got ${low.priority}\n`);
      return false;
    }

    process.stdout.write(`  PASS\n`);
    return true;
  } catch (e) {
    process.stdout.write(`  FAIL: ${e instanceof Error ? e.message : e}\n`);
    return false;
  }
}

async function main() {
  const chain = getModelChain();
  if (chain.length === 0) {
    process.stdout.write("No AI provider configured (AI_ORDER + keys).\n");
    process.exit(1);
  }
  process.stdout.write(`Models in chain: ${chain.map((m) => m.modelId).join(", ")}\n`);
  process.stdout.write(`Dump: ${DUMP}\n`);

  let failed = 0;
  // Dedupe by modelId so we only test each model once even if listed twice.
  const seen = new Set<string>();
  for (const { model, modelId } of chain) {
    if (seen.has(modelId)) continue;
    seen.add(modelId);
    const ok = await runOne(modelId, model);
    if (!ok) failed += 1;
  }

  process.stdout.write(`\n${failed === 0 ? "All models passed." : `${failed} model(s) failed.`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
