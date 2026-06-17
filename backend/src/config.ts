import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    // Don't crash on boot for optional-in-dev values; warn loudly instead.
    console.warn(`[config] Missing environment variable: ${name}`);
    return "";
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",

  ticketSecret: process.env.TICKET_SECRET || "eventiko-dev-ticket-secret",

  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Eventiko <tickets@eventiko.com>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL || "support@eventiko.com",
  // Secret for the Supabase "Send Email" auth hook (format: v1,whsec_...)
  sendEmailHookSecret: process.env.SEND_EMAIL_HOOK_SECRET || "",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },

  cronSecret: process.env.CRON_SECRET || "",
  newsApiKey: process.env.NEWS_API_KEY || "",
  gnewsApiKey: process.env.GNEWS_API_KEY || "",
};
