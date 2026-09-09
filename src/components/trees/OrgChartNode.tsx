import React from 'react';
import type { TreeUnit } from '../../lib/treeBuilder';
import type { Member } from '../../types';

interface OrgChartNodeProps {
  unit: TreeUnit;
  renderCard: (member: Member, isSpouseOf?: Member) => React.ReactNode;
  onSelect: (memberId: string) => void;
}

export const OrgChartNode: React.FC<OrgChartNodeProps> = ({ unit, renderCard, onSelect }) => {
  return (
    <li>
      <div className="inline-flex items-end gap-1.5">
        {unit.members.map((m, i) => (
          <div key={m.id} onClick={() => onSelect(m.id)} className="cursor-pointer">
            {renderCard(m, unit.members[1 - i])}
          </div>
        ))}
      </div>
      {unit.children.length > 0 && (
        <ul>
          {unit.children.map(child => (
            <OrgChartNode key={child.id} unit={child} renderCard={renderCard} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const OrgChartForest: React.FC<{
  roots: TreeUnit[];
  renderCard: (member: Member, isSpouseOf?: Member) => React.ReactNode;
  onSelect: (memberId: string) => void;
  lineColor: string;
}> = ({ roots, renderCard, onSelect, lineColor }) => (
  <div className="inline-block" style={{ ['--tree-line' as string]: lineColor }}>
    <ul className="org-tree">
      {roots.map(root => (
        <OrgChartNode key={root.id} unit={root} renderCard={renderCard} onSelect={onSelect} />
      ))}
    </ul>
  </div>
);
