import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { buildForest } from '../../lib/treeBuilder';
import { OrgChartForest } from './OrgChartNode';
import { fullName, lifespan } from '../../lib/lineage';
import type { Member } from '../../types';

interface Props {
  onSelect: (memberId: string) => void;
}

export const HeritageTree: React.FC<Props> = ({ onSelect }) => {
  const { data } = useApp();
  const roots = useMemo(() => buildForest(data.members, data.relationships), [data.members, data.relationships]);

  const renderCard = (m: Member) => (
    <div className="w-28 flex flex-col items-center">
      <div className="relative w-20 h-20 rounded-t-full rounded-b-lg border-[3px] border-heritage-gold-600 p-0.5 bg-heritage-cream-100 shadow-vintage">
        <img
          src={m.avatarUrl}
          className="w-full h-full rounded-t-full rounded-b-md object-cover"
          style={{ filter: 'sepia(0.55) contrast(1.05)' }}
          alt=""
        />
        {!m.isLiving && (
          <span className="absolute -bottom-1 -right-1 text-[9px] bg-heritage-bark-700 text-heritage-cream-50 px-1 rounded">
            ✝
          </span>
        )}
      </div>
      <p className="mt-1.5 font-cinzel text-[11px] tracking-wide text-heritage-bark-900 dark:text-heritage-dark-text text-center leading-tight">
        {fullName(m)}
      </p>
      <p className="text-[10px] text-heritage-bark-600 dark:text-heritage-dark-muted italic">{lifespan(m)}</p>
    </div>
  );

  return (
    // Same fix as ClassicTree: keep this outer box overflow-visible so it isn't
    // treated as flex-shrinkable down to nothing by ZoomPanViewport's centering
    // wrapper — the decorative border/backdrop is clipped in its own inset layer.
    <div className="relative rounded-2xl border-[6px] border-double border-heritage-gold-700/60">
      <div className="absolute inset-0 rounded-[10px] overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: '#f3ece0',
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(197,160,89,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(111,79,62,0.10), transparent 45%)',
          }}
        />
        {/* corner flourishes */}
        {['top-3 left-3', 'top-3 right-3 rotate-90', 'bottom-3 left-3 -rotate-90', 'bottom-3 right-3 rotate-180'].map(pos => (
          <svg key={pos} className={`absolute ${pos} w-10 h-10 text-heritage-gold-600/50 pointer-events-none`} viewBox="0 0 40 40" fill="none">
            <path d="M2 2 Q2 20 20 20 Q2 20 2 38" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="2" cy="2" r="2" fill="currentColor" />
          </svg>
        ))}
      </div>

      <div className="relative p-6 md:p-10">
        <p className="text-center font-cinzel text-sm tracking-[0.15em] text-heritage-gold-700 mb-6">~ ANCESTRAL RECORD ~</p>
        <OrgChartForest roots={roots} renderCard={renderCard} onSelect={onSelect} lineColor="#846332" />
      </div>
    </div>
  );
};
