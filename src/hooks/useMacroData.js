import { useState, useEffect } from 'react';

const CACHE_KEY = 'politicdash_macro_cache_v2';
const CACHE_TTL = 1000 * 60 * 30; // 30 min

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
  } catch { /* ignore */ }
  return null;
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

async function fetchJSON(url, fallback = null) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch {
    return fallback;
  }
}

// Binary-search the history array (sorted by fecha asc) for the last entry
// at or before `daysAgo` days from now. Returns null if not found.
function histAt(history, daysAgo) {
  if (!Array.isArray(history) || !history.length) return null;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const targetDate = d.toISOString().split('T')[0];
  let lo = 0, hi = history.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (history[mid].fecha <= targetDate) {
      best = history[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

// Compute a single delta between current value and a historical entry.
// field: key to read from the historical entry (e.g. 'venta' or 'valor').
function delta(current, pastEntry, field) {
  if (current == null || !pastEntry) return null;
  const pastVal = pastEntry[field] ?? pastEntry.valor;
  if (pastVal == null || pastVal === 0) return null;
  const diff = current - pastVal;
  const pct = (diff / pastVal) * 100;
  return { pct, dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' };
}

// Compute d1 / m1 / y1 deltas for a given current value and history array.
// Used when `current` is a live value from an external source (e.g. dolarapi.com).
function computeDeltas(current, history, field = 'venta') {
  return {
    d1: delta(current, histAt(history, 1), field),
    m1: delta(current, histAt(history, 30), field),
    y1: delta(current, histAt(history, 365), field),
  };
}

// Compute deltas when both current and history come from the same argentinadatos
// endpoint (which may lag 1–2 days). Uses the penultimate entry for d1 so that
// we don't compare today's entry against itself.
function computeDeltasFromHistory(history, field = 'valor') {
  if (!Array.isArray(history) || history.length < 2) return null;
  const last = history[history.length - 1];
  const current = last[field] ?? last.valor;
  if (current == null) return null;
  return {
    d1: delta(current, history[history.length - 2], field),
    m1: delta(current, histAt(history, 30), field),
    y1: delta(current, histAt(history, 365), field),
  };
}

export function useMacroData() {
  const [data, setData] = useState(() => getCached() || {
    dolarOficial: null,
    dolarBlue: null,
    dolarMEP: null,
    dolarCCL: null,
    riesgoPais: null,
    inflacion: null,
    reservas: null,
    tasaPolitica: null,
    comparisons: null,
    loading: true,
    lastUpdate: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [
        dolares,
        riesgoPaisHist,
        histOficial,
        histBlue,
        histBolsa,
        histTasa,
      ] = await Promise.all([
        fetchJSON('https://dolarapi.com/v1/dolares'),
        fetchJSON('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais', []),
        fetchJSON('https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial', []),
        fetchJSON('https://api.argentinadatos.com/v1/cotizaciones/dolares/blue', []),
        fetchJSON('https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa', []),
        fetchJSON('https://api.argentinadatos.com/v1/finanzas/tasas/depositos30Dias', []),
      ]);

      if (cancelled) return;

      const findDolar = (casa) => {
        if (!dolares) return null;
        const d = dolares.find(x => x.casa === casa);
        return d ? { compra: d.compra, venta: d.venta } : null;
      };

      const dolarOficial = findDolar('oficial');
      const dolarBlue = findDolar('blue');
      const dolarMEP = findDolar('bolsa');
      const dolarCCL = findDolar('contadoconliqui');

      // Riesgo país: latest from history
      const lastRiesgo = riesgoPaisHist?.length
        ? riesgoPaisHist[riesgoPaisHist.length - 1]
        : null;
      const riesgoPais = lastRiesgo?.valor ?? null;

      // Tasa: 30-day deposit rate from argentinadatos (BCRA API deprecated)
      const lastTasa = histTasa?.length ? histTasa[histTasa.length - 1] : null;
      const tasaPolitica = lastTasa?.valor ?? null;

      // Compute deltas — raw histories discarded after this, not cached.
      // For dolar: use live dolarapi price vs argentinadatos history (1-day calendar diff).
      // For riesgo/tasa: both current and history from argentinadatos; use penultimate
      //   entry for d1 to avoid comparing the latest point against itself.
      const comparisons = {
        dolarOficial: computeDeltas(dolarOficial?.venta, histOficial, 'venta'),
        dolarBlue: computeDeltas(dolarBlue?.venta, histBlue, 'venta'),
        dolarMEP: computeDeltas(dolarMEP?.venta, histBolsa, 'venta'),
        riesgoPais: computeDeltasFromHistory(riesgoPaisHist, 'valor'),
        tasaPolitica: computeDeltasFromHistory(histTasa, 'valor'),
      };

      const result = {
        dolarOficial,
        dolarBlue,
        dolarMEP,
        dolarCCL,
        reservas: null, // BCRA statistics API deprecated; no public replacement available
        tasaPolitica,
        riesgoPais,
        inflacion: null,
        comparisons,
        loading: false,
        lastUpdate: new Date().toISOString(),
      };

      setCache(result);
      setData(result);
    }

    load();
    const interval = setInterval(load, CACHE_TTL);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return data;
}
