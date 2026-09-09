import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { canAddContent } from '../lib/permissions';

export const Chronicle: React.FC = () => {
  const { data, addChronicleEra, currentProfile } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const eras = [...data.chronicleEras].sort((a, b) => a.sortOrder - b.sortOrder);

  const [showForm, setShowForm] = useState(false);
  const [eraLabel, setEraLabel] = useState('');
  const [headline, setHeadline] = useState('');
  const [narrative, setNarrative] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eraLabel.trim() || !headline.trim()) return;
    addChronicleEra({
      eraLabel: eraLabel.trim(),
      headline: headline.trim(),
      narrative: narrative.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
    });
    setEraLabel(''); setHeadline(''); setNarrative(''); setPhotoUrl(''); setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-8">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          A multi-era chronicle tracing {data.family.name} from its origins to today.
        </p>
        {canAdd && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="shrink-0 flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={16} /> Add Era
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="mb-10 rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
          <input
            value={eraLabel}
            onChange={e => setEraLabel(e.target.value)}
            placeholder='Era label (e.g. "1890s – Origins")'
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <input
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Headline"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            rows={3}
            placeholder="Narrative (optional)"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <input
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            placeholder="Photo URL (optional)"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Add to Chronicle</button>
          </div>
        </form>
      )}

      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-heritage-gold-300 dark:bg-heritage-gold-700" />
        <div className="space-y-10">
          {eras.map(era => (
            <div key={era.id} className="relative">
              <span className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-heritage-green-800 border-4 border-heritage-cream-100 dark:border-heritage-dark-bg" />
              <p className="text-xs font-medium uppercase tracking-wide text-heritage-gold-600">{era.eraLabel}</p>
              <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text mt-1">{era.headline}</h3>
              {era.narrative && <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{era.narrative}</p>}
              {era.photoUrl && <img src={era.photoUrl} className="mt-3 rounded-lg w-full max-w-md h-44 object-cover shadow-soft" alt="" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
