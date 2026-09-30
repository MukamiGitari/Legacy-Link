import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { buildForest } from '../../lib/treeBuilder';
import { OrgChartForest, CardRenderMeta } from './OrgChartNode';
import { fullName, lifespan } from '../../lib/lineage';
import type { Member } from '../../types';

interface Props {
  onSelect: (memberId: string) => void;
  filter?: 'bloodline' | 'inlaws';
}

export const ClassicTree: React.FC<Props> = ({ onSelect, filter = 'bloodline' }) => {
  const { data } = useApp();
  const roots = useMemo(() => buildForest(data.members, data.relationships, { filter }), [data.members, data.relationships, filter]);

  const renderCard = (m: Member, meta?: CardRenderMeta) => {
    const wifeMeta = meta?.wifeMeta;
    const isSpouse = meta?.isSpouse || meta?.isMarriedIn;
    return (
      <div className="group flex flex-col items-center w-24">
        <div
          className={`relative w-16 h-16 rounded-full p-[3px] shadow-gold transition-transform group-hover:scale-105
            ${!wifeMeta
              ? m.isLiving ? 'bg-linear-to-br from-heritage-gold-300 to-heritage-gold-600' : 'bg-linear-to-br from-heritage-bark-300 to-heritage-bark-600'
              : ''
            }`}
          style={wifeMeta ? { backgroundColor: wifeMeta.color.ring } : undefined}
        >
          <img src={m.avatarUrl} className="w-full h-full rounded-full object-cover bg-heritage-cream-100 border-2 border-white" alt="" />
          {isSpouse && (
            <span
              className="absolute -top-1 -right-1 text-[9px] bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700 px-1 py-0.2 rounded-full shadow-xs"
              title="Married into the family"
            >
              💍
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs font-medium text-heritage-green-900 dark:text-heritage-dark-text leading-tight text-center truncate w-full">{fullName(m)}</p>
        <p className="text-[10px] text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(m)}</p>
        {wifeMeta && (
          <span
            className="mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border leading-tight text-center whitespace-nowrap"
            style={{ backgroundColor: wifeMeta.color.bg, color: wifeMeta.color.text, borderColor: wifeMeta.color.border }}
          >
            {wifeMeta.label}
          </span>
        )}
        {isSpouse && !wifeMeta && (
          <span className="mt-0.5 text-[8px] font-medium px-1.5 py-0.2 rounded-full border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
            Married In
          </span>
        )}
      </div>
    );
  };

  return (
    // Deliberately NOT `overflow-hidden` on this outer box: it's a flex item inside
    // ZoomPanViewport's centering wrapper, and `overflow-hidden` collapses a flex
    // item's automatic minimum size to 0 — letting the browser silently shrink this
    // whole tree (and thus crop its wider branches) to fit the frame, no matter what
    // zoom level is set. The decorative backdrop below gets its own clipped layer
    // instead, so rounded corners still look right without shrinking the real content.
    <div className="relative rounded-2xl border border-heritage-cream-400 dark:border-heritage-dark-border">
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {/* illustrated oak backdrop */}
        <div className="absolute inset-0 bg-linear-to-b from-heritage-cream-100 via-heritage-cream-200 to-heritage-green-100 dark:from-heritage-dark-bg dark:via-heritage-dark-bg dark:to-heritage-dark-hover" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.14] dark:opacity-[0.08]" preserveAspectRatio="xMidYMax slice" viewBox="0 0 800 500">
          <path d="M400 500 L400 320 Q400 260 340 240 Q280 220 260 160 M400 320 Q400 260 460 240 Q520 220 540 160 M400 380 Q400 340 340 320 Q260 300 220 260 M400 380 Q400 340 460 320 Q540 300 580 260"
            fill="none" stroke="#386b57" strokeWidth="10" strokeLinecap="round" />
          <circle cx="400" cy="150" r="150" fill="#4c866f" />
          <circle cx="250" cy="200" r="100" fill="#4c866f" />
          <circle cx="550" cy="200" r="100" fill="#4c866f" />
        </svg>
      </div>

      <div className="relative p-6 md:p-10">
        <OrgChartForest roots={roots} renderCard={renderCard} onSelect={onSelect} lineColor="#a68241" />
      </div>
    </div>
  );
};
