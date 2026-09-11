import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, ImagePlus, Pencil, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal } from '../components/gallery/AddAlbumModal';
import { AddPhotosModal } from '../components/gallery/AddPhotosModal';
import type { Album } from '../types';
import { canAddContent } from '../lib/permissions';

const CATEGORIES: { key: Album['category'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'weddings', label: 'Weddings' },
  { key: 'reunions', label: 'Reunions' },
  { key: 'childhood', label: 'Childhood' },
  { key: 'birthdays', label: 'Birthdays' },
  { key: 'historical', label: 'Historical' },
  { key: 'memorials', label: 'Memorials' },
  { key: 'holidays', label: 'Holidays' },
];

interface Props {
  onSelectMember: (id: string) => void;
}

export const Gallery: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, updateAlbum } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const [category, setCategory] = useState<Album['category'] | 'all'>('all');
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const albums = category === 'all' ? data.albums : data.albums.filter(a => a.category === category);
  const openAlbum = data.albums.find(a => a.id === openAlbumId);
  const albumPhotos = openAlbum ? data.photos.filter(p => p.albumId === openAlbum.id) : [];
  const lightboxPhoto = lightboxIndex !== null ? albumPhotos[lightboxIndex] : null;

  useEffect(() => { setEditingTitle(false); }, [openAlbumId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => { setCategory(c.key); setOpenAlbumId(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${category === c.key
                  ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                  : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {!openAlbum && canAdd && (
          <button
            onClick={() => setShowAddAlbum(true)}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shrink-0"
          >
            <Plus size={16} /> New Album
          </button>
        )}
      </div>

      {!openAlbum ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map(album => {
            const count = data.photos.filter(p => p.albumId === album.id).length;
            return (
              <button
                key={album.id}
                onClick={() => setOpenAlbumId(album.id)}
                className="group text-left rounded-xl overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-shadow"
              >
                <div className="h-36 overflow-hidden bg-heritage-cream-200">
                  <img src={album.coverPhotoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{album.title}</p>
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{count} photo{count !== 1 && 's'}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setOpenAlbumId(null)} className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1">
              <ChevronLeft size={16} /> All albums
            </button>
            {canAdd && (
              <button
                onClick={() => setShowAddPhotos(true)}
                className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
              >
                <ImagePlus size={16} /> Add Photos
              </button>
            )}
          </div>
          <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text mt-3 flex items-center gap-2">
            {editingTitle ? (
              <>
                <input
                  autoFocus
                  className="font-serif text-xl bg-transparent border-b border-heritage-gold-400 focus:outline-none text-heritage-green-900 dark:text-heritage-dark-text"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && titleDraft.trim()) {
                      updateAlbum(openAlbum.id, { title: titleDraft.trim() });
                      setEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setEditingTitle(false);
                    }
                  }}
                />
                <button
                  onClick={() => { if (titleDraft.trim()) { updateAlbum(openAlbum.id, { title: titleDraft.trim() }); setEditingTitle(false); } }}
                  className="text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900"
                  aria-label="Save album name"
                >
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                {openAlbum.title}
                {canAdd && (
                  <button
                    onClick={() => { setTitleDraft(openAlbum.title); setEditingTitle(true); }}
                    className="text-heritage-green-400 hover:text-heritage-green-800 dark:text-heritage-dark-muted"
                    aria-label="Rename album"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </>
            )}
          </h3>
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mb-4">{openAlbum.description}</p>
          {albumPhotos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No photos yet — be the first to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albumPhotos.map((p, i) => (
                <button key={p.id} onClick={() => setLightboxIndex(i)} className="rounded-lg overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border">
                  <img src={p.url} className="w-full h-32 object-cover hover:scale-105 transition-transform" alt={p.caption ?? ''} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddAlbum && (
        <AddAlbumModal
          onClose={() => setShowAddAlbum(false)}
          onCreated={(albumId) => {
            setShowAddAlbum(false);
            setOpenAlbumId(albumId);
          }}
        />
      )}

      {showAddPhotos && openAlbum && (
        <AddPhotosModal albumId={openAlbum.id} onClose={() => setShowAddPhotos(false)} />
      )}

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-5 right-5 text-white/80 hover:text-white"><X size={26} /></button>
          {lightboxIndex! > 0 && (
            <button onClick={() => setLightboxIndex(i => (i ?? 0) - 1)} className="absolute left-4 text-white/70 hover:text-white"><ChevronLeft size={32} /></button>
          )}
          {lightboxIndex! < albumPhotos.length - 1 && (
            <button onClick={() => setLightboxIndex(i => (i ?? 0) + 1)} className="absolute right-4 text-white/70 hover:text-white"><ChevronRight size={32} /></button>
          )}
          <div className="max-w-3xl w-full">
            <img src={lightboxPhoto.url} className="w-full max-h-[70vh] object-contain rounded-lg" alt={lightboxPhoto.caption ?? ''} />
            <div className="mt-3 text-center">
              {lightboxPhoto.caption && <p className="text-white text-sm">{lightboxPhoto.caption}</p>}
              {lightboxPhoto.taggedMemberIds.length > 0 && (
                <div className="flex justify-center flex-wrap gap-2 mt-2">
                  {lightboxPhoto.taggedMemberIds.map(id => {
                    const member = data.members.find(m => m.id === id);
                    if (!member) return null;
                    return (
                      <button key={id} onClick={() => onSelectMember(id)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-full">
                        {fullName(member)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
