import { createClient } from "@/lib/supabase/server";
import { NewsManager } from "@/components/admin/news-manager";
import type { NewsArticle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">News</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aggregated events news that keeps the public site fresh and active.
        </p>
      </div>
      <NewsManager initialArticles={(data ?? []) as NewsArticle[]} />
    </div>
  );
}
