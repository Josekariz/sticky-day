import type { ContactMessage } from "@/lib/core/contact";

// Email clients can't read CSS variables, so these copy the light-theme tokens in globals.css.
const BOARD = "#EDEAE2";
const PAPER = "#FF5FA8"; // --paper-pink, same as the Say hi note
const INK = "#1F1D1A";
const INK_SOFT = "#5A554B";
const HAND = "'Caveat', 'Segoe Print', 'Comic Sans MS', cursive";
const BODY = "'DM Sans', Helvetica, Arial, sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function noteEmail(msg: ContactMessage, sentAt: Date) {
  const subject = `Sticky Day · note from ${msg.name}`;
  const when = sentAt.toUTCString();

  const text = [
    msg.message,
    "",
    msg.email ? `Reply to: ${msg.email}` : "No reply email given.",
    `Sent: ${when}`,
  ].join("\n");

  const name = escapeHtml(msg.name);
  const message = escapeHtml(msg.message).replace(/\r?\n/g, "<br>");
  const replyLine = msg.email
    ? `Reply to <a href="mailto:${escapeHtml(msg.email)}" style="color:${INK};font-weight:600;">${escapeHtml(msg.email)}</a>`
    : "No reply email given.";

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BOARD};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BOARD};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:${PAPER};color:${INK};transform:rotate(-1.5deg);box-shadow:0 10px 24px rgba(0,0,0,0.18);">
        <tr><td style="padding:28px 28px 8px;font-family:${HAND};font-size:40px;font-weight:700;line-height:1;">Say hi</td></tr>
        <tr><td style="padding:0 28px 16px;font-family:${BODY};font-size:14px;color:${INK_SOFT};">from <strong style="color:${INK};">${name}</strong></td></tr>
        <tr><td style="padding:0 28px 24px;font-family:${HAND};font-size:26px;line-height:1.25;">${message}</td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px dashed rgba(0,0,0,0.25);font-family:${BODY};font-size:13px;line-height:1.6;color:${INK_SOFT};">
          ${replyLine}<br>
          ${escapeHtml(when)}
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-family:${BODY};font-size:12px;color:${INK_SOFT};">Sent from the Say hi note on Sticky Day</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
