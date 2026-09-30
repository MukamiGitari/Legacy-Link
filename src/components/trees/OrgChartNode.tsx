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
  isMarriedIn?: boolean;
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
  const [expandedInLaws, setExpandedInLaws] = useState<Record<string, boolean>>({});

  const toggleWife = (spouseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedWives(prev => ({ ...prev, [spouseId]: !prev[spouseId] }));
  };

  const toggleInLaws = (spouseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInLaws(prev => ({ ...prev, [spouseId]: !prev[spouseId] }));
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
          {unit.wives.map(w => {
            const hasInLaws = w.inLawFamily && (w.inLawFamily.parents.length > 0 || w.inLawFamily.siblings.length > 0);
            const isInLawsOpen = Boolean(expandedInLaws[w.spouse.id]);

            return (
              <div key={w.spouse.id} className="relative flex flex-col items-center">
                <div onClick={() => onSelect(w.spouse.id)} className="cursor-pointer">
                  {renderCard(w.spouse, { isSpouse: true, isMarriedIn: true, wifeMeta: wifeMetaMap.get(w.spouse.id) })}
                </div>

                {/* Collapsed Spouse's Family branch expander button */}
                {hasInLaws && (
                  <button
                    type="button"
                    onClick={(e) => toggleInLaws(w.spouse.id, e)}
                    className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border bg-amber-50/90 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/60 shadow-xs transition-colors cursor-pointer"
                    title={`View ${w.spouse.firstName}'s parents and siblings`}
                  >
                    <span>{w.spouse.firstName}'s Family</span>
                    {isInLawsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </button>
                )}

                {/* Expanded Spouse's in-law family drawer/panel */}
                {hasInLaws && isInLawsOpen && (
                  <div className="absolute top-full mt-1.5 z-30 w-52 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white/95 dark:bg-heritage-dark-card/95 backdrop-blur-xs shadow-soft-lg text-left space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-1">
                      <p className="text-[10px] font-semibold text-amber-900 dark:text-amber-200">
                        {w.spouse.firstName}'s In-Laws
                      </p>
                      <button
                        type="button"
                        onClick={(e) => toggleInLaws(w.spouse.id, e)}
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 text-[10px] px-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {w.inLawFamily.parents.length > 0 && (
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-1">
                          Parents-in-law
                        </p>
                        <div className="space-y-1">
                          {w.inLawFamily.parents.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
                              className="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left cursor-pointer"
                            >
                              <img src={p.avatarUrl} className="w-5 h-5 rounded-full bg-amber-100 shrink-0" alt="" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate leading-tight">
                                  {p.firstName} {p.lastName}
                                </p>
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-none">
                                  {p.gender === 'male' ? 'Father-in-law' : p.gender === 'female' ? 'Mother-in-law' : 'Parent-in-law'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {w.inLawFamily.siblings.length > 0 && (
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-1">
                          Siblings-in-law
                        </p>
                        <div className="space-y-1">
                          {w.inLawFamily.siblings.map(sib => (
                            <button
                              key={sib.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelect(sib.id); }}
                              className="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left cursor-pointer"
                            >
                              <img src={sib.avatarUrl} className="w-5 h-5 rounded-full bg-amber-100 shrink-0" alt="" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate leading-tight">
                                  {sib.firstName} {sib.lastName}
                                </p>
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-none">
                                  {sib.gender === 'male' ? 'Brother-in-law' : sib.gender === 'female' ? 'Sister-in-law' : 'Sibling-in-law'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
