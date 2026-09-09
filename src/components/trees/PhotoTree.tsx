import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { buildForest } from '../../lib/treeBuilder';
import { OrgChartForest } from './OrgChartNode';
import { fullName, lifespan } from '../../lib/lineage';
import type { Member } from '../../types';

interface Props {
  onSelect: (memberId: string) => void;
}

export const PhotoTree: React.FC<Props> = ({ onSelect }) => {
  const { data } = useApp();
  const roots = useMemo(() => buildForest(data.members, data.relationships), [data.members, data.relationships]);

  const renderCard = (m: Member) => (
    <div className="w-28 flex flex-col items-center">
      <div className="w-24 h-28 rounded-lg overflow-hidden ring-2 ring-heritage-gold-400 shadow-soft-lg bg-heritage-cream-100">
        <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" />
      </div>
      <p className="mt-2 text-xs font-semibold text-heritage-green-900 dark:text-heritage-dark-text text-center leading-tight">{fullName(m)}</p>
      <p className="text-[10px] text-heritage-gold-600 dark:text-heritage-gold-400">{lifespan(m)}</p>
    </div>
  );

  return (
    <div className="rounded-2xl bg-heritage-green-950 p-6 md:p-10">
      <OrgChartForest roots={roots} renderCard={renderCard} onSelect={onSelect} lineColor="#d4af37" />
    </div>
  );
};
