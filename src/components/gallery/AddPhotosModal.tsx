import React, { useState } from 'react';
import { X, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import * as db from '../../lib/db';

interface PendingPhoto {
  id: string;
  file: File;
  dataUrl: string;
  caption: string;
}

interface Props {
  albumId: string;
  onClose: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const AddPhotosModal: React.FC<Props> = ({ albumId, onClose }) => {
  const { data, addPhoto, isOnlineMode, pushToast } = useApp();
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [taggedMemberIds, setTaggedMemberIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const inputCls = "w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400";
  const labelCls = "block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted mb-1";

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPending(prev => [...prev, { id: uid(), file, dataUrl: reader.result as string, caption: '' }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setPending(prev => prev.map(p => (p.id === id ? { ...p, caption } : p)));
  };

  const removePending = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
  };

  const toggleMember = (id: string) => {
    setTaggedMemberIds(prev => (prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.length === 0 || uploading) return;

    setUploading(true);
    try {
      for (const p of pending) {
        // Online mode: upload the real file to Supabase Storage and store its public URL.
        // Local/demo mode has no storage backend, so the data URL preview is kept as-is.
        const url = isOnlineMode
          ? await db.uploadPhotoFile(data.family.id, albumId, p.file)
          : p.dataUrl;

        addPhoto({
          albumId,
          url,
          caption: p.caption.trim() || undefined,
          taggedMemberIds,
        });
      }
      onClose();
    } catch (err) {
      pushToast(
        `Couldn't upload ${pending.length > 1 ? 'one or more photos' : 'the photo'}: ${err instanceof Error ? err.message : 'unknown error'}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg"
      >
        <div className="sticky top-0 bg-white dark:bg-heritage-dark-card flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border z-10">
          <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">Add Photos</h2>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-heritage-cream-400 dark:border-heritage-dark-border rounded-xl py-8 cursor-pointer hover:border-heritage-green-500 transition-colors">
            <UploadCloud size={22} className="text-heritage-green-500" />
            <span className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted">Click to choose photos, or drop them here</span>
            <span className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">You can select more than one at a time</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </label>

          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.dataUrl} className="w-14 h-14 rounded-lg object-cover border border-heritage-cream-300 dark:border-heritage-dark-border shrink-0" alt="" />
                  <input
                    className={inputCls}
                    placeholder="Caption (optional)"
                    value={p.caption}
                    onChange={e => updateCaption(p.id, e.target.value)}
                  />
                  <button type="button" onClick={() => removePending(p.id)} className="text-heritage-green-400 hover:text-red-500 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className={labelCls}>Tag family members (applies to all photos above)</label>
            <div className="flex flex-wrap gap-2">
              {data.members.map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
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
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
          <button type="button" onClick={onClose} disabled={uploading} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted disabled:opacity-40">Cancel</button>
          <button
            type="submit"
            disabled={pending.length === 0 || uploading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? 'Uploading…' : `Add ${pending.length > 0 ? pending.length : ''} photo${pending.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>
    </div>
  );
};
