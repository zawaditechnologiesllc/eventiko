import type { MetadataRoute } from "next";
import { createReadOnlyClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/events", priority: 0.9, changeFrequency: "hourly" },
  { path: "/news", priority: 0.7, changeFrequency: "daily" },
  { path: "/sell", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createReadOnlyClient();
    const { data } = await supabase
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("starts_at", { ascending: true })
      .limit(1000);

    eventEntries = ((data as { slug: string; updated_at: string | null }[]) || []).map((e) => ({
      url: `${SITE.url}/events/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : now,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    eventEntries = [];
  }

  return [...staticEntries, ...eventEntries];
}
