# Sticky Day

A whiteboard for your day. Type what you want to get done, and it becomes sticky notes. Work them one at a time, drop the finished ones in the tray, and at the end of the day the app writes you a short note about how it went.

Live at **https://sticky-day.vercel.app** — sign in with Google and you're on the board.

Built in Nairobi by [Joseph Macharia](https://github.com/Josekariz) as a way to learn how to build with AI models by making something worth using every day. The code is open.

---

## What it does

**Board.** One text box: *"What do you want to get done today?"* Write it the way you'd say it — *"reply to Sarah about the budget, 30 min run, water the plants, book the dentist"*. The AI splits that into sticky notes, each with a rough time and an energy level. They land on the board in random colours. Drag them around. If you've written more than fits in your day it tells you so, gently.

Pick a note up to edit it. Drag it to the clipboard to work on it — a timer starts, and only the newest one on the clipboard runs. Drag it to the Done tray when it's finished, or to the bin if it shouldn't have existed. The bin is restorable.

Whatever you don't finish rolls over to tomorrow's board by itself, with a small *"from Thursday"* stamp so you know it's been waiting.

**Calendar.** A month of small rings — each one is how much of that day got done. Click a day and a drawer slides in with what you finished, what you didn't, and the note the app wrote about it. Past days are read-only.

**Your day.** At a time you choose (6pm by default, in your timezone), the app writes a short page about your day: what you did, something to read on a rotating theme — *why writing it down makes it lighter*, *carrying something over is deciding, not failing*, *rest counts as a note* — and one concrete thought for tomorrow. It's written like a friend texting, not a report. No minutes, no percentages, no standup. There's a Copy button if you want the text.

That's the whole thing. Three pages.

## How the AI part works

There are exactly two AI calls in the app, and both follow the same shape:

1. The server builds a prompt from your text or your notes.
2. The model must answer in a fixed JSON shape (a [Zod](https://zod.dev) schema, via the [Vercel AI SDK](https://sdk.vercel.ai)'s `generateObject`). If the answer doesn't fit, it's rejected.
3. The app does the arithmetic — overbooking, totals, caps — in code. The model never does maths.

Models are tried in order from `AI_ORDER` in the environment (`provider:model,provider:model,…`). If the first one is down or rate-limited the next one is tried. Adding a provider is one `case` in `lib/ai/model.ts`. Right now it runs on free tiers from Google (Gemini) and Groq.

Each account gets 60 AI calls a day, counted in the database where the browser can't reset it.

Every model attempt is logged for debugging: the task, the model, how long it took, and the first 80 characters of what you typed. A nightly `pg_cron` job deletes log rows older than 30 days.

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind v4, Framer Motion
- **Supabase** — Google sign-in, Postgres, row-level security
- **Vercel AI SDK** + Zod — `@ai-sdk/google`, `@ai-sdk/groq`
- **Vercel** — hosting

## Running it yourself

You need a Supabase project with Google auth turned on, and at least one AI key.

**Privacy.** What the hosted version keeps and who can see it is on the [privacy page](https://sticky-day.vercel.app/privacy). On Gemini's free tier, Google may use what's sent to improve its products, and human reviewers may read it, de-identified. Because of that, the hosted version is for people outside the EEA, UK and Switzerland for now; if you're there, run your own copy with your own keys.

```bash
git clone https://github.com/Josekariz/sticky-day
cd sticky-day
npm install
cp .env.example .env        # fill it in — see below
npx supabase link --project-ref <your-project-ref>
npx supabase db push        # creates the tables, policies and functions
npm run dev
```

`.env`:

```
NEXT_PUBLIC_SUPABASE_URL=       # from Supabase → Project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # the anon key; never the service role key
AI_ORDER=groq:qwen/qwen3.8-27b,google:gemini-3.8-flash
GOOGLE_API_KEY=                 # aistudio.google.com/apikey
GROQ_API_KEY=                   # console.groq.com/keys
```

Google's client ID and secret go into Supabase (Authentication → Providers → Google), not into `.env`. Add `http://localhost:3000/auth/callback` and your production URL to the redirect list there.

### Getting the AI keys

Both are free. You only need one for the app to work; two gives you a fallback when one is busy.

**Google Gemini**
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with any Google account.
2. Click **Create API key**. It starts with `AIza`.
3. Paste it as `GOOGLE_API_KEY`.

The free tier has a daily request limit per model, which is why `AI_ORDER` lists more than one Gemini model — when `gemini-3.8-flash` says it's busy, the app falls through to the next one. Check [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) for the current model names; they get renamed and retired.

**Groq**
1. Go to [console.groq.com/keys](https://console.groq.com/keys) and sign up.
2. Click **Create API Key**. It starts with `gsk_`.
3. Paste it as `GROQ_API_KEY`.

Not every model on Groq's docs is on every account. To see which ones yours can use:

```bash
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY" | grep '"id"'
```

Pick one from that list for `AI_ORDER`.

**Rules for keys, in case you're new to this**
- They live in `.env`, which is gitignored. Never commit them. `.env.example` is the only file with these names in the repo, and its values are empty.
- Never prefix them with `NEXT_PUBLIC_` — that ships them to the browser.
- If you paste one into a chat, a screenshot or a commit, treat it as leaked: delete it on the provider's page and make a new one. It takes thirty seconds.
- On Vercel, add them under Project → Settings → Environment Variables, not in the code.

## How the code is laid out

```
app/(marketing)/   landing, about, privacy, no navbar
app/(app)/         board, calendar, summary, profile — one layout, session-guarded
app/api/ai/        the two AI routes (split, summarize), both check the session first
lib/core/          pure logic: types, placement, rollover, dates, themes. No React, no Next.
lib/ai/            model.ts (the only file that knows providers) and the two tasks
lib/supabase/      browser and server clients
components/        board, calendar, summary, nav — props in, callbacks out; state lives in useBoard
supabase/migrations/   the schema, in order. Run with `supabase db push`.
```

The rules the code follows are in [`.cursor/rules/architecture.mdc`](.cursor/rules/architecture.mdc). The short version:

- `lib/core` is pure and testable.
- AI keys exist only on the server. Nothing with a key is ever `NEXT_PUBLIC_`.
- Row-level security is the real security. Every query still names `user_id` anyway.
- Only today is writable, enforced in the database, in *your* timezone.
- Model output is validated before it touches anything. No casting.
- Note positions are fractions of the board, never pixels, so the board works at any size.

## What's next

- Bring your own key — keys stored encrypted per account, so the app doesn't depend on one person's free tier.
- A proper phone pass.
- Whatever using it every day turns up. If you try it and something feels off, the about page has a note you can write on.

## License

MIT
