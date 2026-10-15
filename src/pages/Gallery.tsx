import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, ImagePlus, Trash2, Tag, Pencil,
  Heart, ArrowRight, ArrowLeft, Camera,
  Smile, Cake, GraduationCap, Users2, BookOpen, Images, FolderOpen,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause, LayoutGrid, Film,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal } from '../components/gallery/AddAlbumModal';
import { EditAlbumModal } from '../components/gallery/EditAlbumModal';
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

  // Album view mode: 'slide' (default full-screen slideshow) or 'grid'
  const [albumViewMode, setAlbumViewMode] = useState<'slide' | 'grid'>('slide');
  // Current photo index inside the active album slideshow
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  // Fullscreen overlay mode for the slide viewer
  const [isSlideFullscreen, setIsSlideFullscreen] = useState(false);
  // Slideshow autoplay
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);

  // Which album we are adding photos to (opens AddPhotosModal)
  const [addPhotosAlbumId, setAddPhotosAlbumId] = useState<string | null>(null);

  // Add album modal
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [addAlbumCategory, setAddAlbumCategory] = useState<Album['category'] | undefined>();
  // Edit album modal
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

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

  // Reset slide index when opening a different album
  useEffect(() => {
    setActiveSlideIndex(0);
    setAlbumViewMode('slide');
    setIsSlideFullscreen(false);
    setIsPlayingSlideshow(false);
  }, [selectedAlbumId]);

  // If currently selected album is deleted, reset view
  useEffect(() => {
    if (selectedAlbumId && !data.albums.some(a => a.id === selectedAlbumId)) {
      setSelectedAlbumId(null);
    }
  }, [data.albums, selectedAlbumId]);

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
      setActiveSlideIndex(prev => Math.max(0, prev - 1));
    }
  };

  const toggleLike = (photoId: string) => {
    setLikes(prev => ({ ...prev, [photoId]: (prev[photoId] ?? 0) + 1 }));
  };

  // Find active album object if an album is selected
  const selectedAlbum = selectedAlbumId ? data.albums.find(a => a.id === selectedAlbumId) : null;
  const selectedAlbumPhotos = selectedAlbum
    ? data.photos
        .filter(p => p.albumId === selectedAlbum.id)
        .map((p, i) => ({ p, i }))
        // Earliest -> latest by date taken; undated photos keep their upload order after dated ones.
        .sort((a, b) => {
          const ta = a.p.takenAt ? new Date(a.p.takenAt).getTime() : Infinity;
          const tb = b.p.takenAt ? new Date(b.p.takenAt).getTime() : Infinity;
          return ta === tb ? a.i - b.i : ta - tb;
        })
        .map(x => x.p)
    : [];

  return (
    <div className="space-y-6">

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: ALBUM DETAIL VIEW (When an album is opened)                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {selectedAlbum ? (
        <div className="space-y-6">
          {/* Top navigation row */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setSelectedAlbumId(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text transition-colors"
            >
              <ArrowLeft size={16} /> Back to All Albums
            </button>

            {/* View Mode Toggle: Slide vs Grid */}
            {selectedAlbumPhotos.length > 0 && (
              <div className="flex items-center gap-1 bg-heritage-cream-100 dark:bg-heritage-dark-hover p-1 rounded-xl border border-heritage-cream-200 dark:border-heritage-dark-border">
                <button
                  onClick={() => setAlbumViewMode('slide')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    albumViewMode === 'slide'
                      ? 'bg-heritage-green-800 text-white shadow-soft'
                      : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900'
                  }`}
                  title="Full Screen Slide Viewer"
                >
                  <Film size={14} /> Slide View
                </button>
                <button
                  onClick={() => setAlbumViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    albumViewMode === 'grid'
                      ? 'bg-heritage-green-800 text-white shadow-soft'
                      : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900'
                  }`}
                  title="Grid Thumbnails"
                >
                  <LayoutGrid size={14} /> Grid View
                </button>
              </div>
            )}
          </div>


          {/* Empty state when album has no photos */}
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
          ) : albumViewMode === 'slide' ? (

            /* ── FULL SCREEN SLIDE VIEWER ── */
            <AlbumSlideViewer
              photos={selectedAlbumPhotos}
              members={data.members}
              currentIndex={activeSlideIndex}
              onIndexChange={setActiveSlideIndex}
              isFullscreen={isSlideFullscreen}
              onToggleFullscreen={() => setIsSlideFullscreen(prev => !prev)}
              isPlaying={isPlayingSlideshow}
              onTogglePlay={() => setIsPlayingSlideshow(prev => !prev)}
              canRemove={canRemove}
              likes={likes}
              onLike={toggleLike}
              onDeletePhoto={handleDeletePhoto}
              onSelectMember={onSelectMember}
            />

          ) : (

            /* ── GRID VIEW (Clean photo thumbnails without "View" button) ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedAlbumPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => {
                    setActiveSlideIndex(index);
                    setAlbumViewMode('slide');
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-heritage-cream-200 dark:bg-heritage-dark-card cursor-pointer shadow-soft hover:shadow-soft-xl transition-all duration-300 border border-heritage-cream-200 dark:border-heritage-dark-border"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                    {photo.caption && (
                      <p className="font-serif text-xs font-semibold line-clamp-1">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] opacity-80 mt-1">
                      <span>{photo.takenAt ? new Date(photo.takenAt).getFullYear() : ''}</span>
                      <span className="flex items-center gap-1">
                        <Heart size={11} className="text-rose-400 fill-rose-400" /> {likes[photo.id] ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Album details: sit BELOW the photos, and disappear while a photo is being viewed (slide / full view) */}
          {(albumViewMode === 'grid' || selectedAlbumPhotos.length === 0) && (() => {
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

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {canAdd && (
                    <button
                      onClick={() => setEditingAlbum(selectedAlbum)}
                      className="flex items-center gap-1.5 bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border shadow-soft transition-colors"
                      title="Edit Album Details"
                    >
                      <Pencil size={15} /> Edit Album
                    </button>
                  )}
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
                <span className="font-bold text-heritage-green-900 dark:text-heritage-dark-text">{totalPhotos}</span> photos. Tap any album to view in full screen slideshow.
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
                          canEdit={canAdd}
                          canRemove={canRemove}
                          onSelect={() => setSelectedAlbumId(album.id)}
                          onEdit={() => setEditingAlbum(album)}
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
                        canEdit={canAdd}
                        canRemove={canRemove}
                        onSelect={() => setSelectedAlbumId(album.id)}
                        onEdit={() => setEditingAlbum(album)}
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

      {editingAlbum && (
        <EditAlbumModal
          album={editingAlbum}
          onClose={() => setEditingAlbum(null)}
        />
      )}

      {addPhotosAlbumId && (
        <AddPhotosModal
          albumId={addPhotosAlbumId}
          onClose={() => setAddPhotosAlbumId(null)}
        />
      )}
    </div>
  );
};

// ── AlbumSlideViewer ──────────────────────────────────────────────────────────

interface AlbumSlideViewerProps {
  photos: Photo[];
  members: ReturnType<typeof useApp>['data']['members'];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  canRemove: boolean;
  likes: Record<string, number>;
  onLike: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onSelectMember: (id: string) => void;
}

function AlbumSlideViewer({
  photos, members, currentIndex, onIndexChange,
  isFullscreen, onToggleFullscreen, isPlaying, onTogglePlay,
  canRemove, likes, onLike, onDeletePhoto, onSelectMember,
}: AlbumSlideViewerProps) {
  const currentPhoto = photos[currentIndex] || photos[0];
  const touchStartX = useRef<number | null>(null);

  // Next / Prev slide handlers
  const nextSlide = () => {
    onIndexChange((currentIndex + 1) % photos.length);
  };

  const prevSlide = () => {
    onIndexChange((currentIndex - 1 + photos.length) % photos.length);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onTogglePlay();
      }
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFullscreen, photos.length]);

  // Slideshow auto-advance
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;
    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, photos.length]);

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-6 select-none"
    : "relative bg-black dark:bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none border border-black/20";

  return (
    <div className={containerClasses}>
      {/* ── Top controls bar ── */}
      <div className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent text-white">
        {/* Slide Counter */}
        <span className="text-xs sm:text-sm font-semibold tracking-wide bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
          {currentIndex + 1} / {photos.length}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Autoplay Slideshow */}
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-xl backdrop-blur-md transition-all ${
              isPlaying
                ? 'bg-heritage-gold-400 text-heritage-green-950 font-bold'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
            aria-label={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Exit Fullscreen Close button */}
          {isFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all"
              title="Close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Photo Canvas with slide controls ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative flex items-center justify-center overflow-hidden flex-grow ${
          isFullscreen ? 'h-[75vh]' : 'h-[55vh] sm:h-[65vh] md:h-[70vh]'
        }`}
      >
        {/* Photo Image */}
        <img
          key={currentPhoto.id}
          src={currentPhoto.url}
          alt={currentPhoto.caption ?? ''}
          className="w-full h-full object-contain transition-opacity duration-300 animate-fadeIn"
        />

        {/* Previous Slide Chevron */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all transform hover:scale-110 z-20"
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next Slide Chevron */}
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all transform hover:scale-110 z-20"
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ── Photo Details & Actions Bar ── */}
      <div className="p-4 sm:p-5 bg-gradient-to-t from-black/90 via-black/80 to-transparent text-white space-y-3 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            {currentPhoto.caption && (
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug">
                {currentPhoto.caption}
              </h3>
            )}
            <div className="flex items-center gap-3 text-xs text-white/70 flex-wrap">
              {currentPhoto.takenAt && (
                <span>{new Date(currentPhoto.takenAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}</span>
              )}
              {currentPhoto.taggedMemberIds?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag size={11} /> {currentPhoto.taggedMemberIds.length} tagged
                </span>
              )}
            </div>
          </div>

          {/* Like & Admin Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => onLike(currentPhoto.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Heart size={14} className="text-rose-400 fill-rose-400" />
              <span>{likes[currentPhoto.id] ?? 0}</span>
            </button>

            {canRemove && (
              <button
                onClick={() => onDeletePhoto(currentPhoto.id)}
                className="p-2 rounded-xl bg-red-600/70 hover:bg-red-600 backdrop-blur-md text-white text-xs transition-all"
                title="Delete photo"
                aria-label="Delete photo"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tagged family members */}
        {currentPhoto.taggedMemberIds?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-white/60 font-medium">In this photo:</span>
            {currentPhoto.taggedMemberIds.map(id => {
              const member = members.find(m => m.id === id);
              if (!member) return null;
              return (
                <button
                  key={id}
                  onClick={() => onSelectMember(id)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full transition-colors"
                >
                  {fullName(member)}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Slide Thumbnail Filmstrip ── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => onIndexChange(index)}
              className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-heritage-gold-400 scale-105 opacity-100'
                  : 'opacity-40 hover:opacity-80'
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AlbumCard ─────────────────────────────────────────────────────────────────

interface AlbumCardProps {
  album: Album;
  photos: Photo[];
  members: ReturnType<typeof useApp>['data']['members'];
  canEdit: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function AlbumCard({ album, photos, members, canEdit, canRemove, onSelect, onEdit, onDelete }: AlbumCardProps) {
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
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 text-heritage-green-600 hover:text-heritage-green-900 dark:text-heritage-dark-muted dark:hover:text-heritage-dark-text rounded-lg hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors"
                title="Edit Album Details"
                aria-label="Edit Album Details"
              >
                <Pencil size={13} />
              </button>
            )}
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
    </div>
  );
}
