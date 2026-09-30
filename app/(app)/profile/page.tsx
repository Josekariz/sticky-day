export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold">Profile</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-fg text-lg font-semibold text-bg">JM</div>
          <div>
            <div className="font-semibold">Joseph Macharia</div>
            <div className="text-sm text-fg-soft">sejokariz@gmail.com</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Display name</span>
          <input defaultValue="Joseph" className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg" />
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
        <button className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold text-danger">Sign out</button>
      </section>
    </main>
  );
}