import React, { useMemo, useState } from 'react';
import { TreePine, UserCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getLineage, getGrandparents, getGrandchildren, getOtherDescendants, relationshipTerm, fullName, lifespan,
  getParents, getFullSiblings, getHalfSiblings, WIFE_COLORS, getWifeLabel
} from '../lib/lineage';
import type { Member } from '../types';

interface Props {
  onSelectMember: (id: string) => void;
  onViewFullTree: (anchorId: string) => void;
}

const PersonCard: React.FC<{
  member: Member;
  onClick: () => void;
  highlight?: boolean;
  relationLabel?: string;
  badge?: { label: string; bg: string; text: string; border: string; ring?: string };
}> = ({ member, onClick, highlight, relationLabel, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left w-full transition-colors cursor-pointer
      ${highlight
        ? 'border-heritage-gold-400 bg-heritage-gold-50 dark:bg-heritage-dark-hover'
        : 'border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
      }`}
  >
    <img
      src={member.avatarUrl}
      className="w-11 h-11 rounded-full bg-heritage-gold-100 shrink-0 border-2"
      style={{ borderColor: badge?.ring || '#d9c5a0' }}
      alt=""
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(member)}</p>
        {badge && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full border leading-tight whitespace-nowrap"
            style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
        {lifespan(member)}{relationLabel ? ` · ${relationLabel}` : ` · Gen ${member.generation}`}
      </p>
    </div>
  </button>
);

const Row: React.FC<{
  title: string;
  subtitle?: string;
  people: Member[];
  onSelectMember: (id: string) => void;
  anchorGeneration?: number;
  direction?: 'ancestor' | 'descendant';
  customBadge?: (p: Member, index: number) => { label: string; bg: string; text: string; border: string; ring?: string } | undefined;
}> = ({ title, subtitle, people, onSelectMember, anchorGeneration, direction, customBadge }) => {
  if (people.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-500 dark:text-heritage-dark-muted">{title}</p>
        {subtitle && <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted italic">{subtitle}</span>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {people.map((p, idx) => (
          <PersonCard
            key={p.id}
            member={p}
            onClick={() => onSelectMember(p.id)}
            badge={customBadge ? customBadge(p, idx) : undefined}
            relationLabel={
              direction && anchorGeneration !== undefined
                ? relationshipTerm(Math.abs(p.generation - anchorGeneration), direction)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

export const MyFamily: React.FC<Props> = ({ onSelectMember, onViewFullTree }) => {
  const { data, currentProfile } = useApp();
  const [anchorId, setAnchorId] = useState<string | undefined>(currentProfile?.memberId);

  const anchor = data.members.find(m => m.id === anchorId);

  const circle = useMemo(() => {
    if (!anchor) return null;
    const lineage = getLineage(anchor.id, data.members, data.relationships);
    const grandparents = getGrandparents(anchor.id, data.relationships)
      .map(id => data.members.find(m => m.id === id))
      .filter((m): m is Member => Boolean(m));
    const grandchildren = getGrandchildren(anchor.id, data.relationships)
      .map(id => data.members.find(m => m.id === id))
      .filter((m): m is Member => Boolean(m));
    const otherDescendants = getOtherDescendants(anchor.id, data.members, data.relationships);

    const fullSiblings = getFullSiblings(anchor.id, data.relationships)
      .map(id => data.members.find(m => m.id === id))
      .filter((m): m is Member => Boolean(m));
    const halfSiblings = getHalfSiblings(anchor.id, data.relationships)
      .map(id => data.members.find(m => m.id === id))
      .filter((m): m is Member => Boolean(m));

    return { ...lineage, grandparents, grandchildren, otherDescendants, fullSiblings, halfSiblings };
  }, [anchor, data.members, data.relationships]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">My Family</h1>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-0.5">
            A close-up view of one person's family circle — grandparents through every generation that follows.
          </p>
        </div>
        {anchor && (
          <button
            onClick={() => onViewFullTree(anchor.id)}
            className="flex items-center justify-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0 cursor-pointer"
          >
            <TreePine size={15} /> View entire family tree
          </button>
        )}
      </div>

      <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4 flex items-center gap-3 flex-wrap">
        <UserCircle2 size={16} className="text-heritage-green-600 dark:text-heritage-dark-muted shrink-0" />
        <label className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted shrink-0">Showing family for:</label>
        <select
          value={anchorId ?? ''}
          onChange={e => setAnchorId(e.target.value || undefined)}
          className="text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-1.5 min-w-[200px]"
        >
          <option value="">Choose a person…</option>
          {[...data.members]
            .sort((a, b) => a.generation - b.generation || a.firstName.localeCompare(b.firstName))
            .map(m => <option key={m.id} value={m.id}>{fullName(m)}</option>)}
        </select>
      </div>

      {!anchor && (
        <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border p-10 text-center text-sm text-heritage-green-500 dark:text-heritage-dark-muted">
          {currentProfile?.memberId
            ? 'Pick someone above to see their close family.'
            : "Your account isn't linked to a person in the tree yet — pick anyone above to see their close family, or ask a family admin to link your profile."}
        </div>
      )}

      {anchor && circle && (
        <div className="space-y-6">
          <Row title="Grandparents" people={circle.grandparents} onSelectMember={onSelectMember} anchorGeneration={anchor.generation} direction="ancestor" />
          <Row title="Parents" people={circle.parents} onSelectMember={onSelectMember} anchorGeneration={anchor.generation} direction="ancestor" />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-500 dark:text-heritage-dark-muted mb-2">This person</p>
            <div className="max-w-sm">
              <PersonCard member={anchor} onClick={() => onSelectMember(anchor.id)} highlight />
            </div>
          </div>

          <Row
            title={circle.spouse.length > 1 ? `Spouses / Wives (${circle.spouse.length})` : "Spouse"}
            people={circle.spouse}
            onSelectMember={onSelectMember}
            customBadge={(p, idx) => {
              const spouseRel = data.relationships.find(
                r => r.relationshipType === 'spouse' &&
                  ((r.fromMemberId === anchor.id && r.toMemberId === p.id) || (r.fromMemberId === p.id && r.toMemberId === anchor.id))
              );
              const color = WIFE_COLORS[idx % WIFE_COLORS.length];
              const label = getWifeLabel(idx, p, spouseRel, circle.spouse.length);
              return { label, bg: color.bg, text: color.text, border: color.border, ring: color.ring };
            }}
          />

          {circle.fullSiblings.length > 0 && (
            <Row
              title={circle.halfSiblings.length > 0 ? "Full Siblings (Same Parents)" : "Siblings"}
              people={circle.fullSiblings}
              onSelectMember={onSelectMember}
            />
          )}

          {circle.halfSiblings.length > 0 && (
            <Row
              title="Half-Siblings"
              subtitle={`(Shares one parent with ${anchor.firstName})`}
              people={circle.halfSiblings}
              onSelectMember={onSelectMember}
            />
          )}

          <Row title="Children" people={circle.children} onSelectMember={onSelectMember} anchorGeneration={anchor.generation} direction="descendant" />
          <Row title="Grandchildren" people={circle.grandchildren} onSelectMember={onSelectMember} anchorGeneration={anchor.generation} direction="descendant" />
          <Row title="Great-grandchildren & Beyond" people={circle.otherDescendants} onSelectMember={onSelectMember} anchorGeneration={anchor.generation} direction="descendant" />
        </div>
      )}
    </div>
  );
};
