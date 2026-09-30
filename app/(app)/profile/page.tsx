import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name: string = user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "";
  const avatar: string | null = user?.user_metadata.avatar_url ?? null;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-fg-soft">{user?.email}</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Display name</span>
          <input defaultValue={name} className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Hours available per day</span>
          <input type="number" defaultValue={6} min={1} max={16} className="h-11 w-28 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg" />
          <span className="text-xs text-fg-soft">The AI uses this to warn you when a day is overbooked.</span>
        </label>

        <button className="h-11 self-start rounded-xl bg-fg px-5 text-sm font-semibold text-bg">Save</button>
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
