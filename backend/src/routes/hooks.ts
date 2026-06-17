import { Request, Response } from "express";
import { Webhook } from "standardwebhooks";
import { config } from "../config";
import { sendEmail, authEmailHtml } from "../lib/email";

/**
 * Supabase "Send Email" auth hook. Lets us deliver branded confirm-account,
 * reset-password, magic-link, etc. emails through Resend instead of Supabase's
 * default sender. Configure in Supabase → Authentication → Hooks → Send Email,
 * pointing at POST /api/hooks/email, and set SEND_EMAIL_HOOK_SECRET.
 *
 * Mounted with express.raw() so the raw body is available for signature checks.
 */
export async function emailHookHandler(req: Request, res: Response) {
  if (!config.sendEmailHookSecret) {
    return res.status(501).json({ error: "Email hook not configured." });
  }

  const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

  // Supabase secret format is "v1,whsec_<base64>"; standardwebhooks wants the base64.
  const secret = config.sendEmailHookSecret.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");

  let data: any;
  try {
    const wh = new Webhook(secret);
    data = wh.verify(payload, {
      "webhook-id": req.header("webhook-id") || "",
      "webhook-timestamp": req.header("webhook-timestamp") || "",
      "webhook-signature": req.header("webhook-signature") || "",
    });
  } catch (err) {
    console.error("[email-hook] signature verification failed:", (err as Error).message);
    return res.status(401).json({ error: "Invalid signature." });
  }

  try {
    const email: string = data.user?.email;
    const ed = data.email_data || {};
    const type: string = ed.email_action_type || "magiclink";
    const tokenHash: string = ed.token_hash || ed.token_hash_new || ed.token;
    const redirectTo: string = ed.redirect_to || `${config.frontendUrl}/auth/callback`;

    const confirmationUrl = `${config.supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(
      tokenHash
    )}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;

    const { subject, html } = authEmailHtml(type, confirmationUrl);
    await sendEmail({ to: email, subject, html });

    return res.status(200).json({});
  } catch (err) {
    console.error("[email-hook] failed to send:", (err as Error).message);
    return res.status(500).json({ error: "Failed to send email." });
  }
}
