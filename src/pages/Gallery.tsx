import React, { useState, useEffect } from 'react';
import {
  X, Plus, ImagePlus, Trash2, Tag,
  Heart, ArrowRight, ArrowLeft, Camera,
  Smile, Cake, GraduationCap, Users2, BookOpen, Images, FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal } from '../components/gallery/AddAlbumModal';
import { AddPhotosModal } from '../components/gallery/AddPhotosModal';
import type { Album, Photo } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';
import { defaultCoverFor } from '../lib/albumCovers';

// ── Category metadata ─────────────────────────────────────────────────────────

type CategoryKey = Album['category'] | 'all';

interface CategoryMeta {
  key: Exclude<CategoryKey, 'all'>;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}

const CATEGORY_META: CategoryMeta[] = [
  { key: 'childhood',   label: 'Childhood',   icon: <Smile size={18} />,         iconColor: 'text-amber-700' },
  { key: 'birthdays',   label: 'Birthdays',   icon: <Cake size={18} />,          iconColor: 'text-rose-600' },
  { key: 'graduations', label: 'Graduations', icon: <GraduationCap size={18} />,  iconColor: 'text-heritage-green-700' },
  { key: 'weddings',    label: 'Weddings',    icon: <Heart size={18} />,          iconColor: 'text-heritage-bark-600' },
  { key: 'reunions',    label: 'Reunions',    icon: <Users2 size={18} />,         iconColor: 'text-blue-700' },
  { key: 'historical',  label: 'Historical',  icon: <BookOpen size={18} />,       iconColor: 'text-amber-900' },
  { key: 'memorials',   label: 'Memorials',   icon: <Images size={18} />,         iconColor: 'text-slate-600' },
];

