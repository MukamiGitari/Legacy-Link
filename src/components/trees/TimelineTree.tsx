import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { membersByGeneration, fullName, lifespan } from '../../lib/lineage';

interface Props {
  onSelect: (memberId: string) => void;
}

export const TimelineTree: React.FC<Props> = ({ onSelect }) => {
  const { data } = useApp();

  const rows = useMemo(() => {
    const byGen = membersByGeneration(data.members);
    return Array.from(byGen.entries())
      .sort(([a], [b]) => a - b)
      .map(([gen, members]) => ({
        gen,
        members: [...members].sort((a, b) => (a.dateOfBirth ?? '').localeCompare(b.dateOfBirth ?? '')),
      }));
  }, [data.members]);

  return (
    <div className="rounded-2xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 md:p-8 space-y-10">
      {rows.map(({ gen, members }) => (
        <div key={gen} className="relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-heritage-green-800 text-white text-xs font-semibold shrink-0">
              G{gen}
            </span>
            <h3 className="font-serif text-heritage-green-900 dark:text-heritage-dark-text">Generation {gen}</h3>
            <div className="h-px flex-1 bg-heritage-cream-400 dark:bg-heritage-dark-border" />
          </div>

          <div className="relative pb-2">
            <div className="flex items-start gap-6 pl-4 min-w-max">
              <div className="absolute left-4 right-4 top-6 h-0.5 bg-heritage-gold-300 dark:bg-heritage-gold-700" />
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className="relative flex flex-col items-center w-28 group"
                >
                  <span className="w-3 h-3 rounded-full bg-heritage-gold-500 ring-4 ring-heritage-cream-100 dark:ring-heritage-dark-card z-10 mb-2 group-hover:scale-125 transition-transform" />
                  <img src={m.avatarUrl} className="w-14 h-14 rounded-full bg-heritage-cream-200 border-2 border-white dark:border-heritage-dark-border shadow-soft" alt="" />
                  <p className="mt-1.5 text-xs font-medium text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight">{fullName(m)}</p>
                  <p className="text-[10px] text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(m)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
