"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2, ExternalLink, AlertCircle, CheckCircle2, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/api";
import { timeFromNow } from "@/lib/utils";
import type { NewsArticle } from "@/lib/types";

export function NewsManager({ initialArticles }: { initialArticles: NewsArticle[] }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function refresh() {
    setRefreshing(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";
      const res = await fetch(`${apiUrl}/api/news/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
      const body = await res.json();
      setMsg({
        type: "ok",
        text: `Aggregated ${body.sources ?? 20}+ sources — ${body.inserted ?? 0} new articles added.`,
      });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Could not refresh news." });
    } finally {
      setRefreshing(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("news_articles").delete().eq("id", id);
    setArticles((a) => a.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600">
            <Newspaper className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Automated news aggregation</p>
            <p className="text-sm text-slate-500">
              Pulls from 20+ European event &amp; live-music sources on a schedule. Trigger a manual refresh below.
            </p>
          </div>
        </div>
        <Button onClick={refresh} loading={refreshing} className="shrink-0">
          <RefreshCw className="h-4 w-4" /> Refresh now
        </Button>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          No news yet. Click <strong>Refresh now</strong> to pull the latest articles.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <div key={a.id} className="card group flex flex-col overflow-hidden">
              <div className="aspect-video bg-slate-100">
                {a.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/70">
                    <Newspaper className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-brand-600">{a.source}</span>
                  <span>{a.published_at ? timeFromNow(a.published_at) : ""}</span>
                </div>
                <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-slate-900">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.summary}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                    Open <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => remove(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
