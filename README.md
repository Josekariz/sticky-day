# Sticky Day

A whiteboard for your day. Type what you want to get done, and it becomes sticky notes. Work on up to three at a time, drop the finished ones in the tray, and at the end of the day the app writes you a short note about how it went.

Live at **https://sticky-day.vercel.app** — sign in with Google or email and you're on the board.

Built in Nairobi by [Joseph Macharia](https://github.com/Josekariz) as a way to learn how to build with AI models by making something worth using every day. The code is open.

---

## What it does

**Board.** One text box: *"What do you want to get done today?"* Write it the way you'd say it — *"reply to Sarah about the budget, 30 min run, water the plants, book the dentist"*. The AI splits that into sticky notes, each with a rough time and a priority (low, medium or high). They land on the board in random colours. Drag them around. If you've written more than fits in your day it tells you so, gently.

Pick a note up to edit it. Drag it to the clipboard to work on it — a timer starts, and only the newest one on the clipboard runs. Drag it to the Done tray when it's finished, or to the bin if it shouldn't have existed. The bin is restorable.

You can try the board on the landing page before signing in. There the splitting is a quick rule-based one in your browser (no AI, nothing sent anywhere), with three example days the AI made earlier. Sign in and the notes come with you.

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
- **Supabase** — Google + email auth, Postgres, row-level security
- **Vercel AI SDK** + Zod — `@ai-sdk/google`, `@ai-sdk/groq`
- **Resend** — optional (Say hi form + SMTP for Supabase auth mail)
- **Vercel** — hosting and cron

## Running it yourself

You need a [Supabase](https://supabase.com) project, at least one AI provider key, and Node 22+ (the AI SDK needs it). Google sign-in and email/password both work; you can enable one or both.

**Privacy.** What the hosted version keeps and who can see it is on the [privacy page](https://sticky-day.vercel.app/privacy). On Gemini's free tier, Google may use what's sent to improve its products, and human reviewers may read it, de-identified. Because of that, the hosted version is for people outside the EEA, UK and Switzerland for now; if you're there, run your own copy with your own keys.

### Quick start

```bash
git clone https://github.com/Josekariz/sticky-day
cd sticky-day
npm install
cp .env.example .env        # fill the Required block — see below
npx supabase link --project-ref <your-project-ref>
npx supabase db push        # creates the tables, policies and functions
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Finish the Supabase auth steps below before sign-in will work.

### Environment variables

Copy [`.env.example`](.env.example). Only the **Required** block is needed to boot the app.

#### Required

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key. Never the service role. |
| `AI_ORDER` | Comma-separated `provider:model` list tried in order, e.g. `groq:…,google:…` |
| `GOOGLE_API_KEY` and/or `GROQ_API_KEY` | At least one key matching a provider in `AI_ORDER` |

#### Optional — Say hi contact form

Without these, the form still saves the message in the database; email delivery is skipped.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | [Resend API key](https://resend.com/api-keys) — used only by `/api/contact` |
| `CONTACT_TO` | Inbox that receives Say hi messages |
| `CONTACT_FROM` | Sender address. Default `onboarding@resend.dev` only reaches your own Resend account until you [verify a domain](https://resend.com/docs/dashboard/domains/introduction) |

`RESEND_API_KEY` does **not** send password-reset or signup emails. Those go through Supabase Auth (see Auth emails below).

#### Optional — nightly Your day cron (production)

Used by `/api/cron/summaries` (schedule in `vercel.json`). Without them, summaries still run when a signed-in user opens the app after their summary time.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role`. Server-only. Never `NEXT_PUBLIC_`. |
| `CRON_SECRET` | Random string; Vercel sends `Authorization: Bearer <CRON_SECRET>` |
| `SUMMARY_CRON_SINCE` | Optional `YYYY-MM-DD` floor so cron never backfills older days |
| `CRON_DRY_RUN` | Set to `1` to log planned actions without writing |

### Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you don't have it.
3. From the repo: `npx supabase link --project-ref <ref>` then `npx supabase db push` so every file in `supabase/migrations/` is applied in order.

### Auth setup

All of this lives in the Supabase dashboard, not in `.env`.

#### URL allow list

**Authentication → URL Configuration**

- **Site URL:** `http://localhost:3000` while developing; your production origin in prod.
- **Redirect URLs** (add all you use):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `https://<your-domain>/auth/callback`
  - `https://<your-domain>/auth/confirm`

Google OAuth uses `/auth/callback`. Email confirm and password-reset links use `/auth/confirm`.

#### Google sign-in

Follow Supabase's guide: [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

Short version: create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), put the client ID and secret into **Authentication → Providers → Google**, and add Supabase's callback URL that the provider page shows. Redirects back into this app go to `/auth/callback` (already in the allow list above).

#### Email / password and auth emails

Email sign-up, sign-in, and “Forgot password” are built in. Supabase sends those messages — not the app's Resend API key.

Supabase's built-in mailer is fine for a quick local try, but it rate-limits hard. For a real instance, set **Custom SMTP**:

1. [Custom SMTP in Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
2. Easiest path with Resend: [Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)

Then point the Auth email templates at this app's confirm route so links work in any browser (not only the one that requested the mail). Docs: [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates).

In **Authentication → Email Templates**, use a `token_hash` link. Examples:

**Confirm signup** (`type=signup`):

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

**Reset password** (`type=recovery`) — lands on the new-password screen:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset your password</a>
```

The app verifies the hash in `app/auth/confirm/route.ts`. Default Supabase templates that only send `?code=` still work in the same browser that started the flow, but `token_hash` is what you want for phone/mail clients.

### AI keys

You only need one provider for the app to work; two gives you a fallback when one is busy. Both have free tiers.

**Google Gemini**
1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key** (starts with `AIza`).
2. Paste it as `GOOGLE_API_KEY`.
3. Put one or more `google:…` models in `AI_ORDER`. Current names: [Gemini models](https://ai.google.dev/gemini-api/docs/models). They get renamed and retired; the free tier also has per-model daily limits, which is why the example lists more than one Flash model.

**Groq**
1. [console.groq.com/keys](https://console.groq.com/keys) → **Create API Key** (starts with `gsk_`).
2. Paste it as `GROQ_API_KEY`.
3. List models your account can actually call:

```bash
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY" | grep '"id"'
```

Pick one (or more) for `AI_ORDER` as `groq:<id>`.

**Rules for keys**
- They live in `.env`, which is gitignored. Never commit them. `.env.example` keeps the names with empty values.
- Never put AI keys, the service role, Resend, or `CRON_SECRET` behind `NEXT_PUBLIC_` — that ships them to the browser.
- If a key leaks (chat, screenshot, commit), revoke it on the provider and make a new one.
- On Vercel, set them under **Project → Settings → Environment Variables**. Guide: [Environment variables](https://vercel.com/docs/projects/environment-variables).

### Deploy on Vercel

1. Import the GitHub repo into [Vercel](https://vercel.com).
2. Add the same env vars (Required at minimum; contact + cron if you want those).
3. Set production **Site URL** and redirect allow list in Supabase to your Vercel domain.
4. Add the production origin to the Google OAuth client’s authorized redirect URIs if you use Google.
5. For the nightly summary job: set `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`. The schedule is already in `vercel.json` (`0 21 * * *` UTC). See [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).

## How the code is laid out

```
app/(marketing)/   landing, about, privacy, no navbar
app/(app)/         board, calendar, summary, profile — one layout, session-guarded
app/api/ai/        the two AI routes (split, summarize), both check the session first
app/auth/          OAuth callback + email confirm / recovery
lib/core/          pure logic: types, placement, rollover, dates, themes. No React, no Next.
lib/ai/            model.ts (the only file that knows providers) and the two tasks
lib/supabase/      browser, server, and admin (cron) clients
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
