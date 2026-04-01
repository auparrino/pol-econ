import { useState } from 'react';
import useNewsSummary from '../hooks/useNewsSummary';

function formatInline(text) {
  // Handle **bold** inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Empty line → small spacer
    if (!line.trim()) { elements.push(<div key={i} className="h-1" />); i++; continue; }

    // ## Header
    if (line.startsWith('## ')) {
      elements.push(<p key={i} className="font-bold text-[12px] uppercase tracking-wide text-[#003049]/60 mt-2 mb-0.5">{line.slice(3)}</p>);
      i++; continue;
    }
    // # Header
    if (line.startsWith('# ')) {
      elements.push(<p key={i} className="font-bold text-[13px] text-[#003049] mt-2 mb-0.5">{line.slice(2)}</p>);
      i++; continue;
    }

    // **Bold line** that is a standalone section header (only bold, nothing else)
    if (/^\*\*[^*]+\*\*:?$/.test(line.trim())) {
      elements.push(<p key={i} className="font-semibold text-[12px] uppercase tracking-wide text-[#003049]/60 mt-2 mb-0.5">{line.trim().replace(/^\*\*|\*\*:?$/g, '')}</p>);
      i++; continue;
    }

    // Bullet point (- or *)
    if (/^[\-\*]\s/.test(line)) {
      const content = line.replace(/^[\-\*]\s+/, '');
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="mt-[6px] shrink-0 w-1 h-1 rounded-full bg-[#003049]/40" />
          <span className="flex-1">{formatInline(content)}</span>
        </div>
      );
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={i}>{formatInline(line)}</p>);
    i++;
  }
  return elements;
}

const TIMEFRAMES = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export default function ProvinceNews({ province }) {
  const [activeTimeframe, setActiveTimeframe] = useState(null);
  const { summary, loading, error, articleCount, generate } = useNewsSummary();

  const handleClick = (tf) => {
    setActiveTimeframe(tf);
    generate(province, tf);
  };

  return (
    <div>
      <h3
        className="text-[15px] font-bold tracking-[1.5px] uppercase text-steel mb-2 border-b pb-1"
        style={{ borderColor: 'rgba(0,48,73,0.12)' }}
      >
        Provincial News
      </h3>

      {/* Timeframe buttons */}
      <div className="flex gap-2 mb-2">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.id}
            onClick={() => handleClick(tf.id)}
            className="text-[13px] font-medium rounded-full transition-all"
            style={activeTimeframe === tf.id
              ? { background: '#003049', color: '#FDF0D5', padding: '6px 16px', border: '1px solid #003049' }
              : { background: 'rgba(0,48,73,0.06)', color: '#003049', padding: '6px 16px', border: '1px solid rgba(0,48,73,0.15)' }
            }
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-[#003049]/20 border-t-[#003049]/60 rounded-full animate-spin" />
          <span className="text-[13px] text-[#003049]/60">Loading summary...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-[13px] text-[#C1121F]/80 bg-[#C1121F]/5 rounded-md px-3 py-2 border border-[#C1121F]/15">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && !loading && (
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-wider text-[#003049]/40 font-semibold">
            AI Summary · {articleCount} articles · {activeTimeframe === 'today' ? 'Today' : activeTimeframe === 'week' ? 'Last 7 days' : 'Last 30 days'}
          </div>
          <div className="text-[13px] text-[#003049] leading-relaxed bg-[#003049]/4 rounded-md px-3 py-2.5 border border-[#003049]/8 flex flex-col gap-0.5">
            {renderMarkdown(summary)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeTimeframe && !loading && !summary && !error && (
        <p className="text-[12px] text-[#003049]/40 italic py-1">
          Select a timeframe to generate an AI summary of provincial news.
        </p>
      )}
    </div>
  );
}
