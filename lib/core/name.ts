/** Best display name from profile, Google metadata, or email local-part. */
export function resolveDisplayName(
  profileName: string | null | undefined,
  meta: { full_name?: unknown; name?: unknown },
  email?: string | null,
): string {
  const fromProfile = typeof profileName === "string" ? profileName.trim() : "";
  if (fromProfile) return fromProfile;

  const full = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  if (full) return full;
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  if (name) return name;

  const local = email?.split("@")[0]?.trim() ?? "";
  if (!local) return "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** First word of a display name, or null if empty. */
export function firstNameOf(displayName: string): string | null {
  const first = displayName.trim().split(/\s+/)[0];
  return first || null;
}
