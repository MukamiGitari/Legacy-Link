import React, { useMemo, useState } from 'react';
import { TreePine, UserCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getLineage, getGrandparents, getGrandchildren, getOtherDescendants, fullName, lifespan,
} from '../lib/lineage';
import type { Member } from '../types';

interface Props {
  onSelectMember: (id: string) => void;
  onViewFullTree: (anchorId: string) => void;
}

const PersonCard: React.FC<{ member: Member; onClick: () => void; highlight?: boolean }> = ({ member, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left w-full transition-colors
      ${highlight
        ? 'border-heritage-gold-400 bg-heritage-gold-50 dark:bg-heritage-dark-hover'
        : 'border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
      }`}
  >
    <img src={member.avatarUrl} className="w-11 h-11 rounded-full bg-heritage-gold-100 shrink-0" alt="" />
    <div className="min-w-0">
      <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(member)}</p>
      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(member)} · Gen {member.generation}</p>
    </div>
  </button>
);

const Row: React.FC<{ title: string; people: Member[]; onSelectMember: (id: string) => void }> = ({ title, people, onSelectMember }) => {
  if (people.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-500 dark:text-heritage-dark-muted mb-2">{title}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {people.map(p => <PersonCard key={p.id} member={p} onClick={() => onSelectMember(p.id)} />)}
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
    return { ...lineage, grandparents, grandchildren, otherDescendants };
  }, [anchor, data.members, data.relationships]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">My Family</h1>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-0.5">
            A close-up view of one person's family circle — grandparents through every generation of descendants.
          </p>
        </div>
        {anchor && (
          <button
            onClick={() => onViewFullTree(anchor.id)}
            className="flex items-center justify-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0"
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
          <Row title="Grandparents" people={circle.grandparents} onSelectMember={onSelectMember} />
          <Row title="Parents" people={circle.parents} onSelectMember={onSelectMember} />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-500 dark:text-heritage-dark-muted mb-2">This person</p>
            <div className="max-w-sm">
              <PersonCard member={anchor} onClick={() => onSelectMember(anchor.id)} highlight />
            </div>
          </div>

          <Row title="Spouse" people={circle.spouse} onSelectMember={onSelectMember} />
          <Row title="Siblings" people={circle.siblings} onSelectMember={onSelectMember} />
          <Row title="Children" people={circle.children} onSelectMember={onSelectMember} />
          <Row title="Grandchildren" people={circle.grandchildren} onSelectMember={onSelectMember} />
          <Row title="Other Descendants" people={circle.otherDescendants} onSelectMember={onSelectMember} />
        </div>
      )}
    </div>
  );
};
