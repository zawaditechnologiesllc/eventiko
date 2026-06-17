import { aggregateNews } from "../services/news";

/**
 * Standalone news aggregation runner. Used by `npm run news:refresh` and can be
 * wired to an external scheduler (e.g. Render Cron Job) as an alternative to the
 * in-process cron.
 */
aggregateNews()
  .then((r) => {
    console.log(`Done. sources=${r.sources} collected=${r.collected} inserted=${r.inserted}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("News refresh failed:", e);
    process.exit(1);
  });
