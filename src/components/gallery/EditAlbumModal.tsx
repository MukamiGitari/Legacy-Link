import React, { useState } from 'react';
import { X, Loader2, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import type { Album } from '../../types';
import { defaultCoverFor } from '../../lib/albumCovers';

const CATEGORY_OPTIONS: { key: Album['category']; label: string }[] = [
  { key: 'childhood',   label: 'Childhood' },
  { key: 'birthdays',   label: 'Birthdays' },
  { key: 'graduations', label: 'Graduations' },
  { key: 'weddings',    label: 'Weddings' },
  { key: 'reunions',    label: 'Reunions' },
  { key: 'historical',  label: 'Historical' },
  { key: 'memorials',   label: 'Memorials' },
];

interface Props {
  album: Album;
  onClose: () => void;
}

export const EditAlbumModal: React.FC<Props> = ({ album, onClose }) => {
  const { data, updateAlbum, isOnlineMode, pushToast } = useApp();
  const [title, setTitle] = useState(album.title);
  const [category, setCategory] = useState<Album['category']>(album.category);
  const [description, setDescription] = useState(album.description || '');
  const [coverPreview, setCoverPreview] = useState(album.coverPhotoUrl || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [featuredMemberId, setFeaturedMemberId] = useState(album.featuredMemberId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputCls = "w-full rounded-xl border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400";
  const labelCls = "block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1";

  const handleCoverFile = (file: File | undefined) => {
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalCover = album.coverPhotoUrl;
      if (coverFile && isOnlineMode) {
        try {
          const { uploadFileToR2 } = await import('../../lib/api');
          const res = await uploadFileToR2({ category: 'photos', file: coverFile });
          finalCover = res.url;
        } catch (uploadErr) {
          pushToast(`Photo upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`);
        }
      } else if (coverPreview && coverPreview.startsWith('http')) {
        finalCover = coverPreview;
      }

      updateAlbum(album.id, {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        coverPhotoUrl: finalCover || defaultCoverFor(category),
        featuredMemberId: featuredMemberId || undefined,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-xl overflow-hidden border border-heritage-cream-200 dark:border-heritage-dark-border"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-heritage-cream-200 dark:border-heritage-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-heritage-cream-100 dark:bg-heritage-dark-hover flex items-center justify-center text-heritage-green-800 dark:text-heritage-dark-text">
              <Pencil size={14} />
            </div>
            <h2 className="font-serif text-lg font-bold text-heritage-green-900 dark:text-heritage-dark-text">
              Edit Album Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Cover photo */}
          <div>
            <label className={labelCls}>Album Cover Photo</label>
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-50 dark:hover:bg-heritage-dark-hover transition-colors">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-heritage-cream-200 dark:bg-heritage-dark-card flex items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border shrink-0">
                <img
                  src={coverPreview || defaultCoverFor(category)}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-heritage-green-800 dark:text-heritage-dark-text block">
                  {coverFile ? 'New cover chosen' : 'Change cover image'}
                </span>
                <span className="text-heritage-green-600 dark:text-heritage-dark-muted block text-[11px]">
                  Click to select an image from your device
                </span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverFile(e.target.files?.[0])} />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>Album Title *</label>
            <input
              required
              className={inputCls}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Grandma's 80th Birthday"
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <select
              className={inputCls}
              value={category}
              onChange={e => setCategory(e.target.value as Album['category'])}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Featured Member */}
          <div>
            <label className={labelCls}>Dedicated to Family Member (optional)</label>
            <select
              className={inputCls}
              value={featuredMemberId}
              onChange={e => setFeaturedMemberId(e.target.value)}
            >
              <option value="">No one in particular</option>
              {data.members.map(m => (
                <option key={m.id} value={m.id}>{fullName(m)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              className={inputCls}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this album or family memory..."
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-heritage-cream-200 dark:border-heritage-dark-border bg-heritage-cream-50/50 dark:bg-heritage-dark-card">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-50 text-white transition-colors shadow-soft"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
