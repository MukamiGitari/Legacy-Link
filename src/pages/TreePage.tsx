import React, { useState } from 'react';
import { GitFork, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TreeTemplateSwitcher } from '../components/trees/TreeTemplateSwitcher';
import { ClassicTree } from '../components/trees/ClassicTree';
import { TimelineTree } from '../components/trees/TimelineTree';
import { PhotoTree } from '../components/trees/PhotoTree';
import { RadialTree } from '../components/trees/RadialTree';
import { MinimalistTree } from '../components/trees/MinimalistTree';
import { HeritageTree } from '../components/trees/HeritageTree';
import { ZoomPanViewport } from '../components/trees/ZoomPanViewport';

interface Props {
  onSelectMember: (id: string) => void;
}

export const TreePage: React.FC<Props> = ({ onSelectMember }) => {
  const { data, setActiveTreeTemplate } = useApp();
  const [treeFilter, setTreeFilter] = useState<'bloodline' | 'inlaws'>('bloodline');
  const template = data.family.activeTreeTemplate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
            Six ways to explore the same family — switch templates any time. Scroll/pinch to zoom, drag to pan, click any person to see their details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tree Filter: Bloodline only vs Include in-laws */}
          <div className="flex items-center rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-1 shadow-soft">
            <button
              onClick={() => setTreeFilter('bloodline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                treeFilter === 'bloodline'
                  ? 'bg-heritage-green-800 text-white shadow-xs'
                  : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
              }`}
              title="Show direct bloodline and spouses, keeping in-laws behind spouse family expanders"
            >
              <GitFork size={13} />
              <span>Bloodline only</span>
            </button>
            <button
              onClick={() => setTreeFilter('inlaws')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                treeFilter === 'inlaws'
                  ? 'bg-heritage-green-800 text-white shadow-xs'
                  : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
              }`}
              title="Include all family connections and in-law branches"
            >
              <Users size={13} />
              <span>Include in-laws</span>
            </button>
          </div>

          <TreeTemplateSwitcher active={template} onChange={setActiveTreeTemplate} />
        </div>
      </div>

      <ZoomPanViewport
        resetKey={`${template}-${treeFilter}`}
        className="border border-heritage-cream-400 dark:border-heritage-dark-border bg-heritage-cream-50 dark:bg-heritage-dark-card"
      >
        {template === 'classic' && <ClassicTree onSelect={onSelectMember} filter={treeFilter} />}
        {template === 'timeline' && <TimelineTree onSelect={onSelectMember} filter={treeFilter} />}
        {template === 'photo' && <PhotoTree onSelect={onSelectMember} filter={treeFilter} />}
        {template === 'radial' && <RadialTree onSelect={onSelectMember} filter={treeFilter} />}
        {template === 'minimalist' && <MinimalistTree onSelect={onSelectMember} filter={treeFilter} />}
        {template === 'heritage' && <HeritageTree onSelect={onSelectMember} filter={treeFilter} />}
      </ZoomPanViewport>
    </div>
  );
};
