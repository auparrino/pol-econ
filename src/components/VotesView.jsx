import { useMemo, useState } from 'react';
import votacionesRaw from '../data/votaciones.json';
import alignmentScores from '../data/alignmentScores.json';
import executivePositions from '../data/executivePositions.json';
import { normalizeBloc } from '../utils/blocs';

/*
 * Legislator Finder
 * -----------------
 * A filterable, sortable table of all 328 legislators. Built for GR/advocacy
 * work where the actual question is "Which specific legislators should I be
 * talking to about bill X, and how have they voted on prior tests?" — not
 * "what color is Chubut on this map".
 *
 * Filters: text search, chamber, province, bloc, vote position on any tracked vote.
 * Sort: any column.
 * Export: copy-to-clipboard of filtered rows as TSV.
 */

const legListRaw = Array.isArray(votacionesRaw) ? votacionesRaw : Object.values(votacionesRaw);

// Enrich each legislator with alignment scores (from alignmentScores.json, computed by scripts/compute-alignment.mjs).
const LEGS = legListRaw.map((l, i) => {
  const scoreEntry = alignmentScores.per_legislator?.[l.n] || null;
  return {
    idx: i,
    name: l.n,
    bloc: normalizeBloc(l.b),
    blocRaw: l.b,
    province: l.p,
    chamber: l.c,
    votes: l.v || {},
    scoreExec: scoreEntry?.score_executive ?? null,
    scoreBloc: scoreEntry?.score_bloc ?? null,
    rateAbsent: scoreEntry?.rate_absent ?? null,
  };
});

const PROVINCES = [...new Set(LEGS.map(l => l.province).filter(Boolean))].sort();
const BLOCS = [...new Set(LEGS.map(l => l.bloc).filter(Boolean))].sort();

const VOTE_TOPICS = executivePositions.positions;

const VOTE_LABEL = { A: 'A', N: 'N', ABS: 'Abs' };
const VOTE_COLOR = {
  A: { bg: '#17a58922', text: '#17a589' },
  N: { bg: '#C1121F22', text: '#C1121F' },
  ABS: { bg: '#d4a80022', text: '#d4a800' },
};

