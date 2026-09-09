import React, { useState } from 'react';
import { Plus, BookHeart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';

interface Props {
  onSelectMember: (id: string) => void;
}

export const Memories: React.FC<Props> = ({ onSelectMember }) => {
  const { data, addMemory, currentProfile } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [era, setEra] = useState('');
  const [authorMemberId, setAuthorMemberId] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    addMemory({ title, body, era: era || undefined, authorMemberId: authorMemberId || undefined, relatedMemberIds: authorMemberId ? [authorMemberId] : [] });
    setTitle(''); setBody(''); setEra(''); setAuthorMemberId(''); setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          Stories keep the family's history alive — add one worth remembering.
        </p>
        {canAdd && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={16} /> Share a Memory
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
          <input
            value={title} onChange={e => setTitle(e.target.value)} placeholder="Title, e.g. Grandmother's Wedding Day & The Silk Shawl (1960)"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
          />
          <textarea
            value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Tell the story..."
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
          />
          <div className="flex flex-wrap gap-3">
            <input
              value={era} onChange={e => setEra(e.target.value)} placeholder="Era, e.g. 1960s"
              className="flex-1 min-w-[140px] rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            />
            <select
              value={authorMemberId} onChange={e => setAuthorMemberId(e.target.value)}
              className="flex-1 min-w-[160px] rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            >
              <option value="">Attribute to...</option>
              {data.members.map(m => <option key={m.id} value={m.id}>{fullName(m)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Publish memory</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {data.memories.map(mem => {
          const author = data.members.find(m => m.id === mem.authorMemberId);
          return (
            <div key={mem.id} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden">
              {mem.coverPhotoUrl && <img src={mem.coverPhotoUrl} className="w-full h-40 object-cover" alt="" />}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BookHeart size={14} className="text-heritage-gold-500" />
                  {mem.era && <span className="text-xs px-2 py-0.5 rounded-full bg-heritage-gold-100 text-heritage-gold-700">{mem.era}</span>}
                </div>
                <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">{mem.title}</h3>
                <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{mem.body}</p>
                {author && (
                  <button onClick={() => onSelectMember(author.id)} className="flex items-center gap-2 mt-4 text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
                    <img src={author.avatarUrl} className="w-6 h-6 rounded-full bg-heritage-cream-200" alt="" />
                    as told by {fullName(author)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
