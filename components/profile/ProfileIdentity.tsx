"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ProfileIdentity({
  userId,
  displayName,
  email,
  avatar,
  initials,
}: {
  userId: string;
  displayName: string;
  email: string;
  avatar: string | null;
  initials: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = name.trim() !== displayName.trim();

  useEffect(() => {
    if (!editing) setName(displayName);
  }, [displayName, editing]);

  function cancel() {
    setName(displayName);
    setMessage(null);
    setEditing(false);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage("Check the name.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", userId);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setEditing(false);
    setMessage(null);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-fg text-lg font-semibold text-bg">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!editing ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{displayName}</div>
                <div className="text-sm text-fg-soft">{email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setName(displayName);
                  setMessage(null);
                  setEditing(true);
                }}
                aria-label="Edit display name"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-frame text-fg-soft hover:bg-frame/40 hover:text-fg"
              >
                <PencilIcon />
              </button>
            </div>
          ) : (
            <form onSubmit={save} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
                />
              </label>
              <p className="text-sm text-fg-soft">{email}</p>
              <div className="flex flex-wrap items-center gap-3">
                {dirty && (
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-11 rounded-xl bg-fg px-5 text-sm font-bold text-bg disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy}
                  className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold disabled:opacity-60"
                >
                  Cancel
                </button>
                {message && <span className="text-sm text-fg-soft">{message}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
