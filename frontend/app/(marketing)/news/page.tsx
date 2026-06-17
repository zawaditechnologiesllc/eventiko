import type { Metadata } from "next";
import { Newspaper, ExternalLink, Rss } from "lucide-react";
import { getNews } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { timeFromNow, truncate } from "@/lib/utils";
import { SITE } from "@/lib/constants";

// ISR: news refreshes on a schedule, so cache the page and revalidate often.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Events news & culture",
  description:
    "The latest concert, festival and live entertainment news from across Europe — curated by Eventiko. Stay on top of lineups, presales and what's next.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: `Events news · ${SITE.name}`,
    description:
      "The latest concert, festival and live entertainment news from across Europe, curated by Eventiko.",
    url: `${SITE.url}/news`,
  },
};

export default async function NewsPage() {
  const articles = await getNews(48);

  return (
    <div className="container-page py-12">
      <header className="max-w-3xl animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-700">
          <Rss className="h-3.5 w-3.5" />
          The wire
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Events news &amp; culture
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          We aggregate the latest live music, festival and entertainment headlines from trusted
          European sources — so you never miss a lineup announcement, presale or cultural moment.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="mt-12 grid place-items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-50 text-accent-600">
            <Newspaper className="h-8 w-8" />
          </span>
          <h2 className="mt-6 font-display text-xl font-bold text-slate-900">No news right now</h2>
          <p className="mt-2 max-w-md text-slate-500">
            Our newsroom is quiet for the moment. Check back soon for fresh headlines, or go discover
            something live.
          </p>
          <ButtonLink href="/events" variant="primary" className="mt-6">
            Browse events
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                {article.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/70">
                    <Newspaper className="h-9 w-9" />
                  </div>
                )}
                {article.source && (
                  <div className="absolute left-3 top-3">
                    <Badge tone="brand">{article.source}</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="line-clamp-2 font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                    {truncate(article.summary, 160)}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
                  <span>{article.published_at ? timeFromNow(article.published_at) : "Recently"}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
                    Read more
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
