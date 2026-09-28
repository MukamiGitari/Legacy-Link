import React, { useState, useEffect } from 'react';
import {
  X, Plus, ImagePlus, Pencil, Check, Trash2, Tag,
  Heart, ArrowRight, Camera, TreeDeciduous,
  Smile, Cake, GraduationCap, Users2, BookOpen, Images,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal } from '../components/gallery/AddAlbumModal';
import { AddPhotosModal } from '../components/gallery/AddPhotosModal';
import type { Album, Photo } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

// ── Category metadata ─────────────────────────────────────────────────────────

type CategoryKey = Album['category'] | 'all';

interface CategoryMeta {
  key: Exclude<CategoryKey, 'all'>;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}

const CATEGORY_META: CategoryMeta[] = [
  { key: 'childhood',   label: 'Childhood',   icon: <Smile size={18} />,        iconColor: 'text-amber-700' },
  { key: 'birthdays',   label: 'Birthdays',   icon: <Cake size={18} />,         iconColor: 'text-rose-600' },
  { key: 'graduations', label: 'Graduations', icon: <GraduationCap size={18} />, iconColor: 'text-heritage-green-700' },
  { key: 'weddings',    label: 'Weddings',    icon: <Heart size={18} />,         iconColor: 'text-heritage-bark-600' },
  { key: 'reunions',    label: 'Reunions',    icon: <Users2 size={18} />,        iconColor: 'text-blue-700' },
  { key: 'historical',  label: 'Historical',  icon: <BookOpen size={18} />,      iconColor: 'text-amber-900' },
  { key: 'memorials',   label: 'Memorials',   icon: <Images size={18} />,        iconColor: 'text-slate-600' },
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
  const { data, currentProfile, updateAlbum, removeAlbum, removePhoto } = useApp();
  const canAdd  = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  // Which album we are adding photos to (opens AddPhotosModal)
  const [addPhotosAlbumId, setAddPhotosAlbumId] = useState<string | null>(null);
  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxAlbum, setLightboxAlbum]  = useState<Album | null>(null);
  // Add album modal
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [addAlbumCategory, setAddAlbumCategory] = useState<Album['category'] | undefined>();
  // Likes (local only — no backend field on Photo)
  const [likes, setLikes] = useState<Record<string, number>>({});

  const totalPhotos = data.photos.length;

  const handleDeleteAlbum = (albumId: string, title: string) => {
    if (window.confirm(`Delete the album "${title}" and all of its photos? This can't be undone.`)) {
      removeAlbum(albumId);
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

  // Keep lightboxPhoto in sync if photo is deleted
  useEffect(() => {
    if (lightboxPhoto && !data.photos.find(p => p.id === lightboxPhoto.id)) {
      setLightboxPhoto(null);
    }
  }, [data.photos, lightboxPhoto]);

  return (
    <div className="space-y-0">
      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 60%, #c8b99a 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <TreeDeciduous size={260} className="text-heritage-green-800" />
        </div>
        <div className="relative z-10 flex items-center justify-between px-8 py-8 gap-6">
          {/* Left */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-heritage-green-800/10 flex items-center justify-center">
              <Camera size={26} className="text-heritage-green-800" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-heritage-green-900 leading-tight">
                Photo Gallery
              </h1>
              <p className="text-heritage-green-700 font-medium mt-0.5 italic text-sm">
                Cherished moments. Timeless memories.
              </p>
              <p className="text-heritage-green-600 text-xs mt-1 max-w-md">
                Explore our family's journey through photos — from childhood smiles to lifelong
                milestones and the moments that keep us connected.
              </p>
              <div className="mt-2 w-12 h-0.5 bg-heritage-gold-500 rounded-full" />
            </div>
          </div>
          {/* Right — quote */}
          <div className="shrink-0 max-w-xs text-right hidden md:block">
            <p className="font-serif text-lg italic text-heritage-green-800 leading-snug">
              "Family is where life begins and love never ends."
            </p>
            <div className="mt-2 flex justify-end">
              <div className="w-5 h-5 rounded-full border-2 border-heritage-green-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-heritage-green-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top action row ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
          <span className="font-semibold text-heritage-green-900 dark:text-heritage-dark-text">{totalPhotos}</span> total photos across all albums
        </p>
        {canAdd && (
          <button
            onClick={() => { setAddAlbumCategory(undefined); setShowAddAlbum(true); }}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-soft transition-colors"
          >
            <Plus size={15} /> New Album
          </button>
        )}
      </div>

      {/* ── Category Sections ── */}
      <div className="space-y-10">
        {CATEGORY_META.map(meta => {
          const albums = data.albums.filter(a => a.category === meta.key);
          // Gather all photos for this category
          const albumIds = new Set(albums.map(a => a.id));
          const photos = data.photos.filter(p => albumIds.has(p.albumId));

          return (
            <CategorySection
              key={meta.key}
              meta={meta}
              albums={albums}
              photos={photos}
              members={data.members}
              canAdd={canAdd}
              canRemove={canRemove}
              likes={likes}
              onAddPhotos={(albumId) => setAddPhotosAlbumId(albumId)}
              onAddAlbum={() => { setAddAlbumCategory(meta.key); setShowAddAlbum(true); }}
              onDeleteAlbum={handleDeleteAlbum}
              onViewPhoto={openLightbox}
              onToggleLike={toggleLike}
            />
          );
        })}
      </div>

      {/* ── Modals ── */}
      {showAddAlbum && (
        <AddAlbumModal
          onClose={() => setShowAddAlbum(false)}
          onCreated={(albumId) => {
            setShowAddAlbum(false);
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

// ── CategorySection ───────────────────────────────────────────────────────────

interface CategorySectionProps {
  meta: CategoryMeta;
  albums: Album[];
  photos: Photo[];
  members: ReturnType<typeof useApp>['data']['members'];
  canAdd: boolean;
  canRemove: boolean;
  likes: Record<string, number>;
  onAddPhotos: (albumId: string) => void;
  onAddAlbum: () => void;
  onDeleteAlbum: (id: string, title: string) => void;
  onViewPhoto: (photo: Photo) => void;
  onToggleLike: (photoId: string) => void;
}

function CategorySection({
  meta, albums, photos, members, canAdd, canRemove, likes,
  onAddPhotos, onAddAlbum, onDeleteAlbum, onViewPhoto, onToggleLike,
}: CategorySectionProps) {

  const primaryAlbum = albums[0];

  return (
    <div className="bg-white dark:bg-heritage-dark-card rounded-2xl p-6 shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border space-y-6">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-heritage-cream-100 dark:border-heritage-dark-border pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-heritage-cream-100 dark:bg-heritage-dark-hover flex items-center justify-center shadow-inner ${meta.iconColor}`}>
            {meta.icon}
          </div>
          <div>
            <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text font-bold">
              {meta.label}
            </h3>
            <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted font-medium">
              {photos.length} Photo{photos.length !== 1 ? 's' : ''} Added
            </p>
          </div>
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            {primaryAlbum && (
              <button
                onClick={() => onAddPhotos(primaryAlbum.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted transition-all shadow-soft border border-heritage-cream-300 dark:border-heritage-dark-border"
              >
                <ImagePlus size={13} /> Add Photo
              </button>
            )}
            <button
              onClick={onAddAlbum}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted transition-all shadow-soft border border-heritage-cream-300 dark:border-heritage-dark-border"
            >
              <Plus size={13} /> New Album
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-8 text-center bg-heritage-cream-50/50 dark:bg-heritage-dark-hover/30">
          <div className="w-12 h-12 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-500 dark:text-heritage-dark-muted mb-3">
            <Camera size={20} />
          </div>
          <h4 className="font-bold text-heritage-green-800 dark:text-heritage-dark-text text-sm">
            0 Photos Added
          </h4>
          <p className="text-heritage-green-500 dark:text-heritage-dark-muted text-xs mt-1 max-w-sm mx-auto">
            Add the first photo to {meta.label.toLowerCase()}
          </p>
          {canAdd && (
            <button
              onClick={onAddAlbum}
              className="mt-4 inline-flex items-center gap-2 bg-heritage-bark-600 hover:bg-heritage-bark-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <Plus size={13} /> Add the first photo to {meta.label.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        /* Photo grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              likes={likes[photo.id] ?? 0}
              canRemove={canRemove}
              onView={() => onViewPhoto(photo)}
              onDelete={() => {
                if (window.confirm("Delete this photo? This can't be undone.")) {
                  // handled in parent via removePhoto
                }
              }}
              onLike={() => onToggleLike(photo.id)}
            />
          ))}
        </div>
      )}

      {/* Album sub-list (if multiple albums in this category) */}
      {albums.length > 1 && (
        <div className="pt-4 border-t border-heritage-cream-100 dark:border-heritage-dark-border">
          <p className="text-xs font-semibold text-heritage-green-600 dark:text-heritage-dark-muted uppercase tracking-wide mb-3">
            Albums in {meta.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {albums.map(album => {
              const count = data_photos_for_album(album.id, photos);
              return (
                <div
                  key={album.id}
                  className="flex items-center gap-2 bg-heritage-cream-100 dark:bg-heritage-dark-hover rounded-xl px-3 py-1.5 text-xs border border-heritage-cream-200 dark:border-heritage-dark-border"
                >
                  <span className="font-medium text-heritage-green-800 dark:text-heritage-dark-text">{album.title}</span>
                  <span className="text-heritage-green-500 dark:text-heritage-dark-muted">({count})</span>
                  {canAdd && (
                    <button
                      onClick={() => onAddPhotos(album.id)}
                      className="text-heritage-green-500 hover:text-heritage-green-800 dark:hover:text-heritage-dark-text"
                      aria-label="Add photos to album"
                    >
                      <Plus size={11} />
                    </button>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => onDeleteAlbum(album.id, album.title)}
                      className="text-heritage-green-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Delete album"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// helper (avoids importing data at component level)
function data_photos_for_album(albumId: string, photos: Photo[]) {
  return photos.filter(p => p.albumId === albumId).length;
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

function PhotoCard({ photo, likes, canRemove, onView, onLike }: PhotoCardProps) {
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
        <div className="flex items-center justify-end pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border text-xs">
          <span className="text-heritage-bark-600 dark:text-heritage-bark-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            View <ArrowRight size={11} />
          </span>
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
  const { data } = useApp();
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
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-heritage-bark-600 text-white mb-2 shadow-soft`}>
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

// re-export useApp for sub-components that need data
function data_photos_for_album_unused() { return useApp; }
