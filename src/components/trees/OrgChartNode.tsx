import React, { useState } from 'react';
import type { TreeUnit, WifeLine } from '../../lib/treeBuilder';
import type { Member } from '../../types';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

export interface WifeMeta {
  order: number;
  label: string;
  color: WifeLine['color'];
}

export interface CardRenderMeta {
  isSpouse?: boolean;
  wifeMeta?: WifeMeta;
}

interface OrgChartNodeProps {
  unit: TreeUnit;
  renderCard: (member: Member, meta?: CardRenderMeta) => React.ReactNode;
  onSelect: (memberId: string) => void;
  lineColor?: string;
}

export const OrgChartNode: React.FC<OrgChartNodeProps> = ({ unit, renderCard, onSelect, lineColor }) => {
  const [collapsedWives, setCollapsedWives] = useState<Record<string, boolean>>({});

  const toggleWife = (spouseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedWives(prev => ({ ...prev, [spouseId]: !prev[spouseId] }));
  };

  const isHouse = unit.wives.length > 0;
  const isMultiWife = unit.wives.length > 1;

  const wifeMetaMap = new Map<string, WifeMeta>();
  unit.wives.forEach(w => {
    wifeMetaMap.set(w.spouse.id, {
      order: w.order,
      label: w.label,
      color: w.color,
    });
  });

  const hasGroupedChildren = unit.wives.some(w => w.children.length > 0) || unit.unassignedChildren.length > 0;

  return (
    <li>
      <div className={`inline-flex flex-col items-center ${isHouse ? 'p-2 rounded-2xl border border-heritage-cream-300/80 dark:border-heritage-dark-border bg-white/70 dark:bg-heritage-dark-card/70 shadow-xs' : ''}`}>
        {isMultiWife && (
          <div className="flex items-center gap-1.5 mb-1.5 px-2.5 py-0.5 rounded-full bg-heritage-green-50 dark:bg-heritage-dark-hover border border-heritage-green-200 dark:border-heritage-dark-border text-[10px] font-medium text-heritage-green-800 dark:text-heritage-dark-text">
            <Users size={11} className="text-heritage-gold-600 shrink-0" />
            <span>House of {unit.head.firstName} · {unit.wives.length} Wives</span>
          </div>
        )}

        <div className="inline-flex items-end gap-2.5">
          {/* Head */}
          <div onClick={() => onSelect(unit.head.id)} className="cursor-pointer">
            {renderCard(unit.head)}
          </div>

          {/* Spouses in marriage order */}
          {unit.wives.map(w => (
            <div key={w.spouse.id} onClick={() => onSelect(w.spouse.id)} className="cursor-pointer">
              {renderCard(w.spouse, { isSpouse: true, wifeMeta: wifeMetaMap.get(w.spouse.id) })}
            </div>
          ))}
        </div>
      </div>

      {/* Children Branches */}
      {hasGroupedChildren && (
        <ul>
          {isMultiWife ? (
            <>
              {unit.wives.map(w => {
                const isCollapsed = Boolean(collapsedWives[w.spouse.id]);
                if (w.children.length === 0) return null;

                return (
                  <li key={`wife-cluster-${w.spouse.id}`}>
                    <div className="inline-flex flex-col items-center my-1.5">
                      <button
                        type="button"
                        onClick={(e) => toggleWife(w.spouse.id, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-transform hover:scale-105 cursor-pointer"
                        style={{
                          backgroundColor: w.color.bg,
                          borderColor: w.color.border,
                          color: w.color.text,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color.ring }} />
                        <span>{w.spouse.firstName}'s Line ({w.children.length})</span>
                        {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <ul style={{ ['--tree-line' as string]: w.color.line }}>
                        {w.children.map(child => (
                          <OrgChartNode key={child.id} unit={child} renderCard={renderCard} onSelect={onSelect} lineColor={lineColor} />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}

              {unit.unassignedChildren.length > 0 && (
                <li>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-heritage-cream-200 text-heritage-green-700 my-1.5 border border-heritage-cream-400">
                    <span>Mother not recorded ({unit.unassignedChildren.length})</span>
                  </div>
                  <ul>
                    {unit.unassignedChildren.map(child => (
                      <OrgChartNode key={child.id} unit={child} renderCard={renderCard} onSelect={onSelect} lineColor={lineColor} />
                    ))}
                  </ul>
                </li>
              )}
            </>
          ) : (
            unit.children.map(child => (
              <OrgChartNode key={child.id} unit={child} renderCard={renderCard} onSelect={onSelect} lineColor={lineColor} />
            ))
          )}
        </ul>
      )}
    </li>
  );
};

export const OrgChartForest: React.FC<{
  roots: TreeUnit[];
  renderCard: (member: Member, meta?: CardRenderMeta) => React.ReactNode;
  onSelect: (memberId: string) => void;
  lineColor: string;
}> = ({ roots, renderCard, onSelect, lineColor }) => (
  <div className="inline-block" style={{ ['--tree-line' as string]: lineColor }}>
    <ul className="org-tree">
      {roots.map(root => (
        <OrgChartNode key={root.id} unit={root} renderCard={renderCard} onSelect={onSelect} lineColor={lineColor} />
      ))}
    </ul>
  </div>
);
