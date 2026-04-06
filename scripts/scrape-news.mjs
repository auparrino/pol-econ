#!/usr/bin/env node
/**
 * Provincial News Scraper for PoliticDash
 * Scrapes newspapers per Argentine province using RSS feeds, Google News RSS,
 * and Playwright fallback for sites without RSS.
 * After scraping, classifies articles via Cerebras (Llama 3.1 8B) to filter
 * only provincially-relevant news and assign proper sections.
 * Outputs JSON files to src/data/news/{province-slug}.json
 *
 * Usage:
 *   node scripts/scrape-news.mjs                        # All provinces
 *   node scripts/scrape-news.mjs --provinces "Córdoba,Salta"  # Specific
 *   node scripts/scrape-news.mjs --no-classify           # Skip AI classification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import { subDays, format } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NEWS_DIR = path.join(ROOT, 'src', 'data', 'news');
const SOURCES_PATH = path.join(__dirname, 'news-sources.json');

const MAX_ARTICLES_PER_SOURCE = 30;
const MAX_AGE_DAYS = 60;
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_SOURCES = 1500;

// Cerebras config
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;
const CEREBRAS_MODEL = 'llama3.1-8b';
const CLASSIFY_BATCH_SIZE = 25; // articles per LLM call

const rssParser = new Parser({
  timeout: REQUEST_TIMEOUT,
  headers: { 'User-Agent': 'PoliticDash/1.0 (news aggregator)' },
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractSection(item) {
  const cats = (item.categories || []).map(c => (typeof c === 'string' ? c : c.name || '').toLowerCase());
  const link = (item.link || '').toLowerCase();

  for (const cat of cats) {
    if (cat.includes('politi') || cat.includes('gobierno')) return 'política';
    if (cat.includes('econom') || cat.includes('finanz')) return 'economía';
    if (cat.includes('socied') || cat.includes('ciudad') || cat.includes('local')) return 'sociedad';
  }

  if (link.includes('politi') || link.includes('gobierno')) return 'política';
  if (link.includes('econom') || link.includes('finanz')) return 'economía';
  if (link.includes('socied') || link.includes('ciudad') || link.includes('local')) return 'sociedad';

  return 'general';
}

function cleanExcerpt(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Resolve a Google News redirect URL to the actual article URL.
 */
async function resolveGoogleNewsUrl(url) {
  try {
    const resp = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'PoliticDash/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    return resp.url || url;
  } catch {
    return url;
  }
}

function extractGoogleNewsSource(title) {
  const match = (title || '').match(/\s-\s([^-]+)$/);
  return match ? match[1].trim() : 'Google News';
}

function cleanGoogleNewsTitle(title) {
  return (title || '').replace(/\s-\s[^-]+$/, '').trim();
}

/**
 * For Google News sources, generate date-ranged URLs to fetch historical articles.
 * Returns array of { url, label } for each time window.
 */
function getGoogleNewsTimeWindows(baseUrl) {
  const now = new Date();
  const fmt = d => format(d, 'yyyy-MM-dd');

  // Remove any existing after:/before: params from the base URL
  const cleanUrl = baseUrl.replace(/\+?(?:after|before):[^\s&+]*/g, '').replace(/\+{2,}/g, '+');

  return [
    { url: cleanUrl, label: 'today' },  // Default (recent)
    {
      url: `${cleanUrl}+after:${fmt(subDays(now, 7))}+before:${fmt(subDays(now, 1))}`,
      label: 'week',
    },
    {
      url: `${cleanUrl}+after:${fmt(subDays(now, 30))}+before:${fmt(subDays(now, 7))}`,
      label: 'month',
    },
  ];
}

async function parseRSSFeed(feedUrl, source) {
  try {
  const feed = await rssParser.parseURL(feedUrl);
  const cutoff = subDays(new Date(), MAX_AGE_DAYS);
  const articles = [];
  const isGoogleNews = source.google_news === true;

  for (const item of (feed.items || []).slice(0, MAX_ARTICLES_PER_SOURCE)) {
    const pubDate = item.pubDate || item.isoDate;
    const date = pubDate ? new Date(pubDate) : new Date();

    if (date < cutoff) continue;

    let title = (item.title || '').trim();
    let url = item.link || '';
    let sourceDomain = source.domain;

    if (isGoogleNews) {
      sourceDomain = extractGoogleNewsSource(title);
      title = cleanGoogleNewsTitle(title);
      try {
        url = await resolveGoogleNewsUrl(url);
      } catch { /* keep original */ }
    }

    if (!title || title.length < 15) continue;

    articles.push({
      title,
      url,
      date: format(date, 'yyyy-MM-dd'),
        source: sourceDomain,
        section: extractSection(item),
        excerpt: cleanExcerpt(item.contentSnippet || item.content || item.summary || ''),
      });
    }

    return articles;
  } catch (err) {
    console.warn(`  RSS failed for ${source.domain}: ${err.message}`);
    return [];
  }
}

