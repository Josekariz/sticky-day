import Link from "next/link";
import { LandingNote } from "@/components/marketing/LandingNote";
import { AccountGoneNote } from "@/components/marketing/AccountGoneNote";

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-8">
      {deleted === "1" && <AccountGoneNote />}
      <LandingNote />
      <Link href="/about" className="text-sm text-fg-soft underline-offset-4 hover:underline">
        Wanna know more?
      </Link>
    </main>
  );
}
