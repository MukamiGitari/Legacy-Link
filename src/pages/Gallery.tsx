import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, ImagePlus, Pencil, Check, Trash2, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal, CATEGORY_OPTIONS } from '../components/gallery/AddAlbumModal';
import { AddPhotosModal } from '../components/gallery/AddPhotosModal';
import type { Album } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';
import { defaultCoverFor } from '../lib/albumCovers';

interface Props {
  onSelectMember: (id: string) => void;
}

export const Gallery: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, updateAlbum, removeAlbum, removePhoto } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);
  // Three levels deep: category chooser -> albums inside that category -> an album's photos.
  const [activeCategory, setActiveCategory] = useState<Album['category'] | null>(null);
  const [pageDirection, setPageDirection] = useState<'forward' | 'backward'>('forward');
  const [slideIndex, setSlideIndex] = useState(0);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingFeatured, setEditingFeatured] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const albums = activeCategory ? data.albums.filter(a => a.category === activeCategory) : [];
  const openAlbum = data.albums.find(a => a.id === openAlbumId);
  const albumPhotos = openAlbum ? data.photos.filter(p => p.albumId === openAlbum.id) : [];
  const lightboxPhoto = lightboxIndex !== null ? albumPhotos[lightboxIndex] : null;
  const featuredMember = openAlbum?.featuredMemberId ? data.members.find(m => m.id === openAlbum.featuredMemberId) : undefined;

  const openCategory = (key: Album['category']) => { setPageDirection('forward'); setActiveCategory(key); };
  const closeCategory = () => { setPageDirection('backward'); setActiveCategory(null); setOpenAlbumId(null); };

  const handleSlideTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleSlideTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setSlideIndex(i => Math.min(i + 1, CATEGORY_OPTIONS.length - 1));
      else setSlideIndex(i => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  useEffect(() => { setEditingTitle(false); setEditingFeatured(false); }, [openAlbumId]);

  const handleDeleteAlbum = (albumId: string, title: string) => {
    if (window.confirm(`Delete the album "${title}" and all of its photos? This can't be undone.`)) {
      removeAlbum(albumId);
      if (openAlbumId === albumId) setOpenAlbumId(null);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm('Delete this photo? This can\'t be undone.')) {
      removePhoto(photoId);
      setLightboxIndex(null);
    }
  };

  return (
    <div className="space-y-5">
      {!activeCategory ? (
        <>
          <div>
            <h2 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text">Family Gallery</h2>
            <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">Swipe or use the arrows to browse categories, then jump into the albums inside one.</p>
          </div>

          <div
            className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border select-none touch-pan-y"
            onTouchStart={handleSlideTouchStart}
            onTouchEnd={handleSlideTouchEnd}
          >
            {CATEGORY_OPTIONS.map((c, i) => {
              const count = data.albums.filter(a => a.category === c.key).length;
              const isActive = i === slideIndex;
              return (
                <div
                  key={c.key}
                  className={`absolute inset-0 transition-transform duration-500 ease-out ${isActive ? '' : 'pointer-events-none'}`}
                  style={{ transform: `translateX(${(i - slideIndex) * 100}%)` }}
                  aria-hidden={!isActive}
                >
                  <img src={defaultCoverFor(c.key)} className="w-full h-full object-cover" alt={c.label} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-xl sm:text-2xl text-white drop-shadow-sm truncate">{c.label}</p>
                      <p className="text-xs sm:text-sm text-white/90 mt-1">{count} album{count !== 1 && 's'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openCategory(c.key)}
                        className="text-xs sm:text-sm font-medium px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-heritage-green-800 whitespace-nowrap"
                      >
                        View albums
                      </button>
                      {canAdd && (
                        <button
                          onClick={() => { openCategory(c.key); setShowAddAlbum(true); }}
                          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white whitespace-nowrap"
                        >
                          <Plus size={14} /> New Album
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {slideIndex > 0 && (
              <button
                onClick={() => setSlideIndex(i => Math.max(i - 1, 0))}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/85 hover:bg-white text-heritage-green-800 rounded-full p-2 shadow-sm"
                aria-label="Previous category"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {slideIndex < CATEGORY_OPTIONS.length - 1 && (
              <button
                onClick={() => setSlideIndex(i => Math.min(i + 1, CATEGORY_OPTIONS.length - 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/85 hover:bg-white text-heritage-green-800 rounded-full p-2 shadow-sm"
                aria-label="Next category"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            {CATEGORY_OPTIONS.map((c, i) => (
              <button
                key={c.key}
                onClick={() => setSlideIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === slideIndex ? 'w-5 bg-heritage-green-800 dark:bg-heritage-gold-400' : 'w-1.5 bg-heritage-cream-400 dark:bg-heritage-dark-border'}`}
                aria-label={`Go to ${c.label}`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="gallery-page-perspective">
        <div key={openAlbum ? `album-${openAlbum.id}` : `category-${activeCategory}`} className={pageDirection === 'forward' ? 'gallery-page-turn-forward' : 'gallery-page-turn-backward'}>

      {!openAlbum && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button onClick={closeCategory} className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1">
            <ChevronLeft size={16} /> All categories
          </button>
          {canAdd && (
            <button
              onClick={() => setShowAddAlbum(true)}
              className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shrink-0"
            >
              <Plus size={16} /> New Album
            </button>
          )}
        </div>
      )}

      {!openAlbum ? (
        <>
          <h3 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text mb-3">
            {CATEGORY_OPTIONS.find(c => c.key === activeCategory)?.label}
          </h3>
          {albums.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No albums here yet{canAdd ? ' — start one!' : '.'}</p>
            </div>
          ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
            {albums.map((album, i) => {
              const count = data.photos.filter(p => p.albumId === album.id).length;
              const featured = album.featuredMemberId ? data.members.find(m => m.id === album.featuredMemberId) : undefined;
              // Vary the cover height a little so the grid reads as masonry rather than a uniform grid.
              const coverHeightCls = ['h-40', 'h-52', 'h-44', 'h-60'][i % 4];
              return (
                <div key={album.id} className="break-inside-avoid mb-4 group relative rounded-xl overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-shadow">
                  {canRemove && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id, album.title); }}
                      className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                      aria-label="Delete album"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button onClick={() => setOpenAlbumId(album.id)} className="block w-full text-left">
                    <div className={`${coverHeightCls} overflow-hidden bg-heritage-cream-200`}>
                      <img src={album.coverPhotoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{album.title}</p>
                      {featured && (
                        <p className="text-xs text-heritage-gold-600 dark:text-heritage-gold-400 flex items-center gap-1 mt-0.5 truncate">
                          <Tag size={11} className="shrink-0" /> About {fullName(featured)}
                        </p>
                      )}
                      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{count} photo{count !== 1 && 's'}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setOpenAlbumId(null)} className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1">
              <ChevronLeft size={16} /> {CATEGORY_OPTIONS.find(c => c.key === activeCategory)?.label} albums
            </button>
            <div className="flex items-center gap-2">
              {canAdd && (
                <button
                  onClick={() => setShowAddPhotos(true)}
                  className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
                >
                  <ImagePlus size={16} /> Add Photos
                </button>
              )}
              {canRemove && (
                <button
                  onClick={() => handleDeleteAlbum(openAlbum.id, openAlbum.title)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-900"
                >
                  <Trash2 size={15} /> Delete Album
                </button>
              )}
            </div>
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
          <div className="mt-1.5">
            {editingFeatured ? (
              <select
                autoFocus
                className="text-xs rounded-md border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-2 py-1 focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
                value={openAlbum.featuredMemberId ?? ''}
                onChange={e => { updateAlbum(openAlbum.id, { featuredMemberId: e.target.value || undefined }); setEditingFeatured(false); }}
                onBlur={() => setEditingFeatured(false)}
              >
                <option value="">No one in particular</option>
                {data.members.map(m => (
                  <option key={m.id} value={m.id}>{fullName(m)}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => canAdd && setEditingFeatured(true)}
                className={`text-xs flex items-center gap-1 ${featuredMember ? 'text-heritage-gold-600 dark:text-heritage-gold-400' : 'text-heritage-green-400 dark:text-heritage-dark-muted'} ${canAdd ? 'hover:underline' : ''}`}
                disabled={!canAdd}
              >
                <Tag size={11} />
                {featuredMember ? `About ${fullName(featuredMember)}` : (canAdd ? 'Tag who this album is about' : '')}
              </button>
            )}
          </div>
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mb-4 mt-1">{openAlbum.description}</p>
          {albumPhotos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No photos yet — be the first to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albumPhotos.map((p, i) => (
                <div key={p.id} className="group relative rounded-lg overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border">
                  {canRemove && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                      className="absolute top-1.5 right-1.5 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                      aria-label="Delete photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <button onClick={() => setLightboxIndex(i)} className="block w-full">
                    <img src={p.url} className="w-full h-32 object-cover hover:scale-105 transition-transform" alt={p.caption ?? ''} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        </div>
        </div>
      )}

      {showAddAlbum && (
        <AddAlbumModal
          lockedCategory={activeCategory ?? undefined}
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
          {canRemove && lightboxPhoto && (
            <button
              onClick={() => handleDeletePhoto(lightboxPhoto.id)}
              className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
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
