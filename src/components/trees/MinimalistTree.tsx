import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { buildForest } from '../../lib/treeBuilder';
import { OrgChartForest } from './OrgChartNode';
import { fullName, lifespan } from '../../lib/lineage';
import type { Member } from '../../types';

interface Props {
  onSelect: (memberId: string) => void;
}

export const MinimalistTree: React.FC<Props> = ({ onSelect }) => {
  const { data } = useApp();
  const roots = useMemo(() => buildForest(data.members, data.relationships), [data.members, data.relationships]);

  const renderCard = (m: Member) => (
    <div className="w-36 text-left rounded-md border border-heritage-green-800/70 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-hover px-3 py-2 hover:border-heritage-green-900 dark:hover:border-heritage-gold-400 transition-colors">
      <p className="text-[13px] font-medium text-heritage-green-900 dark:text-heritage-dark-text leading-tight">{fullName(m)}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(m)}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${m.isLiving ? 'bg-heritage-green-500' : 'bg-heritage-bark-500'}`} />
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 md:p-10">
      <OrgChartForest roots={roots} renderCard={renderCard} onSelect={onSelect} lineColor="#c5b499" />
    </div>
  );
};
