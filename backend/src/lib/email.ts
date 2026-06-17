import axios from "axios";
import { config } from "../config";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Derive a plain-text fallback from HTML (improves deliverability). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sends an email via Resend (if configured) or SMTP (if configured), otherwise
 * logs to the console. Always includes a plain-text part and a reply-to, which
 * help keep messages out of spam. Never throws.
 */
export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const plain = text || htmlToText(html);
  try {
    if (config.resendApiKey) {
      await axios.post(
        "https://api.resend.com/emails",
        {
          from: config.emailFrom,
          to,
          subject,
          html,
          text: plain,
          reply_to: config.emailReplyTo,
        },
        { headers: { Authorization: `Bearer ${config.resendApiKey}` } }
      );
      return;
    }

    if (config.smtp.host && config.smtp.user) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require("nodemailer");
      const transport = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      });
      await transport.sendMail({
        from: config.emailFrom,
        to,
        subject,
        html,
        text: plain,
        replyTo: config.emailReplyTo,
      });
      return;
    }

    console.log(`[email] (no provider configured) -> ${to}: ${subject}`);
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
  }
}

/** Shared branded wrapper for every Eventiko email. */
function shell(bodyHtml: string): string {
  return `
  <div style="background:#f1f5f9;padding:24px 0;font-family:Inter,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:24px">
        <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em">event<span style="opacity:.85">iko</span></div>
      </div>
      <div style="padding:28px 24px">${bodyHtml}</div>
      <div style="padding:16px 24px;background:#0b0a1a;color:#94a3b8;font-size:12px">
        Eventiko · Live moments, made unforgettable.<br/>
        Need help? <a href="mailto:${config.emailReplyTo}" style="color:#c4b5fd">${config.emailReplyTo}</a>
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">${label}</a>`;
}

/** Ticket confirmation email (per order / event). */
export function ticketEmailHtml(opts: {
  buyerName: string;
  eventTitle: string;
  orderNumber: string;
  references: string[];
  downloadUrl: string;
}): string {
  const refs = opts.references
    .map(
      (r) =>
        `<span style="display:inline-block;background:#f3e8ff;color:#6d28d9;font-weight:700;padding:6px 12px;border-radius:999px;margin:4px 4px 0 0;font-family:monospace">${r}</span>`
    )
    .join("");
  return shell(`
    <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Hi ${opts.buyerName || "there"},</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 14px">Your tickets for <strong>${opts.eventTitle}</strong> are confirmed 🎉</p>
    <p style="color:#475569;margin:0 0 4px">Order <strong>${opts.orderNumber}</strong></p>
    <div style="margin:8px 0 18px">${refs}</div>
    <p style="margin:0 0 20px">${button(opts.downloadUrl, "View &amp; download tickets")}</p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0">Show the QR code on your phone at the door. Keep the reference number above as a backup if your phone runs out of battery. This email is your receipt.</p>
  `);
}

type AuthAction = "signup" | "recovery" | "magiclink" | "invite" | "email_change" | string;

const AUTH_COPY: Record<string, { subject: string; heading: string; body: string; cta: string }> = {
  signup: {
    subject: "Confirm your Eventiko account",
    heading: "Confirm your email",
    body: "Welcome to Eventiko! Confirm your email address to activate your account and start buying or selling tickets.",
    cta: "Confirm my account",
  },
  recovery: {
    subject: "Reset your Eventiko password",
    heading: "Reset your password",
    body: "We received a request to reset your password. Click the button below to choose a new one. If you didn't request this, you can safely ignore this email.",
    cta: "Reset password",
  },
  magiclink: {
    subject: "Your Eventiko sign-in link",
    heading: "Sign in to Eventiko",
    body: "Click the button below to securely sign in. This link expires shortly and can only be used once.",
    cta: "Sign in",
  },
  invite: {
    subject: "You're invited to Eventiko",
    heading: "You've been invited",
    body: "You've been invited to join Eventiko. Accept the invitation to set up your account.",
    cta: "Accept invite",
  },
  email_change: {
    subject: "Confirm your new email — Eventiko",
    heading: "Confirm your new email",
    body: "Confirm this address to finish updating the email on your Eventiko account.",
    cta: "Confirm email",
  },
};

export function authEmailHtml(action: AuthAction, confirmationUrl: string): { subject: string; html: string } {
  const copy = AUTH_COPY[action] || AUTH_COPY.magiclink;
  const html = shell(`
    <p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 10px">${copy.heading}</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px">${copy.body}</p>
    <p style="margin:0 0 20px">${button(confirmationUrl, copy.cta)}</p>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${confirmationUrl}" style="color:#7c3aed;word-break:break-all">${confirmationUrl}</a></p>
  `);
  return { subject: copy.subject, html };
}
