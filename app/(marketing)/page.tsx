import Link from "next/link";
import { LandingNote } from "@/components/marketing/LandingNote";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LandingPage() {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-8">
      <div className="fixed right-6 top-6">
        <ThemeToggle />
      </div>
      <LandingNote />
      <Link href="/about" className="text-sm text-fg-soft underline-offset-4 hover:underline">
        Wanna know more?
      </Link>
    </main>
  );
}
