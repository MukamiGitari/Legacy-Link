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

export const PhotoTree: React.FC<Props> = ({ onSelect, filter = 'bloodline' }) => {
  const { data } = useApp();
  const roots = useMemo(() => buildForest(data.members, data.relationships, { filter }), [data.members, data.relationships, filter]);

  const renderCard = (m: Member, meta?: CardRenderMeta) => {
    const isSpouse = meta?.isSpouse || meta?.isMarriedIn;
    return (
      <div className="w-28 flex flex-col items-center">
        <div className="relative w-24 h-28 rounded-lg overflow-hidden ring-2 ring-heritage-gold-400 shadow-soft-lg bg-heritage-cream-100">
          <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" />
          {isSpouse && (
            <span
              className="absolute top-1 right-1 text-[9px] bg-amber-100/90 text-amber-900 border border-amber-300 px-1 py-0.2 rounded-full shadow-xs"
              title="Married into the family"
            >
              💍
            </span>
          )}
        </div>
        <p className="mt-2 text-xs font-semibold text-white text-center leading-tight truncate w-full">{fullName(m)}</p>
        <p className="text-[10px] text-heritage-gold-400">{lifespan(m)}</p>
        {isSpouse && (
          <span className="mt-0.5 text-[8px] font-medium px-1.5 py-0.2 rounded-full border bg-amber-950/80 text-amber-200 border-amber-800">
            Married In
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-heritage-green-950 p-6 md:p-10">
      <OrgChartForest roots={roots} renderCard={renderCard} onSelect={onSelect} lineColor="#d4af37" />
    </div>
  );
};
