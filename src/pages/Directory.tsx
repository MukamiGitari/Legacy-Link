import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName, lifespan } from '../lib/lineage';

type FilterKey = 'all' | 'living' | 'deceased' | 'gen1' | 'gen2' | 'gen3' | 'gen4' | 'male' | 'female';
const PAGE_SIZE = 12;

interface Props {
  onSelectMember: (id: string) => void;
}

export const Directory: React.FC<Props> = ({ onSelectMember }) => {
  const { data } = useApp();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = data.members;
    if (filter === 'living') list = list.filter(m => m.isLiving);
    else if (filter === 'deceased') list = list.filter(m => !m.isLiving);
    else if (filter.startsWith('gen')) list = list.filter(m => m.generation === Number(filter.slice(3)));
    else if (filter === 'male' || filter === 'female') list = list.filter(m => m.gender === filter);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m => fullName(m).toLowerCase().includes(q) || m.occupation?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.generation - b.generation || a.firstName.localeCompare(b.firstName));
  }, [data.members, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'living', label: 'Living' },
    { key: 'deceased', label: 'Deceased' },
    { key: 'gen1', label: 'Gen 1' },
    { key: 'gen2', label: 'Gen 2' },
    { key: 'gen3', label: 'Gen 3' },
    { key: 'gen4', label: 'Gen 4' },
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
          />
        </div>
        <div className="flex items-center gap-1 bg-heritage-cream-200 dark:bg-heritage-dark-hover rounded-lg p-1">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white dark:bg-heritage-dark-card shadow-soft' : ''}`}><LayoutGrid size={16} className="text-heritage-green-700 dark:text-heritage-dark-muted" /></button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white dark:bg-heritage-dark-card shadow-soft' : ''}`}><List size={16} className="text-heritage-green-700 dark:text-heritage-dark-muted" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
              ${filter === f.key
                ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{filtered.length} member{filtered.length !== 1 && 's'}</p>

      {view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paged.map(m => (
            <button
              key={m.id}
              onClick={() => onSelectMember(m.id)}
              className="flex flex-col items-center rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
            >
              <img src={m.avatarUrl} className="w-16 h-16 rounded-full bg-heritage-cream-200" alt="" />
              <p className="mt-2 text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight">{fullName(m)}</p>
              <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(m)}</p>
              <span className={`mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${m.isLiving ? 'bg-heritage-green-100 text-heritage-green-700' : 'bg-heritage-bark-100 text-heritage-bark-700'}`}>
                Gen {m.generation}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-heritage-green-500 dark:text-heritage-dark-muted border-b border-heritage-cream-300 dark:border-heritage-dark-border">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Occupation</th>
                <th className="px-4 py-2.5 font-medium">Gen</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(m => (
                <tr
                  key={m.id}
                  onClick={() => onSelectMember(m.id)}
                  className="border-b last:border-0 border-heritage-cream-200 dark:border-heritage-dark-border hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover cursor-pointer"
                >
                  <td className="px-4 py-2.5 flex items-center gap-2.5">
                    <img src={m.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-cream-200" alt="" />
                    <div>
                      <p className="font-medium text-heritage-green-900 dark:text-heritage-dark-text">{fullName(m)}</p>
                      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(m)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-heritage-green-700 dark:text-heritage-dark-muted hidden sm:table-cell">{m.occupation ?? '—'}</td>
                  <td className="px-4 py-2.5 text-heritage-green-700 dark:text-heritage-dark-muted">{m.generation}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.isLiving ? 'bg-heritage-green-100 text-heritage-green-700' : 'bg-heritage-bark-100 text-heritage-bark-700'}`}>
                      {m.isLiving ? 'Living' : 'Deceased'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-heritage-green-800 text-white' : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
