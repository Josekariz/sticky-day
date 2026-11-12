import { z } from "zod";
import { SplitResultSchema } from "./split";

const ExampleDaySchema = z.object({
  label: z.string(),
  dump: z.string(),
  result: SplitResultSchema,
});
export type ExampleDay = z.infer<typeof ExampleDaySchema>;

/** What the AI made of three brain dumps. Regenerate with scripts/make-examples.ts. */
export const EXAMPLE_DAYS: ExampleDay[] = z.array(ExampleDaySchema).parse([
  {
    label: "A work day",
    dump: "finish the Q3 report slides before the 2pm review, reply to Amina about the invoice, standup at 10, fix the login bug QA flagged, book flights for the Mombasa trip",
    result: {
      notes: [
        { title: "Finish Q3 report slides", detail: "Deadline: 2pm review", priority: "high" },
        { title: "Attend standup", detail: "Scheduled for 10:00", priority: "high" },
        { title: "Fix login bug", detail: "Flagged by QA", priority: "high" },
        { title: "Reply to Amina about the invoice", detail: "", priority: "medium" },
        { title: "Book flights", detail: "For the Mombasa trip", priority: "medium" },
      ],
      warning: null,
    },
  },
  {
    label: "A Saturday",
    dump: "laundry, go to the market for veggies and eggs, call mum, then gym in the evening. maybe start that book Kevo lent me",
    result: {
      notes: [
        { title: "Do laundry", detail: "Wash clothes.", priority: "medium" },
        { title: "Go to the market", detail: "Buy vegetables and eggs.", priority: "medium" },
        { title: "Call mum", detail: "Phone call to mother.", priority: "medium" },
        { title: "Gym", detail: "Workout session.", priority: "medium" },
        { title: "Start reading Kevo's book", detail: "Read the book lent by Kevo.", priority: "low" },
      ],
      warning: null,
    },
  },
  {
    label: "A messy one",
    dump: "nikuje kwa bank kudeposit cheque, pay kplc tokens, ex for 30 mins, sort out ma emails n reply boss, cook supper",
    result: {
      notes: [
        { title: "Deposit cheque at bank", detail: "Go to the bank to deposit the cheque.", priority: "high" },
        { title: "Buy KPLC tokens", detail: "Pay for electricity tokens.", priority: "high" },
        { title: "Exercise", detail: "Work out for 30 minutes.", priority: "medium" },
        { title: "Sort emails and reply to boss", detail: "Go through emails and send the necessary response to the boss.", priority: "high" },
        { title: "Cook supper", detail: "Prepare and cook dinner.", priority: "medium" },
      ],
      warning: null,
    },
  },
]);
