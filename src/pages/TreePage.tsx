import React from 'react';
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
  const template = data.family.activeTreeTemplate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          Six ways to explore the same family — switch templates any time. Scroll/pinch to zoom, drag to pan, click any person to see their details.
        </p>
        <TreeTemplateSwitcher active={template} onChange={setActiveTreeTemplate} />
      </div>

      <ZoomPanViewport
        resetKey={template}
        className="border border-heritage-cream-400 dark:border-heritage-dark-border bg-heritage-cream-50 dark:bg-heritage-dark-card"
      >
        {template === 'classic' && <ClassicTree onSelect={onSelectMember} />}
        {template === 'timeline' && <TimelineTree onSelect={onSelectMember} />}
        {template === 'photo' && <PhotoTree onSelect={onSelectMember} />}
        {template === 'radial' && <RadialTree onSelect={onSelectMember} />}
        {template === 'minimalist' && <MinimalistTree onSelect={onSelectMember} />}
        {template === 'heritage' && <HeritageTree onSelect={onSelectMember} />}
      </ZoomPanViewport>
    </div>
  );
};