function VoteCell({ vote, execPos }) {
  if (!vote) {
    return (
      <span
        className="inline-flex items-center justify-center w-[22px] h-[16px] rounded-sm text-[8px] font-bold"
        style={{ background: 'transparent', color: 'rgba(0,48,73,0.35)', border: '1px dashed rgba(0,48,73,0.35)' }}
        title="Absent"
      >
        —
      </span>
    );
  }
  const c = VOTE_COLOR[vote] || VOTE_COLOR.A;
  const againstExec = execPos && vote !== execPos && vote !== 'ABS';
  return (
    <span
      className="inline-flex items-center justify-center w-[22px] h-[16px] rounded-sm text-[9px] font-bold relative"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.text}55` }}
      title={againstExec ? `${VOTE_LABEL[vote]} — against executive` : VOTE_LABEL[vote]}
    >
      {VOTE_LABEL[vote]}
      {againstExec && (
        <span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: '#003049', border: '1px solid #FFF8EB' }}
        />
      )}
    </span>
  );
}

function MetricBadge({ value, colorMap }) {
  if (value == null) return <span className="text-[11px] text-[#003049]/30">—</span>;
  const pct = Math.round(value * 100);
  const color = colorMap ? colorMap(pct) : '#003049';
  return (
    <span className="text-[11px] font-mono font-bold" style={{ color }}>
      {pct}%
    </span>
  );
}

function execColor(pct) {
  if (pct >= 80) return '#7d3c98';
  if (pct >= 60) return '#17a589';
  if (pct >= 40) return '#d4a800';
  if (pct >= 20) return '#e67e22';
  return '#780000';
}

function ChamberBadge({ c }) {
  const label = c === 'S' ? 'SEN' : c === 'D' ? 'DIP' : c || '';
  const bg = c === 'S' ? '#003049' : '#669BBC';
  return (
    <span
      className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: bg, color: '#FDF0D5' }}
    >
      {label}
    </span>
  );
}

export default function VotesView({ onExit, mobile = false }) {
  const [query, setQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [blocFilter, setBlocFilter] = useState('');
  const [chamberFilter, setChamberFilter] = useState(''); // '', 'S', 'D'
  const [voteFilter, setVoteFilter] = useState({ voteId: '', position: '' }); // e.g. { voteId: 'presupuesto_2026', position: 'A' }
  const [sortBy, setSortBy] = useState('scoreExec');
  const [sortDir, setSortDir] = useState('desc');
  const [execBreakers, setExecBreakers] = useState(false); // legislators who voted against the executive at least once
  const [blocBreakers, setBlocBreakers] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEGS.filter(l => {
      if (q) {
        const hay = `${l.name} ${l.bloc} ${l.province}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (provinceFilter && l.province !== provinceFilter) return false;
      if (blocFilter && l.bloc !== blocFilter) return false;
      if (chamberFilter && l.chamber !== chamberFilter) return false;
      if (voteFilter.voteId) {
        const v = l.votes[voteFilter.voteId];
        if (voteFilter.position === 'ABSENT') {
          if (v) return false;
        } else {
          if (!v || v !== voteFilter.position) return false;
        }
      }
      if (execBreakers) {
        // legislator cast at least one vote against the executive
        let broke = false;
        for (const p of VOTE_TOPICS) {
          const v = l.votes[p.vote_id];
          if (v && v !== 'ABS' && v !== p.executive_position) { broke = true; break; }
        }
        if (!broke) return false;
      }
      if (blocBreakers) {
        // rough signal: scoreBloc is <0.75 AND we have data
        if (l.scoreBloc == null || l.scoreBloc >= 0.75) return false;
      }
      return true;
    });
  }, [query, provinceFilter, blocFilter, chamberFilter, voteFilter, execBreakers, blocBreakers]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const mul = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let va, vb;
      if (sortBy === 'name') { va = a.name || ''; vb = b.name || ''; return va.localeCompare(vb) * mul; }
      if (sortBy === 'province') { va = a.province || ''; vb = b.province || ''; return va.localeCompare(vb) * mul; }
      if (sortBy === 'bloc') { va = a.bloc || ''; vb = b.bloc || ''; return va.localeCompare(vb) * mul; }
      if (sortBy === 'chamber') { va = a.chamber || ''; vb = b.chamber || ''; return va.localeCompare(vb) * mul; }
      if (sortBy === 'scoreExec') { va = a.scoreExec ?? -1; vb = b.scoreExec ?? -1; return (va - vb) * mul; }
      if (sortBy === 'scoreBloc') { va = a.scoreBloc ?? -1; vb = b.scoreBloc ?? -1; return (va - vb) * mul; }
      if (sortBy === 'rateAbsent') { va = a.rateAbsent ?? -1; vb = b.rateAbsent ?? -1; return (va - vb) * mul; }
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  }

  function clearFilters() {
    setQuery('');
    setProvinceFilter('');
    setBlocFilter('');
    setChamberFilter('');
    setVoteFilter({ voteId: '', position: '' });
    setExecBreakers(false);
    setBlocBreakers(false);
  }

  function copyTSV() {
    const headers = ['Name', 'Chamber', 'Province', 'Bloc', 'w/Exec', 'w/Bloc', 'Absent', ...VOTE_TOPICS.map(p => p.topic)];
    const lines = [headers.join('\t')];
    for (const l of sorted) {
      const row = [
        l.name,
        l.chamber === 'S' ? 'Senator' : 'Deputy',
        l.province,
        l.bloc,
        l.scoreExec != null ? `${Math.round(l.scoreExec * 100)}%` : '',
        l.scoreBloc != null ? `${Math.round(l.scoreBloc * 100)}%` : '',
        l.rateAbsent != null ? `${Math.round(l.rateAbsent * 100)}%` : '',
        ...VOTE_TOPICS.map(p => l.votes[p.vote_id] || 'AUS'),
      ];
      lines.push(row.join('\t'));
    }
    navigator.clipboard?.writeText(lines.join('\n'));
  }

  const SortHeader = ({ col, children }) => (
    <button
      onClick={() => toggleSort(col)}
      className="flex items-center gap-0.5 text-left w-full"
    >
      <span>{children}</span>
      {sortBy === col && <span className="text-[9px] text-[#003049]/60">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  return (
    <div className="h-full w-full flex flex-col" style={{ background: '#FFF8EB' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,48,73,0.10)', padding: '10px 16px' }}>
        <div className="min-w-0">
          <h1 className="text-[17px] font-black text-[#003049] tracking-tight leading-none">Legislator Finder</h1>
          <p className="text-[10px] text-[#003049]/55 mt-1 leading-snug">
            Filterable register of all 328 national legislators — who they are, how they voted on tracked bills, how often they align with the executive and their own bloc.
          </p>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded shrink-0 ml-2"
            style={{ background: '#003049', color: '#FDF0D5' }}
          >
            ← Atlas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b" style={{ borderColor: 'rgba(0,48,73,0.08)', padding: '10px 16px' }}>
        <div className={`flex flex-wrap items-center gap-2 ${mobile ? '' : ''}`}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name / bloc / province…"
            className="flex-1 min-w-[180px] text-[12px] px-3 py-1.5 rounded border"
            style={{ background: '#fff', borderColor: 'rgba(0,48,73,0.18)', color: '#003049' }}
          />
          <select
            value={chamberFilter}
            onChange={(e) => setChamberFilter(e.target.value)}
            className="text-[12px] px-2 py-1.5 rounded border"
            style={{ background: '#fff', borderColor: 'rgba(0,48,73,0.18)', color: '#003049' }}
          >
            <option value="">All chambers</option>
            <option value="D">Deputies</option>
            <option value="S">Senators</option>
          </select>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="text-[12px] px-2 py-1.5 rounded border"
            style={{ background: '#fff', borderColor: 'rgba(0,48,73,0.18)', color: '#003049', maxWidth: 180 }}
          >
            <option value="">All provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={blocFilter}
            onChange={(e) => setBlocFilter(e.target.value)}
            className="text-[12px] px-2 py-1.5 rounded border"
            style={{ background: '#fff', borderColor: 'rgba(0,48,73,0.18)', color: '#003049', maxWidth: 200 }}
          >
            <option value="">All blocs</option>
            {BLOCS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button
            onClick={clearFilters}
            className="text-[11px] font-semibold px-2 py-1.5 rounded"
            style={{ background: 'rgba(0,48,73,0.08)', color: '#003049' }}
          >
            Clear
          </button>
          <button
            onClick={copyTSV}
            className="text-[11px] font-semibold px-2 py-1.5 rounded"
            style={{ background: '#003049', color: '#FDF0D5' }}
            title="Copy filtered rows as TSV (paste into Excel/Sheets)"
          >
            Copy TSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[9px] uppercase tracking-wider text-[#003049]/50 font-semibold">Vote filter:</span>
          <select
            value={voteFilter.voteId}
            onChange={(e) => setVoteFilter(v => ({ ...v, voteId: e.target.value }))}
            className="text-[11px] px-2 py-1 rounded border"
            style={{ background: '#fff', borderColor: 'rgba(0,48,73,0.18)', color: '#003049' }}
          >
            <option value="">—</option>
            {VOTE_TOPICS.map(p => <option key={p.vote_id} value={p.vote_id}>{p.topic}</option>)}
          </select>
          {voteFilter.voteId && (
            <>
              <span className="text-[11px] text-[#003049]/60">=</span>
              {['A', 'N', 'ABS', 'ABSENT'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setVoteFilter(v => ({ ...v, position: v.position === pos ? '' : pos }))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={voteFilter.position === pos
                    ? { background: '#003049', color: '#FDF0D5' }
                    : { background: 'rgba(0,48,73,0.08)', color: '#003049' }
                  }
                >
                  {pos === 'ABSENT' ? 'Absent' : pos}
                </button>
              ))}
            </>
          )}
          <span className="mx-2 w-px h-4" style={{ background: 'rgba(0,48,73,0.2)' }} />
          <label className="flex items-center gap-1 text-[10px] text-[#003049] cursor-pointer">
            <input type="checkbox" checked={execBreakers} onChange={(e) => setExecBreakers(e.target.checked)} />
            Broke with executive
          </label>
          <label className="flex items-center gap-1 text-[10px] text-[#003049] cursor-pointer">
            <input type="checkbox" checked={blocBreakers} onChange={(e) => setBlocBreakers(e.target.checked)} />
            Broke with bloc (&lt;75%)
          </label>
        </div>

        <div className="mt-2 text-[10px] text-[#003049]/55">
          {sorted.length} of {LEGS.length} legislators
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: mobile ? 720 : 900 }}>
          <thead className="sticky top-0 z-10" style={{ background: '#FFF8EB', borderBottom: '1px solid rgba(0,48,73,0.15)' }}>
            <tr className="text-[9px] uppercase tracking-wider text-[#003049]/55">
              <th className="text-left px-2 py-2 font-semibold" style={{ minWidth: 220 }}>
                <SortHeader col="name">Name</SortHeader>
              </th>
              <th className="text-left px-1 py-2 font-semibold"><SortHeader col="chamber">C</SortHeader></th>
              <th className="text-left px-2 py-2 font-semibold" style={{ minWidth: 100 }}><SortHeader col="province">Province</SortHeader></th>
              <th className="text-left px-2 py-2 font-semibold" style={{ minWidth: 140 }}><SortHeader col="bloc">Bloc</SortHeader></th>
              <th className="text-right px-1.5 py-2 font-semibold" title="% votes matching executive position">
                <SortHeader col="scoreExec">w/Exec</SortHeader>
              </th>
              <th className="text-right px-1.5 py-2 font-semibold" title="% votes matching own bloc's majority">
                <SortHeader col="scoreBloc">w/Bloc</SortHeader>
              </th>
              <th className="text-right px-1.5 py-2 font-semibold" title="% of listed votes where legislator was absent">
                <SortHeader col="rateAbsent">Abs</SortHeader>
              </th>
              {VOTE_TOPICS.map(p => (
                <th
                  key={p.vote_id}
                  className="text-center px-0.5 py-2 font-semibold"
                  style={{ minWidth: 36 }}
                  title={`${p.topic} · Executive: ${p.executive_position === 'A' ? 'in favor' : 'against'}`}
                >
                  {p.topic.split(' ').map(w => w[0]).join('').slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(l => (
              <tr
                key={l.idx}
                className="border-b hover:bg-[#003049]/5"
                style={{ borderColor: 'rgba(0,48,73,0.06)' }}
              >
                <td className="px-2 py-1.5 text-[#003049]">{l.name}</td>
                <td className="px-1 py-1.5"><ChamberBadge c={l.chamber} /></td>
                <td className="px-2 py-1.5 text-[#003049]/75">{l.province}</td>
                <td className="px-2 py-1.5 text-[#003049]/75 truncate" style={{ maxWidth: 180 }} title={l.bloc}>{l.bloc}</td>
                <td className="px-1.5 py-1.5 text-right"><MetricBadge value={l.scoreExec} colorMap={execColor} /></td>
                <td className="px-1.5 py-1.5 text-right"><MetricBadge value={l.scoreBloc} /></td>
                <td className="px-1.5 py-1.5 text-right"><MetricBadge value={l.rateAbsent} /></td>
                {VOTE_TOPICS.map(p => (
                  <td key={p.vote_id} className="px-0.5 py-1.5 text-center">
                    <VoteCell vote={l.votes[p.vote_id]} execPos={p.executive_position} />
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7 + VOTE_TOPICS.length} className="text-center py-8 text-[#003049]/40 italic">
                  No legislators match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="shrink-0 border-t flex flex-wrap items-center gap-3 text-[9px] text-[#003049]/60" style={{ borderColor: 'rgba(0,48,73,0.08)', padding: '6px 16px' }}>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#17a58944', border: '1px solid #17a589' }} />A = in favor</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#C1121F44', border: '1px solid #C1121F' }} />N = against</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#d4a80044', border: '1px solid #d4a800' }} />Abs = abstain</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'transparent', border: '1px dashed #003049' }} />— = absent</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#003049' }} />voted against executive</span>
        <span className="ml-auto text-[#003049]/40">Source: votaciones.hcdn.gob.ar + senado.gob.ar · alignmentScores.json</span>
      </div>
    </div>
  );
}
