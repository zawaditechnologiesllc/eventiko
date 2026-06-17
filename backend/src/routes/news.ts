import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { aggregateNews } from "../services/news";
import { config } from "../config";
import { getUserFromRequest } from "../lib/auth";

export const newsRouter = Router();

/** Latest aggregated news articles. */
newsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt((req.query.limit as string) || "30", 10), 60);
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);
    res.json({ articles: data ?? [] });
  })
);

/**
 * Trigger aggregation. Authorized either by the cron secret header (used by the
 * Render scheduled job) or by an authenticated admin's bearer token.
 */
newsRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const cronHeader = req.headers["x-cron-secret"];
    const authorizedByCron = config.cronSecret && cronHeader === config.cronSecret;

    if (!authorizedByCron) {
      const user = await getUserFromRequest(req);
      if (user.role !== "admin") throw new AppError(403, "Admins only.");
    }

    const result = await aggregateNews();
    res.json(result);
  })
);
