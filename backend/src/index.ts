import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cron from "node-cron";

import { config } from "./config";
import { AppError } from "./lib/http";
import { stripeWebhookHandler } from "./routes/webhook";
import { emailHookHandler } from "./routes/hooks";
import { checkoutRouter } from "./routes/checkout";
import { ordersRouter } from "./routes/orders";
import { ticketsRouter } from "./routes/tickets";
import { scanRouter } from "./routes/scan";
import { newsRouter } from "./routes/news";
import { promotionsRouter } from "./routes/promotions";
import { aggregateNews } from "./services/news";
import { supabaseAdmin } from "./lib/supabase";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

// CORS — allow the configured frontend, localhost, and server-to-server calls.
const allowedOrigins = [config.frontendUrl, "http://localhost:3000"];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      // Also allow Vercel preview deployments of the same project.
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(morgan(config.isProd ? "combined" : "dev"));

// Stripe webhook + Supabase email hook need the RAW body — mount BEFORE JSON.
app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.post("/api/hooks/email", express.raw({ type: "application/json" }), emailHookHandler);

// JSON for everything else.
app.use(express.json({ limit: "1mb" }));

// Basic rate limiting on the API surface.
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check (used by Render).
app.get("/health", (_req, res) => res.json({ ok: true, service: "eventiko-backend", time: new Date().toISOString() }));
app.get("/", (_req, res) => res.json({ name: "Eventiko API", status: "ok" }));

// Routes
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/scan", scanRouter);
app.use("/api/news", newsRouter);
app.use("/api/promotions", promotionsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("[error]", err);
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(config.port, () => {
  console.log(`🎟️  Eventiko backend listening on :${config.port} (${config.nodeEnv})`);

  if (config.supabaseUrl && config.supabaseServiceKey) {
    // Refresh news every 6 hours, plus once shortly after boot.
    cron.schedule("0 */6 * * *", () => {
      aggregateNews().catch((e) => console.error("[cron] news failed:", e.message));
    });
    setTimeout(() => {
      aggregateNews().catch((e) => console.error("[boot] news failed:", e.message));
    }, 8000);

    // Expire finished promotions (unpin events) every hour.
    cron.schedule("0 * * * *", () => {
      supabaseAdmin.rpc("expire_promotions").then(
        () => {},
        (e: { message?: string }) => console.error("[cron] expire_promotions failed:", e?.message)
      );
    });
  }
});
