/** A same-site path to go to after sign-in; anything else ("//evil.com", "https://…") falls back. */
export function safeNextPath(raw: string | null, fallback = "/board"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
