import React from 'react';
import { TreePine, GanttChartSquare, Images, CircleDot, Rows3, ScrollText, Check, type LucideIcon } from 'lucide-react';
import type { TreeTemplate } from '../../types';

const TEMPLATES: { id: TreeTemplate; label: string; icon: LucideIcon }[] = [
  { id: 'classic', label: 'Classic', icon: TreePine },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'photo', label: 'Photo Tree', icon: Images },
  { id: 'radial', label: 'Radial', icon: CircleDot },
  { id: 'minimalist', label: 'Minimalist', icon: Rows3 },
  { id: 'heritage', label: 'Heritage', icon: ScrollText },
];

interface Props {
  active: TreeTemplate;
  onChange: (t: TreeTemplate) => void;
}

export const TreeTemplateSwitcher: React.FC<Props> = ({ active, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {TEMPLATES.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors
            ${isActive
              ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
              : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
            }`}
        >
          {isActive ? <Check size={13} /> : <Icon size={13} />}
          {label}
        </button>
      );
    })}
  </div>
);
