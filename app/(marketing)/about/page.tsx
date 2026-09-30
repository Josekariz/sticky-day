import Link from "next/link";
import { AboutNote } from "@/components/marketing/AboutNote";
import { ContactNote } from "@/components/marketing/ContactNote";

export default function AboutPage() {
  return (
    <main className="flex w-full max-w-4xl flex-col gap-8">
      <Link href="/" className="self-start text-sm text-fg-soft underline-offset-4 hover:underline">
        ← Back
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <AboutNote title="Why" color="yellow" rotation={-2}>
          <p>Every day I have to report at standup, and that means writing things down somewhere. I didn’t want something as bloated as Notion just to track what I do and keep my ideas.</p>
          <p>So I built a tiny Notion, or Trello: somewhere to organise my things or just jot down random ideas, which then get turned into tasks.</p>
        </AboutNote>

        <AboutNote title="How" color="sky" rotation={2} delay={0.1}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Type what you hope to get done today.</li>
            <li>It becomes sticky notes on your board, sized to fit the day.</li>
            <li>Pick one. Work on it. Only one at a time.</li>
            <li>Done? Into the bin. At the end of the day, the bin tells you how it went.</li>
          </ol>
        </AboutNote>

        <AboutNote title="Who" color="mint" rotation={-1} delay={0.2}>
          <p>Built by Joseph Macharia in Nairobi, as a way to learn how to build with AI models by making something worth using every day.</p>
          <p>
            The code is open. <a href="https://github.com/Josekariz/sticky-day" className="font-semibold underline underline-offset-2">See it on GitHub.</a>
          </p>
        </AboutNote>

        <ContactNote />
      </div>
    </main>
  );
}
