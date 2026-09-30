import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, capacity_minutes")
    .eq("id", userId)
    .maybeSingle();

  const googleName: string = user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "";
  const displayName: string = (profile?.display_name as string | null | undefined)?.trim() || googleName;
  const capacityMinutes: number = (profile?.capacity_minutes as number | null | undefined) ?? 360;
  const avatar: string | null = user?.user_metadata.avatar_url ?? null;
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold">Profile</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-fg text-lg font-semibold text-bg">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : initials}
          </div>
          <div>
            <div className="font-semibold">{displayName}</div>
            <div className="text-sm text-fg-soft">{user?.email}</div>
          </div>
        </div>

        <ProfileForm
          userId={userId}
          displayName={displayName}
          capacityMinutes={capacityMinutes}
        />
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-frame bg-surface p-6">
        <div>
          <div className="font-semibold">Sign out</div>
          <div className="text-sm text-fg-soft">You can sign back in with Google any time.</div>
        </div>
        <SignOutButton />
      </section>
    </main>
  );
}