async function scrapeRSS(source) {
  if (!source.rss) return [];

  // For Google News sources, fetch multiple time windows to populate week/month data
  if (source.google_news) {
    const windows = getGoogleNewsTimeWindows(source.rss);
    let allArticles = [];
    for (const win of windows) {
      try {
        const articles = await parseRSSFeed(win.url, source);
        console.log(`    [${win.label}] ${articles.length} articles`);
        allArticles.push(...articles);
      } catch (err) {
        console.warn(`    [${win.label}] failed: ${err.message}`);
      }
      await sleep(800); // Rate limit between Google News requests
    }
    return allArticles;
  }

  // Regular RSS: single fetch
  return parseRSSFeed(source.rss, source);
}

async function scrapePlaywright(source, browser) {
  if (!source.url || !source.selectors) return [];
  if (!browser) {
    console.warn(`  Playwright not available for ${source.domain}, skipping`);
    return [];
  }

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(REQUEST_TIMEOUT);
    await page.goto(source.url, { waitUntil: 'domcontentloaded' });

    const articles = await page.evaluate((sel) => {
      const items = [];
      const links = document.querySelectorAll(sel.list);

      for (const link of [...links].slice(0, 30)) {
        const titleEl = link.querySelector(sel.title) || link;
        const title = titleEl?.textContent?.trim();
        const href = link.href || link.querySelector('a')?.href;

        if (title && href && title.length > 15) {
          items.push({ title, url: href });
        }
      }
      return items;
    }, source.selectors);

    await page.close();

    const today = format(new Date(), 'yyyy-MM-dd');
    return articles.map(a => ({
      title: a.title,
      url: a.url,
      date: today,
      source: source.domain,
      section: 'general',
      excerpt: '',
    }));
  } catch (err) {
    console.warn(`  Playwright failed for ${source.domain}: ${err.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────
// AI Classification via Cerebras (Llama 3.1 8B)
// ─────────────────────────────────────────────────────

const CLASSIFICATION_SYSTEM = `Clasificás noticias para una provincia argentina. Filtrás solo lo que es relevante para ESA provincia.

ACEPTAR (r=true) — la noticia debe ser SOBRE la provincia indicada:
- Gobierno provincial/municipal de ESA provincia
- Economía local (empleo, industria, comercio de ESA provincia)
- Sociedad local (salud, educación, conflictos de ESA provincia)
- Infraestructura de ESA provincia
- Justicia/seguridad de ESA provincia
- Cultura de ESA provincia
- Nacional SOLO si menciona explícitamente la provincia por nombre con datos o impacto específico. Ej: "Pobreza en Gran Tucumán bajó al 17%" → OK. "La pobreza en Argentina bajó al 28%" → NO.

DESCARTAR (r=false) — SÉ MUY ESTRICTO, en caso de duda descartá:
- DEPORTES: fútbol, selección, Mundial, F1, NBA, AFA, transfers, resultados, penales, eliminatorias, amistosos, Italia, Bosnia, Zambia, cualquier partido o torneo
- ENTRETENIMIENTO: TV, Netflix, HBO, cine, premios, conciertos de artistas nacionales, Gran Hermano, series, streaming, "títulos para ver", "qué ver en Semana Santa", cantantes que visitan la provincia
- INTERNACIONAL: otros países, guerra, NASA, Vaticano, papa León, Irán, Brasil, EEUU
- LIFESTYLE: recetas, jardinería, moda, decoración, horóscopo
- CLIMA/PRONÓSTICO: temperatura, lluvia, "así estará el tiempo", "cómo estará el cielo", pronóstico
- POLICIALES DE OTRA PROVINCIA: si el hecho ocurrió en otra provincia, SIEMPRE descartar
- GOSSIP: vida privada de famosos, mascotas de políticos
- ECONOMÍA NACIONAL: dólar, riesgo país, INDEC sin dato provincial, ANSES, jubilaciones nacionales, yerba mate nacional
- POLÍTICA FEDERAL SIN ÁNGULO LOCAL: Adorni, Milei, Bullrich, FATE, Corte Suprema, leyes nacionales sin mención de la provincia
- NOTICIAS DE OTRA PROVINCIA: si es sobre otra provincia, descartar siempre

Secciones: política, economía, sociedad, cultura.`;

function buildClassificationPrompt(province, articles) {
  const list = articles.map((a, i) =>
    `${i + 1}. ${a.title}${a.excerpt ? ` | ${a.excerpt.slice(0, 120)}` : ''}`
  ).join('\n');

  return `Provincia: ${province}

Clasificá estos ${articles.length} artículos. Respondé SOLO con un JSON array donde cada elemento tiene: {"i": número, "r": true/false, "s": "política"|"economía"|"sociedad"|"cultura"}
- i = número del artículo
- r = true si es relevante para ${province}, false si debe descartarse
- s = sección (solo si r=true, si r=false poné "x")

NO incluyas explicaciones, SOLO el JSON array.

ARTÍCULOS:
${list}`;
}

async function classifyBatch(province, articles) {
  if (!CEREBRAS_KEY || articles.length === 0) return articles;

  const prompt = buildClassificationPrompt(province, articles);

  try {
    const resp = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_completion_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn(`  Classification API error (${resp.status}): ${err.slice(0, 200)}`);
      return articles; // Return unfiltered on error
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(`  Could not parse classification response`);
      return articles;
    }

    const results = JSON.parse(jsonMatch[0]);
    const resultMap = new Map(results.map(r => [r.i, r]));

    const filtered = [];
    let discarded = 0;

    for (let idx = 0; idx < articles.length; idx++) {
      const result = resultMap.get(idx + 1);
      if (!result || result.r === true) {
        const article = { ...articles[idx] };
        // Update section if LLM provided one
        if (result?.s && result.s !== 'x') {
          article.section = result.s;
        }
        filtered.push(article);
      } else {
        discarded++;
      }
    }

    console.log(`  🤖 AI: kept ${filtered.length}, discarded ${discarded}`);
    return filtered;
  } catch (err) {
    console.warn(`  Classification failed: ${err.message}`);
    return articles; // Return unfiltered on error
  }
}

async function classifyArticles(province, articles) {
  if (!CEREBRAS_KEY) {
    console.warn('  No CEREBRAS_API_KEY, skipping classification');
    return articles;
  }

  // Process in batches
  const allFiltered = [];
  for (let i = 0; i < articles.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = articles.slice(i, i + CLASSIFY_BATCH_SIZE);
    const filtered = await classifyBatch(province, batch);
    allFiltered.push(...filtered);
    if (i + CLASSIFY_BATCH_SIZE < articles.length) {
      await sleep(500); // Rate limit between batches
    }
  }

  return allFiltered;
}

// ─────────────────────────────────────────────────────
// AI Summary Generation (pre-computed for static site)
// ─────────────────────────────────────────────────────

const SUMMARY_FOCUS = {
  today: 'Focus on the most recent and urgent news. Be brief and direct.',
  week: 'Identify trends and patterns of the week. Group by topic.',
  month: 'Provide a broader analysis of the month\'s developments. Highlight changes and trends.',
};

const SUMMARY_LABELS = {
  today: 'today',
  week: 'the last week',
  month: 'the last month',
};

async function generateSummary(province, articles, timeframe) {
  if (!CEREBRAS_KEY || articles.length === 0) return null;

  const articleText = articles
    .slice(0, 40)
    .map((a, i) => `${i + 1}. [${a.date}] [${a.section}] ${a.title}${a.excerpt ? `\n   ${a.excerpt.slice(0, 150)}` : ''}`)
    .join('\n');

  const prompt = `You are an Argentine political analyst. Summarize the following news from the province of ${province} from ${SUMMARY_LABELS[timeframe]}.

${SUMMARY_FOCUS[timeframe]}

Focus on:
- Provincial political developments
- Local economic situation
- Relevant social issues

CRITICAL: Your entire response MUST be written in English. Do not use any Spanish words or phrases. Translate proper nouns where appropriate but keep names of people, parties, and places in their original form. Be concise but informative. Organize by topic if there are several. Do not invent information not present in the news.

NEWS ARTICLES (${articles.length} articles, original headlines in Spanish — translate them in your summary):

${articleText}`;

  try {
    const resp = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: 'You are an Argentine political analyst specializing in provincial politics. Always respond in English.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function generateSummaries(provinceName, allArticles) {
  if (!CEREBRAS_KEY) return {};

  const now = new Date();
  const ranges = {
    today: format(subDays(now, 1), 'yyyy-MM-dd'),
    week: format(subDays(now, 7), 'yyyy-MM-dd'),
    month: format(subDays(now, 30), 'yyyy-MM-dd'),
  };

  const summaries = {};
  for (const [tf, cutoff] of Object.entries(ranges)) {
    const filtered = allArticles.filter(a => a.date >= cutoff);
    if (filtered.length === 0) continue;

    const summary = await generateSummary(provinceName, filtered, tf);
    if (summary) {
      summaries[tf] = { text: summary, count: filtered.length, generated: now.toISOString() };
      console.log(`  📝 Summary [${tf}]: ${filtered.length} articles`);
    }
    await sleep(500);
  }

  return summaries;
}

// ─────────────────────────────────────────────────────

function deduplicateArticles(articles) {
  const seen = new Map();
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  let filterProvinces = null;
  const skipClassify = args.includes('--no-classify');
  const provIdx = args.indexOf('--provinces');
  if (provIdx !== -1 && args[provIdx + 1]) {
    filterProvinces = args[provIdx + 1].split(',').map(s => s.trim().toLowerCase());
  }

  const config = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));

  fs.mkdirSync(NEWS_DIR, { recursive: true });

  // Initialize Playwright if needed
  let browser = null;
  const needsPlaywright = config.provinces.some(p =>
    p.sources.some(s => !s.rss && s.url && s.selectors)
  );

  if (needsPlaywright) {
    try {
      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true });
      console.log('Playwright browser launched');
    } catch (err) {
      console.warn('Playwright not available, will skip fallback scraping:', err.message);
    }
  }

  if (!skipClassify && !CEREBRAS_KEY) {
    console.warn('⚠️  No CEREBRAS_API_KEY found. Articles will not be classified.\n   Set CEREBRAS_API_KEY env var or use --no-classify to suppress this warning.\n');
  }

  const provinces = filterProvinces
    ? config.provinces.filter(p => filterProvinces.some(f =>
        p.name.toLowerCase().includes(f) || p.slug.includes(f)
      ))
    : config.provinces;

  console.log(`\nScraping ${provinces.length} provinces...${skipClassify ? ' (classification disabled)' : ''}\n`);

  let totalArticles = 0;

  for (const province of provinces) {
    console.log(`📰 ${province.name} (${province.sources.length} sources)`);
    let allArticles = [];

    for (const source of province.sources) {
      let articles = await scrapeRSS(source);

      if (articles.length === 0 && source.url && source.selectors) {
        articles = await scrapePlaywright(source, browser);
      }

      console.log(`  ${source.name || source.domain}: ${articles.length} articles`);
      allArticles.push(...articles);
      await sleep(DELAY_BETWEEN_SOURCES);
    }

    // Deduplicate
    allArticles = deduplicateArticles(allArticles);

    // AI Classification (only on new articles)
    if (!skipClassify && allArticles.length > 0) {
      allArticles = await classifyArticles(province.name, allArticles);
    }

    // Sort by date
    allArticles.sort((a, b) => b.date.localeCompare(a.date));

    // Merge with existing classified data (skip old unclassified articles)
    const outPath = path.join(NEWS_DIR, `${province.slug}.json`);
    let existing = { articles: [] };
    if (fs.existsSync(outPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
        // Only keep previously classified articles (those with non-'general' section)
        // or articles from previous runs that were already classified
        existing.articles = (prev.articles || []).filter(a =>
          a.classified === true || (a.section && a.section !== 'general')
        );
      } catch {}
    }

    // Mark new articles as classified
    if (!skipClassify && CEREBRAS_KEY) {
      allArticles = allArticles.map(a => ({ ...a, classified: true }));
    }

    const merged = deduplicateArticles([...allArticles, ...existing.articles]);
    const cutoff = format(subDays(new Date(), MAX_AGE_DAYS), 'yyyy-MM-dd');
    const final = merged.filter(a => a.date >= cutoff);

    // Generate AI summaries for each timeframe
    let summaries = {};
    if (!skipClassify && final.length > 0) {
      summaries = await generateSummaries(province.name, final);
    }

    const output = {
      province: province.name,
      slug: province.slug,
      updated: new Date().toISOString(),
      sources: province.sources.map(s => s.name || s.domain),
      summaries,
      articles: final,
    };

    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`  → ${final.length} total articles (${allArticles.length} new)\n`);
    totalArticles += final.length;
  }

  if (browser) await browser.close();

  console.log(`\n✅ Done! ${totalArticles} total articles across ${provinces.length} provinces`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
