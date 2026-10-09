import Link from "next/link";
import { AboutNote } from "@/components/marketing/AboutNote";

const LAST_UPDATED = "5 October 2026";

const linkClass = "font-semibold underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <main className="flex w-full max-w-4xl flex-col gap-8">
      <Link href="/" className="self-start text-sm text-fg-soft underline-offset-4 hover:underline">
        ← Back
      </Link>
      <h1 className="sr-only">Privacy</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <AboutNote title="What we keep" color="yellow" rotation={-2}>
          <p>Your email to sign you in, plus your name and picture if you use Google, to say hello.</p>
          <p>Every note you write, with when you started and finished it.</p>
          <p>Your timezone, display name and the time you want your daily summary.</p>
          <p>
            A short log of each AI call: the first 80 characters of what you typed, which model
            answered and how long it took. It’s there so I can fix things when they break, and it’s
            deleted after 30 days.
          </p>
          <p>
            Messages sent through Say hi: your name, the message, and your email if you give one. They’re
            stored and emailed to me. A scrambled (hashed) form of your IP address is stored with them to
            stop spam, never the address itself.
          </p>
          <p>Nothing else. No analytics, no ads, no tracking.</p>
        </AboutNote>

        <AboutNote title="Who can see it" color="sky" rotation={2} delay={0.1}>
          <p>
            The database lives at Supabase, in Ireland (AWS eu-west-1). The app runs on Vercel. I’m
            Joseph, I run this copy, and I can read the database.
          </p>
          <p>
            What you type is sent to an AI model to be split into notes and summarised. Right now
            that’s Google’s Gemini first, with Groq as backup.
          </p>
          <p>
            Google’s free-tier terms say they may use what’s sent to improve their products, and that
            human reviewers may read it, de-identified. Groq’s terms say they don’t train on it and
            keep requests for up to 30 days.
          </p>
          <p>
            If that’s not okay with you, see “Your own key” under Your choices. Or don’t put anything
            in a note you wouldn’t want read.
          </p>
        </AboutNote>

        <AboutNote title="Where it’s meant to be used" color="mint" rotation={-1} delay={0.2}>
          <p>
            Because of Google’s free-tier terms, this hosted version is for people outside the EEA,
            the UK and Switzerland for now.
          </p>
          <p>If you’re there, run your own copy, or wait for your own key.</p>
        </AboutNote>

        <AboutNote title="Your choices" color="lavender" rotation={1} delay={0.3}>
          <p>
            <Link href="/profile" className={linkClass}>Delete account</Link> on the Profile page
            removes everything, right away. No email needed.
          </p>
          <p>
            The code is open source. The{" "}
            <a href="https://github.com/Josekariz/sticky-day#running-it-yourself" className={linkClass}>README</a>{" "}
            explains how to run your own copy with your own keys. Then none of the above applies to
            anyone but you.
          </p>
          <p>
            <strong>Your own key</strong> is coming: add your own Gemini, Groq or other key, and your
            notes go only to the provider you chose, under your account’s terms, never through the
            shared key.
          </p>
          <p>
            Questions? The <Link href="/about" className={linkClass}>Say hi</Link> note on the About
            page reaches me.
          </p>
        </AboutNote>
      </div>

      <p className="text-sm text-fg-soft">Last updated: {LAST_UPDATED}</p>
    </main>
  );
}
