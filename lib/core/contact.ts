import { z } from "zod";

// Must match the checks in submit_message (migration 0009).
export const CONTACT_NAME_MAX = 80;
export const CONTACT_MESSAGE_MAX = 2000;
export const CONTACT_EMAIL_MAX = 254;

export const ContactMessage = z.object({
  name: z.string().trim().min(1).max(CONTACT_NAME_MAX),
  message: z.string().trim().min(1).max(CONTACT_MESSAGE_MAX),
  email: z
    .string()
    .trim()
    .max(CONTACT_EMAIL_MAX)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.email().optional()),
});

export type ContactMessage = z.infer<typeof ContactMessage>;
