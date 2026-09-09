import React, { useState } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AnnouncementPriority } from '../types';
import { canAddContent } from '../lib/permissions';

const PRIORITY_STYLES: Record<AnnouncementPriority, string> = {
  urgent: 'bg-red-50 border-red-200 text-red-700',
  important: 'bg-heritage-gold-50 border-heritage-gold-200 text-heritage-gold-700',
  normal: 'bg-heritage-cream-100 border-heritage-cream-300 text-heritage-green-700',
};

export const Announcements: React.FC = () => {
  const { data, addAnnouncement, currentProfile } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    addAnnouncement({ title, body, priority });
    setTitle(''); setBody(''); setPriority('normal'); setShowForm(false);
  };

  const sorted = [...data.announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          Keep every branch of the family in the loop.
        </p>
        {canAdd && (
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
            <Plus size={16} /> Post Announcement
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Message" className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm" />
          <div className="flex items-center gap-2">
            {(['normal', 'important', 'urgent'] as const).map(p => (
              <button
                type="button" key={p} onClick={() => setPriority(p)}
                className={`text-xs px-3 py-1.5 rounded-full border capitalize ${priority === p ? 'bg-heritage-green-800 border-heritage-green-800 text-white' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Post</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sorted.map(a => (
          <div key={a.id} className={`rounded-xl border p-4 ${PRIORITY_STYLES[a.priority]}`}>
            <div className="flex items-center gap-2">
              <Megaphone size={15} />
              <p className="font-medium">{a.title}</p>
              <span className="ml-auto text-[10px] uppercase tracking-wide opacity-70">{a.priority}</span>
            </div>
            <p className="text-sm mt-1.5 opacity-90">{a.body}</p>
            <p className="text-[11px] mt-2 opacity-60">{new Date(a.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
