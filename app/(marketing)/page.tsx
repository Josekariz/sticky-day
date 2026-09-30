import Link from "next/link";
import { LandingNote } from "@/components/marketing/LandingNote";

export default function LandingPage() {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-8">
      <LandingNote />
      <Link href="/about" className="text-sm text-fg-soft underline-offset-4 hover:underline">
        Wanna know more?
      </Link>
    </main>
  );
}
