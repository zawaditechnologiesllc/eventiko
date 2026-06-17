import { createReadOnlyClient } from "@/lib/supabase/server";
import type { Broadcast, EventRecord, NewsArticle, Settings } from "@/lib/types";

const FALLBACK_SETTINGS: Settings = {
  id: 1,
  platform_fee_rate: 8,
  currency: "EUR",
  payout_min: 50,
  support_email: "support@eventiko.com",
  hero: {
    title: "Live moments, made unforgettable.",
    subtitle:
      "Discover and book tickets to the best concerts, festivals and events across Europe and beyond.",
    ctaText: "Explore events",
    ctaLink: "/events",
    backgroundImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=80",
  },
  footer: {},
  branding: { primary: "#7C3AED", accent: "#EC4899" },
};

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = await createReadOnlyClient();
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    return (data as Settings) || FALLBACK_SETTINGS;
  } catch {
    return FALLBACK_SETTINGS;
  }
}

export async function getActiveBroadcasts(): Promise<Broadcast[]> {
  try {
    const supabase = await createReadOnlyClient();
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(5);
    return (data as Broadcast[]) || [];
  } catch {
    return [];
  }
}

export async function getPublishedEvents(opts?: {
  category?: string;
  country?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
}): Promise<EventRecord[]> {
  try {
    const supabase = await createReadOnlyClient();
    let query = supabase
      .from("events")
      .select("*, ticket_types(*), seller:sellers(business_name, logo_url)")
      .eq("status", "published")
      .order("starts_at", { ascending: true });

    if (opts?.category) query = query.eq("category", opts.category);
    if (opts?.country) query = query.eq("country", opts.country);
    if (opts?.featured) query = query.eq("featured", true);
    if (opts?.q) query = query.ilike("title", `%${opts.q}%`);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data } = await query;
    return (data as EventRecord[]) || [];
  } catch {
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  try {
    const supabase = await createReadOnlyClient();
    const { data } = await supabase
      .from("events")
      .select("*, ticket_types(*), seller:sellers(business_name, logo_url, description)")
      .eq("slug", slug)
      .single();
    return (data as EventRecord) || null;
  } catch {
    return null;
  }
}

export async function getNews(limit = 24): Promise<NewsArticle[]> {
  try {
    const supabase = await createReadOnlyClient();
    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);
    return (data as NewsArticle[]) || [];
  } catch {
    return [];
  }
}
