import { useState, useCallback } from 'react';

// The scraper writes CABA's file as caba.json, but the map hands us the
// geojson spelling ("Ciudad de Buenos Aires") — which slugifies to
// ciudad-de-buenos-aires and used to make CABA's news silently unreachable.
const SLUG_OVERRIDES = {
  'ciudad-de-buenos-aires': 'caba',
  'ciudad-autonoma-de-buenos-aires': 'caba',
  'c-a-b-a': 'caba',
};

function slugify(str) {
  const slug = str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return SLUG_OVERRIDES[slug] || slug;
}

/**
 * Reads pre-generated summaries from the news JSON files.
 * Summaries are generated server-side by the scraper (scrape-news.mjs).
 * No API key needed on the client.
 */
export default function useNewsSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [articleCount, setArticleCount] = useState(0);
  const [snapshotDate, setSnapshotDate] = useState(null);

  const generate = useCallback(async (province, timeframe) => {
    setSummary(null);
    setError(null);
    setLoading(true);
    setArticleCount(0);
    setSnapshotDate(null);

    try {
      const slug = slugify(province);
      let newsData;
      try {
        const mod = await import(`../data/news/${slug}.json`);
        newsData = mod.default || mod;
      } catch {
        setError(`No news data for ${province}.`);
        setLoading(false);
        return;
      }

      // The news files are a scraper snapshot, not a live feed — surface the
      // date so "Hoy"/"Today" is read against the snapshot, not against now.
      setSnapshotDate(newsData.updated || null);

      const summaries = newsData.summaries || {};
      const entry = summaries[timeframe];

      if (!entry?.text) {
        // No pre-generated summary — show article count as fallback
        const articles = newsData.articles || [];
        setArticleCount(articles.length);
        setError(`No AI summary available yet for this timeframe. ${articles.length} articles on file.`);
        setLoading(false);
        return;
      }

      setArticleCount(entry.count || 0);
      setSummary(entry.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, articleCount, snapshotDate, generate };
}
