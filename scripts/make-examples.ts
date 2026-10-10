/**
 * Prints what the real model makes of each example day, for pasting into lib/core/examples.ts.
 * Usage: npx tsx --env-file=.env scripts/make-examples.ts [label]
 */
import { withFallback } from "../lib/ai/model";
import { splitDay } from "../lib/ai/tasks/split";
import { EXAMPLE_DAYS } from "../lib/core/examples";

// Same second try as /api/ai/split when the first model finds nothing.
const EMPTY_RETRY_HINT = "This is a real to-do list, possibly with typos. Extract the tasks.";

async function main() {
  const only = process.argv[2];
  for (const e of EXAMPLE_DAYS) {
    if (only && e.label !== only) continue;
    let usedModelId = "";
    let result = await withFallback(async (model, modelId) => {
      usedModelId = modelId;
      return splitDay(model, e.dump, 360);
    });
    if (result.notes.length === 0) {
      result = await withFallback((model) => splitDay(model, e.dump, 360, { hint: EMPTY_RETRY_HINT }), undefined, {
        skipModelId: usedModelId,
      });
    }
    process.stdout.write(`\n// ${e.label}\n${JSON.stringify(result, null, 2)}\n`);
  }
}

main();
