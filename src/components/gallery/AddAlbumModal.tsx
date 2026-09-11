import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import type { Album } from '../../types';
import { defaultCoverFor } from '../../lib/albumCovers';

const CATEGORY_OPTIONS: { key: Album['category']; label: string }[] = [
  { key: 'weddings', label: 'Weddings' },
  { key: 'reunions', label: 'Reunions' },
  { key: 'childhood', label: 'Childhood' },
  { key: 'birthdays', label: 'Birthdays' },
  { key: 'historical', label: 'Historical' },
  { key: 'memorials', label: 'Memorials' },
  { key: 'holidays', label: 'Holidays' },
];

interface Props {
  onClose: () => void;
  onCreated: (albumId: string) => void;
}

export const AddAlbumModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { data, addAlbum } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Album['category']>('holidays');
  const [description, setDescription] = useState('');
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
    const album = addAlbum({
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      coverPhotoUrl: coverPhotoUrl || defaultCoverFor(category),
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
          <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">New Album</h2>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Cover photo</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-heritage-cream-200 flex items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border shrink-0">
                <img src={coverPreview || defaultCoverFor(category)} className="w-full h-full object-cover" alt="" />
              </div>
              <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
                {coverPreview ? 'Custom cover selected' : `Using the default ${CATEGORY_OPTIONS.find(c => c.key === category)?.label.toLowerCase()} cover — choose an image to replace it`}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverFile(e.target.files?.[0])} />
            </label>
          </div>

          <div>
            <label className={labelCls}>Album title *</label>
            <input required className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Reunion 2026" />
          </div>

          <div>
            <label className={labelCls}>Who is this about? (optional)</label>
            <select className={inputCls} value={featuredMemberId} onChange={e => setFeaturedMemberId(e.target.value)}>
              <option value="">No one in particular</option>
              {data.members.map(m => (
                <option key={m.id} value={m.id}>{fullName(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={category} onChange={e => setCategory(e.target.value as Album['category'])}>
              {CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this album about?" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
          <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium">Create album</button>
        </div>
      </form>
    </div>
  );
};
