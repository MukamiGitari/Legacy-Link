import React, { useState } from 'react';
import { X, MapPin, Briefcase, Calendar, Users as UsersIcon, Edit3, Crosshair, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLineage, getAllAncestors, getAllDescendants, fullName, lifespan } from '../../lib/lineage';
import type { Member } from '../../types';

interface PersonDrawerProps {
  memberId: string | null;
  onClose: () => void;
  onSelectMember: (id: string) => void;
  onEdit: (id: string) => void;
  onViewProfile: (id: string) => void;
  onFocusInTree?: (id: string) => void;
}

export const PersonDrawer: React.FC<PersonDrawerProps> = ({
  memberId, onClose, onSelectMember, onEdit, onViewProfile, onFocusInTree,
}) => {
  const { data } = useApp();
  const member = data.members.find(m => m.id === memberId);
  const [showFullLineage, setShowFullLineage] = useState(false);
  if (!member) return null;

  const lineage = getLineage(member.id, data.members, data.relationships);
  const allAncestors = getAllAncestors(member.id, data.members, data.relationships);
  const allDescendants = getAllDescendants(member.id, data.members, data.relationships);

  const Group: React.FC<{ title: string; people: Member[] }> = ({ title, people }) => {
    if (people.length === 0) return null;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-wide text-heritage-green-500 mb-2">{title}</p>
        <div className="space-y-1.5">
          {people.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectMember(p.id)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover text-left"
            >
              <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-gold-100" alt="" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</p>
                <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(p)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const GenerationGroup: React.FC<{ title: string; people: Member[] }> = ({ title, people }) => {
    if (people.length === 0) return null;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-wide text-heritage-green-500 mb-2">{title}</p>
        <div className="space-y-1.5">
          {people.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectMember(p.id)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover text-left"
            >
              <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-heritage-gold-100" alt="" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{fullName(p)}</p>
                <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{lifespan(p)}</p>
              </div>
              <span className="shrink-0 text-[10px] text-heritage-green-400 dark:text-heritage-dark-muted">Gen {p.generation}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-heritage-dark-card shadow-soft-lg overflow-y-auto scrollbar-thin">
        <div className="relative h-28 bg-gradient-to-br from-heritage-green-700 to-heritage-green-900">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-12">
          <img
            src={member.avatarUrl}
            className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-heritage-dark-card bg-heritage-gold-100 shadow-soft"
            alt=""
          />
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text">{fullName(member)}</h2>
              {member.maidenName && (
                <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">née {member.maidenName}</p>
              )}
            </div>
            <span className={`shrink-0 text-[11px] px-2 py-1 rounded-full font-medium ${member.isLiving ? 'bg-heritage-green-100 text-heritage-green-700' : 'bg-heritage-bark-100 text-heritage-bark-700'}`}>
              {member.isLiving ? 'Living' : 'In Memoriam'}
            </span>
          </div>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-0.5">Generation {member.generation}</p>

          <div className="mt-4 space-y-2 text-sm text-heritage-green-800 dark:text-heritage-dark-text">
            <div className="flex items-center gap-2"><Calendar size={15} className="text-heritage-gold-500 shrink-0" /> {lifespan(member)}</div>
            {member.birthPlace && <div className="flex items-center gap-2"><MapPin size={15} className="text-heritage-gold-500 shrink-0" /> {member.birthPlace}</div>}
            {member.occupation && <div className="flex items-center gap-2"><Briefcase size={15} className="text-heritage-gold-500 shrink-0" /> {member.occupation}</div>}
          </div>

          {member.bio && (
            <p className="mt-4 text-sm leading-relaxed text-heritage-green-700 dark:text-heritage-dark-muted border-l-2 border-heritage-gold-300 pl-3 italic">
              {member.bio}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => onViewProfile(member.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium py-2 rounded-lg"
            >
              <UsersIcon size={15} /> Full Profile
            </button>
            <button
              onClick={() => onEdit(member.id)}
              className="flex items-center justify-center gap-1.5 border border-heritage-green-700 text-heritage-green-800 dark:text-heritage-dark-text text-sm font-medium px-3 py-2 rounded-lg hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
            >
              <Edit3 size={15} />
            </button>
            {onFocusInTree && (
              <button
                onClick={() => onFocusInTree(member.id)}
                title="Center in tree"
                className="flex items-center justify-center gap-1.5 border border-heritage-green-700 text-heritage-green-800 dark:text-heritage-dark-text text-sm font-medium px-3 py-2 rounded-lg hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
              >
                <Crosshair size={15} />
              </button>
            )}
          </div>

          <div className="mt-6 space-y-5">
            <Group title="Parents" people={lineage.parents} />
            <Group title="Spouse" people={lineage.spouse} />
            <Group title="Children" people={lineage.children} />
            <Group title="Siblings" people={lineage.siblings} />
          </div>

          {(allAncestors.length > 0 || allDescendants.length > 0) && (
            <div className="mt-6 border-t border-heritage-cream-300 dark:border-heritage-dark-border pt-5">
              <button
                onClick={() => setShowFullLineage(s => !s)}
                className="w-full flex items-center justify-between text-sm font-medium text-heritage-green-800 dark:text-heritage-dark-text"
              >
                <span>Full lineage ({allAncestors.length} ancestors, {allDescendants.length} descendants)</span>
                {showFullLineage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFullLineage && (
                <div className="mt-4 space-y-5">
                  <GenerationGroup title={`Every ancestor (oldest first, back to Generation ${allAncestors[0]?.generation ?? member.generation})`} people={allAncestors} />
                  <GenerationGroup title="Every descendant" people={allDescendants} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
