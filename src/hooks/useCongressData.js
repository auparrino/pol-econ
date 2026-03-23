import { useState, useEffect, useMemo } from 'react';
import { officialSenators } from '../data/officialSenators';

const CACHE_KEY = 'politicdash_congress';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const COALITION_LABELS = {
  LLA: 'LLA',
  JxC: 'PRO/JxC',
  UCR: 'UCR',
  PJ: 'UxP',
  OTROS: 'Otros',
};

const COALITION_COLORS = {
  LLA: '#8e44ad',
  JxC: '#f1c40f',
  UCR: '#e74c3c',
  PJ: '#2980b9',
  OTROS: '#669BBC',
};

// Order for display
const COALITION_ORDER = ['LLA', 'JxC', 'UCR', 'PJ', 'OTROS'];

// Constitutional seats
const SENATE_SEATS = 72; // 3 per province/district (24 districts)
const DEPUTY_SEATS = 257;

// Normalize accented characters for matching
function normalizeStr(s) {
  return s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() || '';
}

// Normalize province names (CABA ↔ Ciudad de Buenos Aires)
function normalizeProv(p) {
  const n = normalizeStr(p);
  if (n === 'CABA' || n === 'CIUDAD DE BUENOS AIRES' || n === 'CIUDAD AUTONOMA DE BUENOS AIRES') return 'CABA';
  return n;
}

// Build a set of official senator last names per province for disambiguation
const officialSenatorKeys = new Set();
for (const s of officialSenators) {
  const last = normalizeStr(s.n?.split(',')[0]);
  const prov = normalizeProv(s.p);
  if (last && prov) officialSenatorKeys.add(`${last}|${prov}`);
}

function getMaxYt(leg) {
  if (!leg.by_co) return 0;
  return Math.max(...Object.values(leg.by_co).map(e => e.yt || 0));
}

function filterCurrent(legislators) {
  // Use yt >= 2025 as the broad pool (includes recently sworn legislators)
  const pool = legislators.filter(leg => leg.by_co && getMaxYt(leg) >= 2025);

  // Comovoto uses "diputados+senadores" for legislators who served in both chambers.
  // Use officialSenators list to determine if they're currently a senator or deputy.
  const normalized = pool.map(l => {
    if (l.c === 'diputados+senadores') {
      const last = normalizeStr(l.n?.split(',')[0]);
      const prov = normalizeProv(l.p);
      const isSenator = officialSenatorKeys.has(`${last}|${prov}`);
      return { ...l, c: isSenator ? 'senadores' : 'diputados' };
    }
    return l;
  });

  // Senators: cap at 3 per province, keeping those with highest yt (most current)
  const senPool = normalized.filter(l => l.c === 'senadores');
  const senByProv = {};
  for (const s of senPool) {
    const prov = s.p || 'Desconocido';
    if (!senByProv[prov]) senByProv[prov] = [];
    senByProv[prov].push(s);
  }
  const senators = [];
  for (const [, list] of Object.entries(senByProv)) {
    list.sort((a, b) => getMaxYt(b) - getMaxYt(a));
    senators.push(...list.slice(0, 3));
  }

  // Deputies
  const dipPool = normalized.filter(l => l.c === 'diputados');
  dipPool.sort((a, b) => getMaxYt(b) - getMaxYt(a));
  const deputies = dipPool.slice(0, DEPUTY_SEATS);

  return [...senators, ...deputies];
}

function computeBlocs(legislators, chamber, totalSeats) {
  const chamberLeg = legislators.filter(l => l.c === chamber);
  const byCo = {};

  for (const co of COALITION_ORDER) {
    byCo[co] = 0;
  }

  for (const leg of chamberLeg) {
    const co = leg.co || 'OTROS';
    const key = COALITION_ORDER.includes(co) ? co : 'OTROS';
    byCo[key] = (byCo[key] || 0) + 1;
  }

  return COALITION_ORDER.map(co => ({
    code: co,
    label: COALITION_LABELS[co],
    seats: byCo[co] || 0,
    color: COALITION_COLORS[co],
  })).filter(b => b.seats > 0);
}

function groupByProvince(legislators) {
  const byProv = {};
  for (const leg of legislators) {
    const prov = leg.p || 'Desconocido';
    if (!byProv[prov]) byProv[prov] = [];
    byProv[prov].push(leg);
  }
  return byProv;
}

export default function useCongressData() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && data?.length > 0) {
          setRaw(data);
          setLoading(false);
          return;
        }
      }
    } catch {}

    fetch('https://comovoto.dev.ar/data/legislators.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setRaw(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        } catch {}
      })
      .catch(err => {
        console.error('Congress data fetch failed:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const processed = useMemo(() => {
    if (!raw) return null;

    const current = filterCurrent(raw);
    const senators = current.filter(l => l.c === 'senadores');
    const deputies = current.filter(l => l.c === 'diputados');

    const senateBlocs = computeBlocs(current, 'senadores');
    const deputyBlocs = computeBlocs(current, 'diputados');

    // Add "S/D" (sin datos) bloc for missing seats
    const senateCounted = senateBlocs.reduce((s, b) => s + b.seats, 0);
    if (senateCounted < SENATE_SEATS) {
      senateBlocs.push({ code: 'SD', label: 'S/D', seats: SENATE_SEATS - senateCounted, color: '#1a3a5c' });
    }
    const deputyCounted = deputyBlocs.reduce((s, b) => s + b.seats, 0);
    if (deputyCounted < DEPUTY_SEATS) {
      deputyBlocs.push({ code: 'SD', label: 'S/D', seats: DEPUTY_SEATS - deputyCounted, color: '#1a3a5c' });
    }

    return {
      senators,
      deputies,
      senateBlocs,
      deputyBlocs,
      byProvince: groupByProvince(current),
      totalSenators: SENATE_SEATS,
      totalDeputies: DEPUTY_SEATS,
    };
  }, [raw]);

  return { congress: processed, loading, error };
}
