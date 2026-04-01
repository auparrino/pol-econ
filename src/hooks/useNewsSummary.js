import { useState, useCallback } from 'react';
import { subDays, subWeeks, subMonths, format } from 'date-fns';

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
const CEREBRAS_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;
const MODEL = 'llama3.1-8b';

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getDateCutoff(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case 'today':    return format(subDays(now, 1), 'yyyy-MM-dd');
    case 'week':     return format(subWeeks(now, 1), 'yyyy-MM-dd');
    case 'month':    return format(subMonths(now, 1), 'yyyy-MM-dd');
    default:         return format(subDays(now, 1), 'yyyy-MM-dd');
  }
}

const TIMEFRAME_LABELS = {
  today: 'hoy',
  week: 'la última semana',
  month: 'el último mes',
};

const TIMEFRAME_FOCUS = {
  today: 'Enfocate en las noticias más recientes y urgentes. Sé breve y directo.',
  week: 'Identificá tendencias y patrones de la semana. Agrupá por tema.',
  month: 'Hacé un análisis más amplio de la evolución del mes. Destacá cambios y tendencias de largo plazo.',
};

export default function useNewsSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [articleCount, setArticleCount] = useState(0);

  const generate = useCallback(async (province, timeframe) => {
    setSummary(null);
    setError(null);
    setLoading(true);
    setArticleCount(0);

    try {
      const slug = slugify(province);
      let newsData;
      try {
        const mod = await import(`../data/news/${slug}.json`);
        newsData = mod.default || mod;
      } catch {
        setError(`No news data available for ${province}. Run the scraper first.`);
        setLoading(false);
        return;
      }

      const cutoff = getDateCutoff(timeframe);
      const filtered = (newsData.articles || []).filter(a => a.date >= cutoff);

      if (filtered.length === 0) {
        setError(`No articles found for ${province} in ${TIMEFRAME_LABELS[timeframe]}.`);
        setLoading(false);
        return;
      }

      setArticleCount(filtered.length);

      const articleText = filtered
        .slice(0, 40)
        .map((a, i) => `${i + 1}. [${a.date}] [${a.source}] [${a.section}] ${a.title}${a.excerpt ? `\n   ${a.excerpt}` : ''}`)
        .join('\n');

      const prompt = `Sos un analista político argentino. Resumí las siguientes noticias de la provincia de ${province} de ${TIMEFRAME_LABELS[timeframe]}.

${TIMEFRAME_FOCUS[timeframe]}

Enfocate en:
- Desarrollos políticos provinciales
- Situación económica local
- Temas sociales relevantes

Respondé en español. Sé conciso pero informativo. Organizá por temas si hay varios. No inventes información que no esté en las noticias.

NOTICIAS (${filtered.length} artículos de ${newsData.sources.join(', ')}):

${articleText}`;

      if (!CEREBRAS_KEY) {
        setError('Cerebras API key not configured. Add VITE_CEREBRAS_API_KEY to .env');
        setLoading(false);
        return;
      }

      const response = await fetch(CEREBRAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'Sos un analista político argentino especializado en política provincial. Respondés siempre en español.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_completion_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Cerebras API error (${response.status}): ${err}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Empty response from Cerebras');
      }

      setSummary(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, articleCount, generate };
}
