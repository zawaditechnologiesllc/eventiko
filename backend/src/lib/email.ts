import axios from "axios";
import { config } from "../config";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend (if configured) or SMTP (if configured), otherwise
 * logs to the console. Never throws — email failures must not break checkout.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  try {
    if (config.resendApiKey) {
      await axios.post(
        "https://api.resend.com/emails",
        { from: config.emailFrom, to, subject, html },
        { headers: { Authorization: `Bearer ${config.resendApiKey}` } }
      );
      return;
    }

    if (config.smtp.host && config.smtp.user) {
      // Lazy require so nodemailer stays an optional dependency.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require("nodemailer");
      const transport = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      });
      await transport.sendMail({ from: config.emailFrom, to, subject, html });
      return;
    }

    console.log(`[email] (no provider configured) -> ${to}: ${subject}`);
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
  }
}

export function ticketEmailHtml(opts: {
  buyerName: string;
  eventTitle: string;
  orderNumber: string;
  references: string[];
  downloadUrl: string;
}): string {
  const refs = opts.references
    .map((r) => `<span style="display:inline-block;background:#f3e8ff;color:#6d28d9;font-weight:700;padding:6px 12px;border-radius:999px;margin:4px 4px 0 0;font-family:monospace">${r}</span>`)
    .join("");

  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:28px 24px;color:#fff">
      <div style="font-size:22px;font-weight:800">eventiko</div>
      <div style="opacity:.9;margin-top:4px">Your tickets are ready 🎟️</div>
    </div>
    <div style="padding:24px">
      <p style="font-size:16px;color:#111">Hi ${opts.buyerName || "there"},</p>
      <p style="color:#444;line-height:1.6">Thanks for your purchase! Your tickets for <strong>${opts.eventTitle}</strong> are confirmed.</p>
      <p style="color:#444;margin:0 0 4px">Order <strong>${opts.orderNumber}</strong></p>
      <div style="margin:8px 0 16px">${refs}</div>
      <a href="${opts.downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Download your tickets (PDF)</a>
      <p style="color:#888;font-size:13px;line-height:1.6;margin-top:20px">Present the QR code on your phone at the door. Keep the reference number above as a backup if your phone runs out of battery. This email is your receipt.</p>
    </div>
    <div style="padding:16px 24px;background:#0b0a1a;color:#9aa;font-size:12px">Powered by Eventiko · eventiko.com</div>
  </div>`;
}
