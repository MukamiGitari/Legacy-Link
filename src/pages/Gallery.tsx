import React, { useState, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Plus, ImagePlus, Pencil, Check,
  Trash2, Tag, Images, Search, Smile, Cake, GraduationCap,
  Heart, Users2, BookOpen, TreeDeciduous
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddAlbumModal } from '../components/gallery/AddAlbumModal';
import { AddPhotosModal } from '../components/gallery/AddPhotosModal';
import type { Album } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

// ── Category metadata ─────────────────────────────────────────────────────────

type CategoryKey = Album['category'] | 'all';

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORY_META: CategoryMeta[] = [
  {
    key: 'all',
    label: 'All',
    icon: <Images size={16} />,
    description: 'A collection of all family photos, past and present.',
  },
  {
    key: 'childhood',
    label: 'Childhood',
    icon: <Smile size={16} />,
    description: 'Those early days, big dreams and innocent smiles.',
  },
  {
    key: 'birthdays',
    label: 'Birthdays',
    icon: <Cake size={16} />,
    description: 'Celebrating life, love and another year of blessings.',
  },
  {
    key: 'graduations',
    label: 'Graduations',
    icon: <GraduationCap size={16} />,
    description: 'Hard work, dedication and new beginnings.',
  },
  {
    key: 'weddings',
    label: 'Weddings',
    icon: <Heart size={16} />,
    description: 'Love, commitment and a lifetime together.',
  },
  {
    key: 'reunions',
    label: 'Reunions',
    icon: <Users2 size={16} />,
    description: 'Family gatherings that bring us closer.',
  },
  {
    key: 'historical',
    label: 'Historical',
    icon: <BookOpen size={16} />,
    description: 'Our roots, our journey, our legacy.',
  },
];

function getCategoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORY_META.find(c => c.key === key) ?? CATEGORY_META[0];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onSelectMember: (id: string) => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export const Gallery: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, updateAlbum, removeAlbum, removePhoto } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  const [category, setCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingFeatured, setEditingFeatured] = useState(false);

  const albums = (category === 'all' ? data.albums : data.albums.filter(a => a.category === category))
    .filter(a => !searchQuery.trim() || a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const openAlbum = data.albums.find(a => a.id === openAlbumId);
  const albumPhotos = openAlbum ? data.photos.filter(p => p.albumId === openAlbum.id) : [];
  const lightboxPhoto = lightboxIndex !== null ? albumPhotos[lightboxIndex] : null;
  const featuredMember = openAlbum?.featuredMemberId
    ? data.members.find(m => m.id === openAlbum.featuredMemberId)
    : undefined;

  const totalPhotos = data.photos.length;

  useEffect(() => { setEditingTitle(false); setEditingFeatured(false); }, [openAlbumId]);

  const handleDeleteAlbum = (albumId: string, title: string) => {
    if (window.confirm(`Delete the album "${title}" and all of its photos? This can't be undone.`)) {
      removeAlbum(albumId);
      if (openAlbumId === albumId) setOpenAlbumId(null);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm("Delete this photo? This can't be undone.")) {
      removePhoto(photoId);
      setLightboxIndex(null);
    }
  };

  return (
    <div className="space-y-0">
      {/* ── Hero Banner ── */}
      {!openAlbum && (
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
                <Images size={26} className="text-heritage-green-800" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-heritage-green-900 leading-tight">
                  Photo Gallery
                </h1>
                <p className="text-heritage-green-700 font-medium mt-0.5 italic">
                  Cherished moments. Timeless memories.
                </p>
                <p className="text-heritage-green-600 text-sm mt-1 max-w-md">
                  Explore our family's journey through photos — from childhood smiles to lifelong
                  milestones and the moments that keep us connected.
                </p>
                <div className="mt-2 w-12 h-0.5 bg-heritage-gold-500 rounded-full" />
              </div>
            </div>

            {/* Right — quote card */}
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
      )}

      {/* ── Album grid view ── */}
      {!openAlbum ? (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORY_META.map(c => {
                const isActive = category === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => { setCategory(c.key); setOpenAlbumId(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors
                      ${isActive
                        ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                        : 'bg-white dark:bg-heritage-dark-card border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500 shadow-soft'
                      }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-heritage-green-500'}>{c.icon}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative min-w-44">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-card dark:text-heritage-dark-text shadow-soft bg-white focus:outline-none focus:ring-2 focus:ring-heritage-green-500"
              />
            </div>

            {/* Add Photo button */}
            {canAdd && (
              <button
                onClick={() => setShowAddAlbum(true)}
                className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-soft transition-colors shrink-0"
              >
                <Plus size={16} /> Add Photo
              </button>
            )}
          </div>

          {/* Album grid — 4 columns + decorative quote card as last item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {albums.map((album) => {
              const count = data.photos.filter(p => p.albumId === album.id).length;
              const meta = getCategoryMeta(album.category as CategoryKey);
              return (
                <AlbumCard
                  key={album.id}
                  album={album}
                  photoCount={count}
                  meta={meta}
                  canRemove={canRemove}
                  onOpen={() => setOpenAlbumId(album.id)}
                  onDelete={() => handleDeleteAlbum(album.id, album.title)}
                />
              );
            })}

            {/* Decorative quote card — always last */}
            <div
              className="rounded-2xl border border-heritage-cream-300 dark:border-heritage-dark-border overflow-hidden flex flex-col items-center justify-center p-6 text-center"
              style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8d9bc 100%)' }}
            >
              <div className="text-heritage-green-800/20 mb-3">
                <TreeDeciduous size={40} />
              </div>
              <p className="font-serif text-base italic text-heritage-green-800 leading-snug">
                "The best moments in life are the ones we share with family."
              </p>
              <div className="mt-4 w-8 h-0.5 bg-heritage-gold-500 rounded-full" />
            </div>
          </div>

          {/* Bottom: total photos count */}
          <div className="flex items-center justify-end mt-6 pt-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
            <div className="flex items-center gap-2 text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
              <Images size={15} />
              <span>Total Photos: {totalPhotos}</span>
            </div>
          </div>
        </>
      ) : (
        /* ── Single album detail view ── */
        <div>
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setOpenAlbumId(null)}
              className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1"
            >
              <ChevronLeft size={16} /> All albums
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
                  onClick={() => {
                    if (titleDraft.trim()) {
                      updateAlbum(openAlbum.id, { title: titleDraft.trim() });
                      setEditingTitle(false);
                    }
                  }}
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
                onChange={e => {
                  updateAlbum(openAlbum.id, { featuredMemberId: e.target.value || undefined });
                  setEditingFeatured(false);
                }}
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
                className={`text-xs flex items-center gap-1 ${
                  featuredMember
                    ? 'text-heritage-gold-600 dark:text-heritage-gold-400'
                    : 'text-heritage-green-400 dark:text-heritage-dark-muted'
                } ${canAdd ? 'hover:underline' : ''}`}
                disabled={!canAdd}
              >
                <Tag size={11} />
                {featuredMember
                  ? `About ${fullName(featuredMember)}`
                  : canAdd ? 'Tag who this album is about' : ''}
              </button>
            )}
          </div>

          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mb-4 mt-1">
            {openAlbum.description}
          </p>

          {albumPhotos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">
                No photos yet — be the first to add one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albumPhotos.map((p, i) => (
                <div
                  key={p.id}
                  className="group relative rounded-lg overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border"
                >
                  {canRemove && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                      className="absolute top-1.5 right-1.5 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                      aria-label="Delete photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <button onClick={() => setLightboxIndex(i)} className="block w-full">
                    <img
                      src={p.url}
                      className="w-full h-32 object-cover hover:scale-105 transition-transform"
                      alt={p.caption ?? ''}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddAlbum && (
        <AddAlbumModal
          onClose={() => setShowAddAlbum(false)}
          onCreated={albumId => { setShowAddAlbum(false); setOpenAlbumId(albumId); }}
        />
      )}

      {showAddPhotos && openAlbum && (
        <AddPhotosModal albumId={openAlbum.id} onClose={() => setShowAddPhotos(false)} />
      )}

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white"
          >
            <X size={26} />
          </button>
          {canRemove && lightboxPhoto && (
            <button
              onClick={() => handleDeletePhoto(lightboxPhoto.id)}
              className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
          {lightboxIndex! > 0 && (
            <button
              onClick={() => setLightboxIndex(i => (i ?? 0) - 1)}
              className="absolute left-4 text-white/70 hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex! < albumPhotos.length - 1 && (
            <button
              onClick={() => setLightboxIndex(i => (i ?? 0) + 1)}
              className="absolute right-4 text-white/70 hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}
          <div className="max-w-3xl w-full">
            <img
              src={lightboxPhoto.url}
              className="w-full max-h-[70vh] object-contain rounded-lg"
              alt={lightboxPhoto.caption ?? ''}
            />
            <div className="mt-3 text-center">
              {lightboxPhoto.caption && (
                <p className="text-white text-sm">{lightboxPhoto.caption}</p>
              )}
              {lightboxPhoto.taggedMemberIds.length > 0 && (
                <div className="flex justify-center flex-wrap gap-2 mt-2">
                  {lightboxPhoto.taggedMemberIds.map(id => {
                    const member = data.members.find(m => m.id === id);
                    if (!member) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => onSelectMember(id)}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-full"
                      >
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

// ── AlbumCard subcomponent ────────────────────────────────────────────────────

interface AlbumCardProps {
  album: Album;
  photoCount: number;
  meta: CategoryMeta;
  canRemove: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function AlbumCard({ album, photoCount, meta, canRemove, onOpen, onDelete }: AlbumCardProps) {
  return (
    <div className="group relative rounded-2xl border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden hover:shadow-soft-lg transition-shadow">
      {/* Delete button */}
      {canRemove && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete album"
        >
          <Trash2 size={13} />
        </button>
      )}

      {/* Cover photo area */}
      <div className="relative h-44 overflow-hidden bg-heritage-cream-200 dark:bg-heritage-dark-hover">
        {album.coverPhotoUrl ? (
          <img
            src={album.coverPhotoUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-heritage-green-300 dark:text-heritage-dark-muted opacity-40">
              {meta.icon}
            </span>
          </div>
        )}

        {/* Photo count badge — top right of image */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Category icon + album title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-heritage-green-600 dark:text-heritage-dark-muted shrink-0">
            {meta.icon}
          </span>
          <p className="text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text truncate">
            {album.title}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted leading-relaxed line-clamp-2 mb-3">
          {album.description || meta.description}
        </p>

        {/* View Album link */}
        <button
          onClick={onOpen}
          className="flex items-center gap-1 text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text transition-colors group/link"
        >
          View Album
          <ChevronRight
            size={14}
            className="transition-transform group-hover/link:translate-x-0.5"
          />
        </button>
      </div>
    </div>
  );
}
