import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import type { CookbookAlbumStyle } from '../../types';
import { defaultCookbookCoverFor } from '../../lib/albumCovers';

const STYLE_OPTIONS: { key: CookbookAlbumStyle; label: string; description: string }[] = [
  { key: 'traditional', label: '📖 Traditional Family Cookbook', description: 'A warm, heirloom-style book with recipes, food photos, and family-story sections.' },
];

interface Props {
  onClose: () => void;
  onCreated: (albumId: string) => void;
}

export const AddCookbookAlbumModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { data, addCookbookAlbum } = useApp();
  const [style, setStyle] = useState<CookbookAlbumStyle>('traditional');
  const [title, setTitle] = useState(STYLE_OPTIONS[0].label);
  const [description, setDescription] = useState(STYLE_OPTIONS[0].description);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [featuredMemberId, setFeaturedMemberId] = useState('');

  const inputCls = "w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400";
  const labelCls = "block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted mb-1";

  const handleCoverFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverPhotoUrl(dataUrl);
      setCoverPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const album = addCookbookAlbum({
      title: title.trim(),
      style,
      description: description.trim() || undefined,
      coverPhotoUrl: coverPhotoUrl || defaultCookbookCoverFor(style),
      featuredMemberId: featuredMemberId || undefined,
    });
    onCreated(album.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border">
          <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">New Cookbook</h2>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Cover photo</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-heritage-cream-200 flex items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border shrink-0">
                <img src={coverPreview || defaultCookbookCoverFor(style)} className="w-full h-full object-cover" alt="" />
              </div>
              <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
                {coverPreview ? 'Custom cover selected' : 'Using the default cookbook cover — choose an image to replace it'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverFile(e.target.files?.[0])} />
            </label>
          </div>

          <div>
            <label className={labelCls}>Album option</label>
            <div className="space-y-2">
              {STYLE_OPTIONS.map(s => (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => { setStyle(s.key); if (!title.trim() || title === STYLE_OPTIONS.find(o => o.key === style)?.label) setTitle(s.label); }}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors
                    ${style === s.key
                      ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                      : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-900 dark:text-heritage-dark-text hover:border-heritage-green-500'
                    }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className={`text-xs mt-0.5 ${style === s.key ? 'text-heritage-cream-200' : 'text-heritage-green-500 dark:text-heritage-dark-muted'}`}>{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Cookbook title *</label>
            <input required className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Traditional Family Cookbook" />
          </div>

          <div>
            <label className={labelCls}>Dedicated to (optional)</label>
            <select className={inputCls} value={featuredMemberId} onChange={e => setFeaturedMemberId(e.target.value)}>
              <option value="">No one in particular</option>
              {data.members.map(m => (
                <option key={m.id} value={m.id}>{fullName(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this cookbook about?" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
          <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium">Create cookbook</button>
        </div>
      </form>
    </div>
  );
};
