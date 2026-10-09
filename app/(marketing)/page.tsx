import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInNote } from "@/components/marketing/SignInNote";
import { AccountGoneNote } from "@/components/marketing/AccountGoneNote";
import { GuestBoard } from "@/components/board/GuestBoard";

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/board");

  const { deleted } = await searchParams;

  return (
    <main className="flex w-full flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pr-14">
        <h1 className="font-hand text-5xl font-bold leading-none">Sticky Day</h1>
        <p className="text-sm text-fg-soft">
          Type what you hope to get done. It becomes sticky notes.{" "}
          <a href="#sign-in" className="font-semibold text-fg underline underline-offset-4">
            Sign in to keep them
          </a>
        </p>
      </header>
      {deleted === "1" && <AccountGoneNote />}
      <GuestBoard signIn={<SignInNote />} />
      <footer className="flex items-center justify-center gap-3 text-sm text-fg-soft">
        <Link href="/about" className="underline-offset-4 hover:underline">
          Wanna know more?
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
