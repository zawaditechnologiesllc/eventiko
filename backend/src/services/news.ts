import Parser from "rss-parser";
import axios from "axios";
import { supabaseAdmin } from "../lib/supabase";
import { sha1 } from "../lib/ids";
import { config } from "../config";

/**
 * Curated European + global events / live-music news sources (RSS, no API key
 * required). Each feed is fetched defensively — one failing source never breaks
 * the run.
 */
const FEEDS: { name: string; url: string; country: string }[] = [
  { name: "NME", url: "https://www.nme.com/news/music/feed", country: "United Kingdom" },
  { name: "Clash Music", url: "https://www.clashmusic.com/feed/", country: "United Kingdom" },
  { name: "DIY Magazine", url: "https://diymag.com/feed", country: "United Kingdom" },
  { name: "The Line of Best Fit", url: "https://www.thelineofbestfit.com/feed", country: "United Kingdom" },
  { name: "Mixmag", url: "https://mixmag.net/feed", country: "United Kingdom" },
  { name: "DJ Mag", url: "https://djmag.com/rss.xml", country: "United Kingdom" },
  { name: "IQ Magazine", url: "https://www.iq-mag.net/feed/", country: "Europe" },
  { name: "Complete Music Update", url: "https://completemusicupdate.com/feed/", country: "United Kingdom" },
  { name: "Gigwise", url: "https://www.gigwise.com/feed", country: "United Kingdom" },
  { name: "Music Week", url: "https://www.musicweek.com/rss", country: "United Kingdom" },
  { name: "The Guardian Music", url: "https://www.theguardian.com/music/rss", country: "United Kingdom" },
  { name: "The Guardian Festivals", url: "https://www.theguardian.com/music/festivals/rss", country: "United Kingdom" },
  { name: "BBC Arts", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", country: "United Kingdom" },
  { name: "Resident Advisor", url: "https://ra.co/xml/news.xml", country: "Europe" },
  { name: "FACT Magazine", url: "https://www.factmag.com/feed/", country: "United Kingdom" },
  { name: "The Quietus", url: "https://thequietus.com/feed", country: "United Kingdom" },
  { name: "Stereogum", url: "https://www.stereogum.com/feed/", country: "Global" },
  { name: "Pitchfork", url: "https://pitchfork.com/feed/feed-news/rss", country: "Global" },
  { name: "Consequence", url: "https://consequence.net/feed/", country: "Global" },
  { name: "Brooklyn Vegan", url: "https://www.brooklynvegan.com/feed/", country: "Global" },
  { name: "Rolling Stone Music", url: "https://www.rollingstone.com/music/music-news/feed/", country: "Global" },
  { name: "France24 Culture", url: "https://www.france24.com/en/culture/rss", country: "France" },
  { name: "Deutsche Welle Culture", url: "https://rss.dw.com/rdf/rss-en-cul", country: "Germany" },
  { name: "Euronews Culture", url: "https://www.euronews.com/rss?level=theme&name=culture", country: "Europe" },
];

const parser: Parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "EventikoNewsBot/1.0 (+https://eventiko.com)" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

interface ArticleRow {
  external_id: string;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source: string;
  author: string | null;
  category: string;
  country: string;
  published_at: string | null;
}

function extractImage(item: any): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  const html: string = item["content:encoded"] || item.content || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function clean(text?: string): string | null {
  if (!text) return null;
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 320) || null;
}

async function fetchFeed(feed: { name: string; url: string; country: string }): Promise<ArticleRow[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || [])
      .slice(0, 8)
      .filter((it) => it.link && it.title)
      .map((it) => ({
        external_id: sha1(it.link as string),
        title: (it.title as string).slice(0, 280),
        summary: clean(it.contentSnippet || it.content || it.summary),
        url: it.link as string,
        image_url: extractImage(it),
        source: feed.name,
        author: (it.creator as string) || (it as any).author || null,
        category: "events",
        country: feed.country,
        published_at: it.isoDate || (it.pubDate ? new Date(it.pubDate).toISOString() : null),
      }));
  } catch (err) {
    console.warn(`[news] feed failed (${feed.name}): ${(err as Error).message}`);
    return [];
  }
}

async function fetchNewsApi(): Promise<ArticleRow[]> {
  if (!config.newsApiKey) return [];
  try {
    const { data } = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "(concert OR festival OR live music OR event) AND (Europe OR London OR Paris OR Berlin OR Amsterdam)",
        language: "en",
        sortBy: "publishedAt",
        pageSize: 20,
        apiKey: config.newsApiKey,
      },
      timeout: 12000,
    });
    return (data.articles || []).map((a: any) => ({
      external_id: sha1(a.url),
      title: (a.title || "").slice(0, 280),
      summary: clean(a.description),
      url: a.url,
      image_url: a.urlToImage || null,
      source: a.source?.name || "NewsAPI",
      author: a.author || null,
      category: "events",
      country: "Europe",
      published_at: a.publishedAt || null,
    }));
  } catch (err) {
    console.warn(`[news] NewsAPI failed: ${(err as Error).message}`);
    return [];
  }
}

async function fetchGNews(): Promise<ArticleRow[]> {
  if (!config.gnewsApiKey) return [];
  try {
    const { data } = await axios.get("https://gnews.io/api/v4/search", {
      params: {
        q: "concert OR festival OR live event Europe",
        lang: "en",
        max: 20,
        apikey: config.gnewsApiKey,
      },
      timeout: 12000,
    });
    return (data.articles || []).map((a: any) => ({
      external_id: sha1(a.url),
      title: (a.title || "").slice(0, 280),
      summary: clean(a.description),
      url: a.url,
      image_url: a.image || null,
      source: a.source?.name || "GNews",
      author: null,
      category: "events",
      country: "Europe",
      published_at: a.publishedAt || null,
    }));
  } catch (err) {
    console.warn(`[news] GNews failed: ${(err as Error).message}`);
    return [];
  }
}

/** Aggregate every source, dedupe, and upsert into news_articles. */
export async function aggregateNews(): Promise<{ sources: number; collected: number; inserted: number }> {
  const results = await Promise.all([
    ...FEEDS.map(fetchFeed),
    fetchNewsApi(),
    fetchGNews(),
  ]);

  // Dedupe by external_id within this run.
  const map = new Map<string, ArticleRow>();
  for (const batch of results) {
    for (const row of batch) {
      if (row.title && row.url && !map.has(row.external_id)) map.set(row.external_id, row);
    }
  }
  const rows = Array.from(map.values());

  let inserted = 0;
  if (rows.length) {
    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true })
      .select("id");
    if (error) console.error("[news] upsert error:", error.message);
    inserted = data?.length ?? 0;
  }

  // Keep the table tidy — retain the newest ~400 articles.
  await pruneOldNews(400);

  console.log(`[news] sources=${FEEDS.length + 2} collected=${rows.length} inserted=${inserted}`);
  return { sources: FEEDS.length + 2, collected: rows.length, inserted };
}

async function pruneOldNews(keep: number) {
  try {
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("id")
      .order("published_at", { ascending: false })
      .range(keep, keep + 1);
    if (!data || !data.length) return;
    // Delete anything older than the keep-th newest article.
    const { data: cutoff } = await supabaseAdmin
      .from("news_articles")
      .select("published_at")
      .order("published_at", { ascending: false })
      .range(keep, keep)
      .maybeSingle();
    if (cutoff?.published_at) {
      await supabaseAdmin.from("news_articles").delete().lt("published_at", cutoff.published_at);
    }
  } catch {
    /* non-critical */
  }
}
