import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import type { Page } from '../../App';

interface Props {
  onNavigate: (p: Page) => void;
  onSelectMember: (id: string) => void;
}

interface Hit {
  key: string;
  kind: string;
  label: string;
  sub?: string;
  go: () => void;
}

const MAX_PER_KIND = 4;

/** "Search archives…" box — finds members, memories, recipes and Vault entries. */
export const GlobalSearch: React.FC<Props> = ({ onNavigate, onSelectMember }) => {
  const { data } = useApp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const has = (...fields: (string | undefined)[]) => fields.some(f => f?.toLowerCase().includes(q));
    const out: Hit[] = [];

    data.members
      .filter(m => has(fullName(m), m.maidenName, m.occupation, m.birthPlace))
      .slice(0, MAX_PER_KIND)
      .forEach(m => out.push({
        key: `m-${m.id}`, kind: 'Member', label: fullName(m),
        sub: m.occupation || m.birthPlace, go: () => onSelectMember(m.id),
      }));

    data.memories
      .filter(m => has(m.title, m.body, m.era))
      .slice(0, MAX_PER_KIND)
      .forEach(m => out.push({
        key: `mem-${m.id}`, kind: 'Memory', label: m.title, sub: m.era, go: () => onNavigate('memories'),
      }));

    data.recipes
      .filter(r => has(r.title, r.familyStory))
      .slice(0, MAX_PER_KIND)
      .forEach(r => out.push({
        key: `r-${r.id}`, kind: 'Recipe', label: r.title, go: () => onNavigate('cookbook'),
      }));

    data.languageEntries
      .filter(e => has(e.term, e.meaning, e.answer))
      .slice(0, MAX_PER_KIND)
      .forEach(e => out.push({
        key: `v-${e.id}`, kind: 'Vault', label: e.term, sub: e.meaning, go: () => onNavigate('dictionary'),
      }));

    return out;
  }, [query, data, onNavigate, onSelectMember]);

  const pick = (h: Hit) => {
    h.go();
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-500 dark:text-heritage-dark-muted pointer-events-none" />
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && hits[0]) pick(hits[0]);
        }}
        placeholder="Search archives..."
        aria-label="Search archives"
        className="w-full rounded-full border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-hover dark:text-heritage-dark-text pl-9 pr-8 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(''); setOpen(false); }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-heritage-green-500 hover:text-heritage-green-800"
        >
          <X size={14} />
        </button>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-80 overflow-y-auto rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card shadow-soft-lg">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-heritage-green-600 dark:text-heritage-dark-muted">No matches for “{query.trim()}”.</p>
          ) : (
            hits.map(h => (
              <button
                key={h.key}
                type="button"
                onClick={() => pick(h)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover"
              >
                <span className="shrink-0 w-16 text-[10px] uppercase tracking-wide font-semibold text-heritage-gold-600 dark:text-heritage-gold-400">{h.kind}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-heritage-green-900 dark:text-heritage-dark-text truncate">{h.label}</span>
                  {h.sub && <span className="block text-xs text-heritage-green-500 dark:text-heritage-dark-muted truncate">{h.sub}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
