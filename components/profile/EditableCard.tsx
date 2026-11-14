"use client";

import type { FormEvent, ReactNode } from "react";

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

type Props = {
  title: string;
  blurb?: string;
  /** Read-only summary when not editing. */
  summary: ReactNode;
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  message: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (e: FormEvent) => void;
  children: ReactNode;
};

/** Section card: pencil to edit; Save only when the draft differs from saved. */
export function EditableCard({
  title,
  blurb,
  summary,
  editing,
  dirty,
  saving,
  message,
  onEdit,
  onCancel,
  onSave,
  children,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-semibold">{title}</h2>
          {blurb && <p className="text-sm text-fg-soft">{blurb}</p>}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title.toLowerCase()}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-frame text-fg-soft hover:bg-frame/40 hover:text-fg"
          >
            <PencilIcon />
          </button>
        )}
      </header>

      {!editing ? (
        <div className="text-sm font-semibold text-fg">{summary}</div>
      ) : (
        <form onSubmit={onSave} className="flex flex-col gap-4">
          {children}
          <div className="flex flex-wrap items-center gap-3">
            {dirty && (
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-fg px-5 text-sm font-bold text-bg disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 rounded-xl border border-frame px-5 text-sm font-semibold disabled:opacity-60"
            >
              Cancel
            </button>
            {message && <span className="text-sm text-fg-soft">{message}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
