import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDisplayName } from "@/lib/core/name";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ProfileIdentity } from "@/components/profile/ProfileIdentity";
import { PasswordCard } from "@/components/profile/PasswordCard";
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = resolveDisplayName(
    profile?.display_name as string | null | undefined,
    user?.user_metadata ?? {},
    user?.email,
  );
  const avatar: string | null = user?.user_metadata.avatar_url ?? null;
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold">Profile</h1>

      <ProfileIdentity
        userId={user.id}
        displayName={displayName}
        email={user?.email ?? ""}
        avatar={avatar}
        initials={initials}
      />

      <PasswordCard email={user?.email ?? ""} />

      <section className="flex items-center justify-between rounded-2xl border border-frame bg-surface p-6">
        <div>
          <div className="font-semibold">Sign out</div>
          <div className="text-sm text-fg-soft">You can sign back in any time.</div>
        </div>
        <SignOutButton />
      </section>

      <DeleteAccountCard email={user?.email ?? ""} />

      <p className="text-sm text-fg-soft">
        What Sticky Day keeps and who can see it:{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
      </p>
    </main>
  );
}
