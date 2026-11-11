/** Stored on profiles.appearance — Auto follows the device. */
export type Appearance = "system" | "light" | "dark";

export function parseAppearance(raw: unknown): Appearance {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}
