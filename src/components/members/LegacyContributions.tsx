import React, { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canAddContent, canRemoveLegacyContribution } from '../../lib/permissions';
import { fullName } from '../../lib/lineage';
import type { LegacyContribution } from '../../types';

interface Props {
  memberId: string;
}

export const LegacyContributions: React.FC<Props> = ({ memberId }) => {
  const { data, currentProfile, addLegacyContribution, removeLegacyContribution } = useApp();
  const [body, setBody] = useState('');
  const [taggedMemberIds, setTaggedMemberIds] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const canAdd = canAddContent(currentProfile?.role);
  const contributions = data.legacyContributions
    .filter(c => c.memberId === memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const toggleTag = (id: string) => {
    setTaggedMemberIds(prev => (prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addLegacyContribution(memberId, body.trim(), taggedMemberIds);
    setBody('');
    setTaggedMemberIds([]);
    setShowTagPicker(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-heritage-green-500 dark:text-heritage-dark-muted mb-2">
          Memories from the family
        </p>
        {contributions.length === 0 ? (
          <p className="text-sm text-heritage-green-400 dark:text-heritage-dark-muted">
            No one has added a memory here yet — be the first to share one below.
          </p>
        ) : (
          <div className="space-y-3">
            {contributions.map(c => (
              <ContributionCard key={c.id} contribution={c} onRemove={removeLegacyContribution} />
            ))}
          </div>
        )}
      </div>

      {canAdd && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border p-4 space-y-3">
          <label className="block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted">
            Add your own memory or tribute
          </label>
          <textarea
            className="w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400 resize-y"
            rows={3}
            placeholder="Share a memory, a phrase they always said, or what they meant to you…"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <div>
            <button
              type="button"
              onClick={() => setShowTagPicker(s => !s)}
              className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted underline underline-offset-2 hover:text-heritage-green-900"
            >
              {showTagPicker ? 'Hide tagging' : 'Tag family members in this memory'}
            </button>
            {showTagPicker && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.members.map(m => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleTag(m.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                      ${taggedMemberIds.includes(m.id)
                        ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                        : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
                      }`}
                  >
                    {fullName(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!body.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
            >
              <Send size={14} /> Share memory
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const ContributionCard: React.FC<{ contribution: LegacyContribution; onRemove: (id: string) => void }> = ({ contribution, onRemove }) => {
  const { data, currentProfile } = useApp();
  const canRemove = canRemoveLegacyContribution(currentProfile?.role, currentProfile?.id, contribution.authorProfileId);
  const taggedNames = contribution.taggedMemberIds
    .map(id => data.members.find(m => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="border-l-2 border-heritage-gold-300 pl-3 py-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-text leading-relaxed">{contribution.body}</p>
        {canRemove && (
          <button onClick={() => onRemove(contribution.id)} className="text-heritage-green-400 hover:text-red-500 shrink-0">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
        <span className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
          — {contribution.authorName}, {new Date(contribution.createdAt).toLocaleDateString()}
        </span>
        {taggedNames.map(m => (
          <span key={m.id} className="text-[11px] px-1.5 py-0.5 rounded-full bg-heritage-cream-200 dark:bg-heritage-dark-hover text-heritage-green-700 dark:text-heritage-dark-muted">
            @{fullName(m)}
          </span>
        ))}
      </div>
    </div>
  );
};
