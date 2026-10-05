import Link from "next/link";
import { LandingNote } from "@/components/marketing/LandingNote";
import { AccountGoneNote } from "@/components/marketing/AccountGoneNote";

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-8">
      {deleted === "1" && <AccountGoneNote />}
      <LandingNote />
      <footer className="flex items-center gap-3 text-sm text-fg-soft">
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
