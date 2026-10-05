import { createHash } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { ContactMessage } from "@/lib/core/contact";
import { noteEmail } from "@/lib/contact/noteEmail";

function hashIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

async function notifyOwner(msg: ContactMessage, sentAt: Date) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!apiKey || !to) {
    console.warn("contact email skipped: RESEND_API_KEY or CONTACT_TO not set");
    return;
  }

  const { subject, text, html } = noteEmail(msg, sentAt);

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM || "onboarding@resend.dev",
      to,
      subject,
      text,
      html,
      replyTo: msg.email,
    });
    if (error) console.warn("contact email failed", error.name, error.message);
  } catch (e) {
    console.warn("contact email failed", e instanceof Error ? e.message : e);
  }
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);

  // Honeypot: people never see this field, so anything in it is a bot.
  const honeypot = (body as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return Response.json({ ok: true });
  }

  const parsed = ContactMessage.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Add your name and a message, then try again." }, { status: 400 });
  }
  const msg = parsed.data;

  const supabase = await createClient();
  const { data: status, error } = await supabase.rpc("submit_message", {
    p_name: msg.name,
    p_message: msg.message,
    p_email: msg.email ?? null,
    p_ip_hash: hashIp(req),
  });
  if (error) {
    console.error("submit_message failed", error.message);
    return Response.json({ error: "Couldn't send that. Try again in a moment." }, { status: 500 });
  }
  if (status === "rate_limited") {
    return Response.json(
      { error: "That's a lot of notes for one hour. Try again a little later." },
      { status: 429 },
    );
  }

  await notifyOwner(msg, new Date());
  return Response.json({ ok: true });
}