function getCategoryMeta(key: Exclude<CategoryKey, 'all'>): CategoryMeta {
  return CATEGORY_META.find(c => c.key === key) ?? CATEGORY_META[0];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onSelectMember: (id: string) => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export const Gallery: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, removeAlbum, removePhoto } = useApp();
  const canAdd    = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  // Selected album ID for viewing photos inside that album
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('album');
  });

  // Category filter on the album list view
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  // Which album we are adding photos to (opens AddPhotosModal)
  const [addPhotosAlbumId, setAddPhotosAlbumId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxAlbum, setLightboxAlbum]  = useState<Album | null>(null);

  // Add album modal
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [addAlbumCategory, setAddAlbumCategory] = useState<Album['category'] | undefined>();

  // Likes (local counter)
  const [likes, setLikes] = useState<Record<string, number>>({});

  const totalPhotos = data.photos.length;
  const totalAlbums = data.albums.length;

  // Sync selected album ID to URL query param
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedAlbumId) {
      url.searchParams.set('album', selectedAlbumId);
    } else {
      url.searchParams.delete('album');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedAlbumId]);

  // If currently selected album is deleted, reset view
  useEffect(() => {
    if (selectedAlbumId && !data.albums.some(a => a.id === selectedAlbumId)) {
      setSelectedAlbumId(null);
    }
  }, [data.albums, selectedAlbumId]);

  // Keep lightboxPhoto in sync if photo is deleted
  useEffect(() => {
    if (lightboxPhoto && !data.photos.some(p => p.id === lightboxPhoto.id)) {
      setLightboxPhoto(null);
    }
  }, [data.photos, lightboxPhoto]);

  const handleDeleteAlbum = (albumId: string, title: string) => {
    if (window.confirm(`Delete the album "${title}" and all of its photos? This can't be undone.`)) {
      removeAlbum(albumId);
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
      }
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm("Delete this photo? This can't be undone.")) {
      removePhoto(photoId);
      setLightboxPhoto(null);
    }
  };

  const openLightbox = (photo: Photo) => {
    const album = data.albums.find(a => a.id === photo.albumId) ?? null;
    setLightboxPhoto(photo);
    setLightboxAlbum(album);
  };

  const toggleLike = (photoId: string) => {
    setLikes(prev => ({ ...prev, [photoId]: (prev[photoId] ?? 0) + 1 }));
  };

  // Find active album object if an album is selected
  const selectedAlbum = selectedAlbumId ? data.albums.find(a => a.id === selectedAlbumId) : null;
  const selectedAlbumPhotos = selectedAlbum ? data.photos.filter(p => p.albumId === selectedAlbum.id) : [];

  return (
    <div className="space-y-6">

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: ALBUM DETAIL VIEW (When an album is tapped)                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {selectedAlbum ? (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedAlbumId(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text transition-colors"
          >
            <ArrowLeft size={16} /> Back to All Albums
          </button>

          {/* Album Header Banner */}
          {(() => {
            const meta = getCategoryMeta(selectedAlbum.category as Exclude<CategoryKey, 'all'>);
            const featuredMember = selectedAlbum.featuredMemberId
              ? data.members.find(m => m.id === selectedAlbum.featuredMemberId)
              : null;

            return (
              <div className="bg-white dark:bg-heritage-dark-card rounded-2xl p-6 sm:p-8 shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-heritage-bark-600 text-white shadow-soft">
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted bg-heritage-cream-100 dark:bg-heritage-dark-hover px-3 py-1 rounded-full">
                      {selectedAlbumPhotos.length} {selectedAlbumPhotos.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-green-900 dark:text-heritage-dark-text">
                    {selectedAlbum.title}
                  </h2>
                  {selectedAlbum.description && (
                    <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-2xl leading-relaxed">
                      {selectedAlbum.description}
                    </p>
                  )}
                  {featuredMember && (
                    <p className="text-xs text-heritage-bark-600 dark:text-heritage-gold-400 font-medium">
                      Dedicated to:{' '}
                      <button
                        onClick={() => onSelectMember(featuredMember.id)}
                        className="font-semibold underline hover:text-heritage-green-800"
                      >
                        {fullName(featuredMember)}
                      </button>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canAdd && (
                    <button
                      onClick={() => setAddPhotosAlbumId(selectedAlbum.id)}
                      className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors"
                    >
                      <ImagePlus size={15} /> Add Photos
                    </button>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => handleDeleteAlbum(selectedAlbum.id, selectedAlbum.title)}
                      className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 transition-colors"
                      title="Delete Album"
                      aria-label="Delete Album"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Photos inside this specific album */}
          {selectedAlbumPhotos.length === 0 ? (
            <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-12 text-center bg-white dark:bg-heritage-dark-card space-y-4">
              <div className="w-16 h-16 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-600 dark:text-heritage-dark-muted">
                <Camera size={28} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-heritage-green-900 dark:text-heritage-dark-text">
                  No photos in this album yet
                </h4>
                <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mt-1 max-w-sm mx-auto">
                  Add the first memories and pictures to "{selectedAlbum.title}".
                </p>
              </div>
              {canAdd && (
                <button
                  onClick={() => setAddPhotosAlbumId(selectedAlbum.id)}
                  className="inline-flex items-center gap-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-soft transition-all"
                >
                  <ImagePlus size={15} /> Add Photos Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {selectedAlbumPhotos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  likes={likes[photo.id] ?? 0}
                  canRemove={canRemove}
                  onView={() => openLightbox(photo)}
                  onDelete={() => handleDeletePhoto(photo.id)}
                  onLike={() => toggleLike(photo.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (

        /* ────────────────────────────────────────────────────────────────────── */
        /* VIEW 2: ALBUMS OVERVIEW (Grouped albums list)                          */
        /* ────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Top action row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
                <span className="font-bold text-heritage-green-900 dark:text-heritage-dark-text">{totalAlbums}</span> albums with{' '}
                <span className="font-bold text-heritage-green-900 dark:text-heritage-dark-text">{totalPhotos}</span> photos. Tap any album to view all photos inside.
              </p>
            </div>
            {canAdd && (
              <button
                onClick={() => {
                  setAddAlbumCategory(activeCategory !== 'all' ? activeCategory : undefined);
                  setShowAddAlbum(true);
                }}
                className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors self-start sm:self-auto"
              >
                <Plus size={15} /> New Album
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-heritage-green-800 text-white shadow-soft'
                  : 'bg-white dark:bg-heritage-dark-card text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover border border-heritage-cream-200 dark:border-heritage-dark-border'
              }`}
            >
              All Albums ({totalAlbums})
            </button>
            {CATEGORY_META.map(cat => {
              const count = data.albums.filter(a => a.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.key
                      ? 'bg-heritage-green-800 text-white shadow-soft'
                      : 'bg-white dark:bg-heritage-dark-card text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover border border-heritage-cream-200 dark:border-heritage-dark-border'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Albums Display */}
          {activeCategory === 'all' ? (
            /* Grouped by category sections */
            <div className="space-y-10">
              {CATEGORY_META.map(meta => {
                const albums = data.albums.filter(a => a.category === meta.key);
                if (albums.length === 0) return null;

                return (
                  <div key={meta.key} className="space-y-4">
                    {/* Category Subheader */}
                    <div className="flex items-center justify-between border-b border-heritage-cream-200 dark:border-heritage-dark-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl bg-heritage-cream-100 dark:bg-heritage-dark-hover flex items-center justify-center ${meta.iconColor}`}>
                          {meta.icon}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-heritage-green-900 dark:text-heritage-dark-text">
                          {meta.label}
                        </h3>
                        <span className="text-xs font-medium text-heritage-green-500 dark:text-heritage-dark-muted">
                          ({albums.length} {albums.length === 1 ? 'album' : 'albums'})
                        </span>
                      </div>
                      {canAdd && (
                        <button
                          onClick={() => { setAddAlbumCategory(meta.key); setShowAddAlbum(true); }}
                          className="text-xs font-semibold text-heritage-green-700 dark:text-heritage-gold-400 hover:underline flex items-center gap-1"
                        >
                          <Plus size={13} /> Add {meta.label} Album
                        </button>
                      )}
                    </div>

                    {/* Album Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {albums.map(album => (
                        <AlbumCard
                          key={album.id}
                          album={album}
                          photos={data.photos.filter(p => p.albumId === album.id)}
                          members={data.members}
                          canRemove={canRemove}
                          onSelect={() => setSelectedAlbumId(album.id)}
                          onDelete={() => handleDeleteAlbum(album.id, album.title)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* In case no albums exist at all */}
              {totalAlbums === 0 && (
                <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-12 text-center bg-white dark:bg-heritage-dark-card space-y-4">
                  <div className="w-16 h-16 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-600 dark:text-heritage-dark-muted">
                    <FolderOpen size={28} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-heritage-green-900 dark:text-heritage-dark-text">
                      No albums created yet
                    </h4>
                    <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mt-1 max-w-sm mx-auto">
                      Create family albums to organize pictures of childhood, weddings, birthdays, and reunions.
                    </p>
                  </div>
                  {canAdd && (
                    <button
                      onClick={() => setShowAddAlbum(true)}
                      className="inline-flex items-center gap-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-soft transition-all"
                    >
                      <Plus size={15} /> Create First Album
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Specific Category View */
            <div>
              {(() => {
                const meta = getCategoryMeta(activeCategory as Exclude<CategoryKey, 'all'>);
                const albums = data.albums.filter(a => a.category === activeCategory);

                if (albums.length === 0) {
                  return (
                    <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-12 text-center bg-white dark:bg-heritage-dark-card space-y-4">
                      <div className="w-16 h-16 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-600 dark:text-heritage-dark-muted">
                        <FolderOpen size={28} />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-lg text-heritage-green-900 dark:text-heritage-dark-text">
                          No {meta.label} albums yet
                        </h4>
                        <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mt-1 max-w-sm mx-auto">
                          Be the first to create an album for {meta.label.toLowerCase()} moments.
                        </p>
                      </div>
                      {canAdd && (
                        <button
                          onClick={() => { setAddAlbumCategory(meta.key); setShowAddAlbum(true); }}
                          className="inline-flex items-center gap-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-soft transition-all"
                        >
                          <Plus size={15} /> Create {meta.label} Album
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {albums.map(album => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        photos={data.photos.filter(p => p.albumId === album.id)}
                        members={data.members}
                        canRemove={canRemove}
                        onSelect={() => setSelectedAlbumId(album.id)}
                        onDelete={() => handleDeleteAlbum(album.id, album.title)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddAlbum && (
        <AddAlbumModal
          initialCategory={addAlbumCategory ?? (activeCategory !== 'all' ? activeCategory : ((selectedAlbum as Album | null)?.category ?? 'childhood'))}
          onClose={() => {
            setShowAddAlbum(false);
            setAddAlbumCategory(undefined);
          }}
          onCreated={(albumId) => {
            setShowAddAlbum(false);
            setAddAlbumCategory(undefined);
            setSelectedAlbumId(albumId);
            setAddPhotosAlbumId(albumId);
          }}
        />
      )}

      {addPhotosAlbumId && (
        <AddPhotosModal
          albumId={addPhotosAlbumId}
          onClose={() => setAddPhotosAlbumId(null)}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          album={lightboxAlbum}
          members={data.members}
          likes={likes[lightboxPhoto.id] ?? 0}
          canRemove={canRemove}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => handleDeletePhoto(lightboxPhoto.id)}
          onLike={() => toggleLike(lightboxPhoto.id)}
          onSelectMember={onSelectMember}
        />
      )}
    </div>
  );
};

// ── AlbumCard ─────────────────────────────────────────────────────────────────

interface AlbumCardProps {
  album: Album;
  photos: Photo[];
  members: ReturnType<typeof useApp>['data']['members'];
  canRemove: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function AlbumCard({ album, photos, members, canRemove, onSelect, onDelete }: AlbumCardProps) {
  const meta = getCategoryMeta(album.category as Exclude<CategoryKey, 'all'>);
  const featuredMember = album.featuredMemberId
    ? members.find(m => m.id === album.featuredMemberId)
    : null;

  // Determine cover: album coverPhotoUrl -> first photo url -> default category illustration
  const coverUrl = album.coverPhotoUrl || (photos.length > 0 ? photos[0].url : defaultCoverFor(album.category));

  return (
    <div
      onClick={onSelect}
      className="group relative bg-white dark:bg-heritage-dark-card rounded-2xl overflow-hidden border border-heritage-cream-200 dark:border-heritage-dark-border hover:border-heritage-gold-500/50 hover:shadow-soft-xl transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-heritage-cream-100 dark:bg-heritage-dark-hover">
        <img
          src={coverUrl}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-white/90 dark:bg-heritage-dark-card/90 backdrop-blur-md text-heritage-green-900 dark:text-heritage-dark-text px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          {meta.icon}
          <span>{meta.label}</span>
        </span>

        {/* Photo Count Badge */}
        <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
          <Camera size={12} />
          <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
        </span>
      </div>

      {/* Album Body */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h4 className="font-serif font-bold text-lg text-heritage-green-900 dark:text-heritage-dark-text group-hover:text-heritage-bark-600 transition-colors line-clamp-1">
            {album.title}
          </h4>
          {album.description && (
            <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted line-clamp-2 mt-1 leading-relaxed">
              {album.description}
            </p>
          )}
          {featuredMember && (
            <p className="text-[11px] font-medium text-heritage-bark-600 dark:text-heritage-gold-400 mt-2 flex items-center gap-1">
              <span>Dedicated to:</span>
              <span className="font-semibold underline">{fullName(featuredMember)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-heritage-cream-100 dark:border-heritage-dark-border text-xs">
          <span className="font-semibold text-heritage-green-800 dark:text-heritage-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Open Album <ArrowRight size={13} />
          </span>
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-heritage-green-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Delete Album"
              aria-label="Delete Album"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PhotoCard ─────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: Photo;
  likes: number;
  canRemove: boolean;
  onView: () => void;
  onDelete: () => void;
  onLike: () => void;
}

function PhotoCard({ photo, likes, canRemove, onView, onDelete, onLike }: PhotoCardProps) {
  return (
    <div
      onClick={onView}
      className="group bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-2xl overflow-hidden border border-heritage-cream-200 dark:border-heritage-dark-border hover:border-heritage-bark-400 dark:hover:border-heritage-bark-600 transition-all duration-300 shadow-soft hover:shadow-soft-lg cursor-pointer flex flex-col"
    >
      {/* Photo cover */}
      <div className="relative h-52 w-full overflow-hidden bg-heritage-cream-200 dark:bg-heritage-dark-card shrink-0">
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.caption ?? ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
        )}
        {/* Date badge — top left */}
        {photo.takenAt && (
          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            {new Date(photo.takenAt).getFullYear()}
          </span>
        )}
        {/* Likes badge — top right */}
        <span
          onClick={e => { e.stopPropagation(); onLike(); }}
          className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/80 transition-colors"
        >
          <Heart size={10} className="text-rose-400 fill-rose-400" /> {likes}
        </span>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
        <div>
          {photo.caption && (
            <h4 className="font-serif font-bold text-heritage-green-900 dark:text-heritage-dark-text text-base group-hover:text-heritage-bark-600 transition-colors line-clamp-1">
              {photo.caption}
            </h4>
          )}
          {photo.taggedMemberIds?.length > 0 && (
            <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mt-1 flex items-center gap-1">
              <Tag size={10} /> {photo.taggedMemberIds.length} tagged
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border text-xs">
          <span className="text-heritage-bark-600 dark:text-heritage-bark-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            View <ArrowRight size={11} />
          </span>
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-heritage-green-400 hover:text-red-600 transition-colors"
              title="Delete photo"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PhotoLightbox ─────────────────────────────────────────────────────────────

interface PhotoLightboxProps {
  photo: Photo;
  album: Album | null;
  members: ReturnType<typeof useApp>['data']['members'];
  likes: number;
  canRemove: boolean;
  onClose: () => void;
  onDelete: () => void;
  onLike: () => void;
  onSelectMember: (id: string) => void;
}

function PhotoLightbox({
  photo, album, members, likes, canRemove,
  onClose, onDelete, onLike, onSelectMember,
}: PhotoLightboxProps) {
  const meta = album ? getCategoryMeta(album.category as Exclude<CategoryKey, 'all'>) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-heritage-dark-card rounded-2xl shadow-2xl border border-heritage-cream-200 dark:border-heritage-dark-border my-8 overflow-hidden flex flex-col max-h-[95vh]">

        {/* Photo area */}
        <div className="relative bg-heritage-green-900 flex-shrink-0 flex items-center justify-center max-h-[60vh] overflow-hidden">
          {photo.url ? (
            <img
              src={photo.url}
              alt={photo.caption ?? ''}
              className="w-full h-full object-contain max-h-[60vh]"
            />
          ) : (
            <div className="w-full flex items-center justify-center py-20 text-7xl">📷</div>
          )}
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm z-10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-grow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              {meta && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-heritage-bark-600 text-white mb-2 shadow-soft">
                  {meta.label}
                </span>
              )}
              {photo.caption && (
                <h3 className="text-2xl font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text">
                  {photo.caption}
                </h3>
              )}
            </div>
            {photo.takenAt && (
              <span className="text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted bg-heritage-cream-100 dark:bg-heritage-dark-hover px-3 py-1.5 rounded-xl shrink-0">
                {new Date(photo.takenAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}
              </span>
            )}
          </div>

          {/* Tagged members as description */}
          {photo.taggedMemberIds?.length > 0 && (
            <div className="bg-heritage-cream-50 dark:bg-heritage-dark-hover p-4 rounded-2xl border border-heritage-cream-100 dark:border-heritage-dark-border">
              <p className="text-xs font-semibold text-heritage-green-600 dark:text-heritage-dark-muted uppercase tracking-wide mb-2">
                People in this photo
              </p>
              <div className="flex flex-wrap gap-2">
                {photo.taggedMemberIds.map(id => {
                  const member = members.find(m => m.id === id);
                  if (!member) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => { onClose(); onSelectMember(id); }}
                      className="text-xs bg-heritage-green-100 dark:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text px-3 py-1 rounded-full hover:bg-heritage-green-200 dark:hover:bg-heritage-dark-hover transition-colors font-medium"
                    >
                      {fullName(member)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Album info */}
          {album && (
            <p className="text-heritage-green-600 dark:text-heritage-dark-muted text-sm leading-relaxed bg-heritage-cream-50 dark:bg-heritage-dark-hover p-4 rounded-2xl border border-heritage-cream-100 dark:border-heritage-dark-border">
              {album.description || `From the ${album.title} album.`}
            </p>
          )}

          {/* Like button */}
          <div className="flex items-center justify-end text-xs pt-2 border-t border-heritage-cream-100 dark:border-heritage-dark-border">
            <button
              onClick={onLike}
              className="px-3 py-1.5 rounded-xl bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text font-semibold transition-all flex items-center gap-1.5 border border-heritage-cream-200 dark:border-heritage-dark-border"
            >
              <Heart size={13} className="text-rose-500 fill-rose-500" />
              <span>{likes} Like{likes !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-heritage-cream-50 dark:bg-heritage-dark-hover border-t border-heritage-cream-200 dark:border-heritage-dark-border flex justify-end gap-3 flex-shrink-0">
          {canRemove && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-200 dark:bg-heritage-dark-card hover:bg-heritage-cream-300 dark:hover:bg-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-muted transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
