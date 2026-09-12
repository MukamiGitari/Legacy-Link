import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, UtensilsCrossed, Pencil, Check, Trash2, Tag, ChefHat, Star, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddCookbookAlbumModal } from '../components/cookbook/AddCookbookAlbumModal';
import { AddRecipeModal } from '../components/cookbook/AddRecipeModal';
import type { Recipe, RecipeCategory } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

// Masonry slide order, as specified: Breakfast, Main meals, Snacks, Desserts.
// Vegetarian isn't a section — it's a star badge any recipe can carry.
const SECTIONS: { key: RecipeCategory; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'main', label: 'Main meals' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'desserts', label: 'Desserts' },
];

interface Props {
  onSelectMember: (id: string) => void;
}

// Small cartoon food icons for each recipe section header, drawn in the same
// warm heritage gold/green/cream palette as the album cover illustrations
// (public/covers/*.svg) so they feel like part of the same visual family.

const BreakfastIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <rect x="1" y="4.5" width="9" height="10.5" rx="1.3" fill="#dfc270" stroke="#c5a059" strokeWidth="1" transform="rotate(-14 5.5 9.75)" />
    <ellipse cx="14.5" cy="14" rx="9" ry="6.3" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1.3" />
    <circle cx="15" cy="12.8" r="3.6" fill="#dfc270" stroke="#c5a059" strokeWidth="1" />
  </svg>
);

const MainMealsIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M9 6.2c0-1.3.9-1.3.9-2.6M13 6.2c0-1.3.9-1.3.9-2.6" stroke="#386b57" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
    <rect x="0.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
    <rect x="20.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
    <rect x="3" y="9.6" width="18" height="2.1" rx="1" fill="#dfc270" stroke="#c5a059" strokeWidth="0.8" />
    <path d="M4 11.7h16v4.6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4.6z" fill="#386b57" stroke="#2c5445" strokeWidth="1" />
  </svg>
);

const SnacksIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M8 4c-2-1.5-4-1-5 1M16 4c2-1.5 4-1 5 1" stroke="#386b57" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <ellipse cx="12" cy="13" rx="6" ry="10" fill="#dfc270" stroke="#c5a059" strokeWidth="1" />
    <g fill="#c5a059">
      <circle cx="9" cy="7.2" r="0.8" /><circle cx="12" cy="6.6" r="0.8" /><circle cx="15" cy="7.2" r="0.8" />
      <circle cx="8.3" cy="10.6" r="0.8" /><circle cx="12" cy="10.1" r="0.8" /><circle cx="15.7" cy="10.6" r="0.8" />
      <circle cx="8.3" cy="14" r="0.8" /><circle cx="12" cy="14" r="0.8" /><circle cx="15.7" cy="14" r="0.8" />
      <circle cx="9" cy="17.4" r="0.8" /><circle cx="12" cy="17.9" r="0.8" /><circle cx="15" cy="17.4" r="0.8" />
    </g>
  </svg>
);

const DessertsIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M6 12h12l-1.5 8a2 2 0 0 1-2 1.7H9.5a2 2 0 0 1-2-1.7L6 12z" fill="#c5a059" stroke="#a68241" strokeWidth="1" />
    <path d="M5 12c0-3.5 3-5.5 7-5.5s7 2 7 5.5H5z" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1" />
    <circle cx="12" cy="5" r="1.6" fill="#846332" />
  </svg>
);

const SECTION_ICON: Record<RecipeCategory, React.FC<{ size?: number }>> = {
  breakfast: BreakfastIcon,
  main: MainMealsIcon,
  snacks: SnacksIcon,
  desserts: DessertsIcon,
};

// Themed illustrations for the category chooser (used until a family photo
// has been added to that section, at which point the real photo takes over).
const SECTION_ILLUSTRATION: Record<RecipeCategory, string> = {
  breakfast: '/recipes/category-breakfast.jpg',
  main: '/recipes/category-main.jpg',
  snacks: '/recipes/category-snacks.jpg',
  desserts: '/recipes/category-desserts.jpg',
};

export const Cookbook: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, updateCookbookAlbum, removeCookbookAlbum, removeRecipe } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<RecipeCategory | null>(null);
  const [pageDirection, setPageDirection] = useState<'forward' | 'backward'>('forward');
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingFeatured, setEditingFeatured] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const openAlbum = data.cookbookAlbums.find(a => a.id === openAlbumId);
  const albumRecipes = openAlbum ? data.recipes.filter(r => r.albumId === openAlbum.id) : [];
  const categoryRecipes = openCategory ? albumRecipes.filter(r => r.category === openCategory) : [];
  const openRecipe = openRecipeId ? data.recipes.find(r => r.id === openRecipeId) : undefined;
  const featuredMember = openAlbum?.featuredMemberId ? data.members.find(m => m.id === openAlbum.featuredMemberId) : undefined;

  useEffect(() => { setEditingTitle(false); setEditingFeatured(false); setOpenCategory(null); setSlideIndex(0); }, [openAlbumId]);

  const handleSlideTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleSlideTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setSlideIndex(i => Math.min(i + 1, SECTIONS.length - 1));
      else setSlideIndex(i => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  const openChapter = (category: RecipeCategory) => { setPageDirection('forward'); setOpenCategory(category); };
  const closeChapter = () => { setPageDirection('backward'); setOpenCategory(null); };

  const handleDeleteAlbum = (albumId: string, title: string) => {
    if (window.confirm(`Delete the cookbook "${title}" and all of its recipes? This can't be undone.`)) {
      removeCookbookAlbum(albumId);
      if (openAlbumId === albumId) setOpenAlbumId(null);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm("Delete this recipe? This can't be undone.")) {
      removeRecipe(recipeId);
      setOpenRecipeId(null);
    }
  };

  return (
    <div className="space-y-5">
      {!openAlbum ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text">Family Cookbook</h2>
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">Heirloom recipes, food photos, and the stories behind them.</p>
            </div>
            {canAdd && (
              <button
                onClick={() => setShowAddAlbum(true)}
                className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shrink-0"
              >
                <Plus size={16} /> New Cookbook
              </button>
            )}
          </div>

          {data.cookbookAlbums.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <ChefHat size={24} className="mx-auto text-heritage-green-400 mb-2" />
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No cookbooks yet — start one to preserve the family's recipes.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {data.cookbookAlbums.map((album, i) => {
                const count = data.recipes.filter(r => r.albumId === album.id).length;
                const featured = album.featuredMemberId ? data.members.find(m => m.id === album.featuredMemberId) : undefined;
                const coverHeightCls = ['h-40', 'h-52', 'h-44', 'h-60'][i % 4];
                return (
                  <div key={album.id} className="break-inside-avoid mb-4 group relative rounded-xl overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-shadow">
                    {canRemove && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id, album.title); }}
                        className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                        aria-label="Delete cookbook"
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
                            <Tag size={11} className="shrink-0" /> Dedicated to {fullName(featured)}
                          </p>
                        )}
                        <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">{count} recipe{count !== 1 && 's'}</p>
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
            <button
              onClick={() => (openCategory ? closeChapter() : setOpenAlbumId(null))}
              className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1"
            >
              <ChevronLeft size={16} /> {openCategory ? openAlbum.title : 'All cookbooks'}
            </button>
            <div className="flex items-center gap-2">
              {openCategory && canAdd && (
                <button
                  onClick={() => setShowAddRecipe(true)}
                  className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
                >
                  <UtensilsCrossed size={16} /> Add Recipe
                </button>
              )}
              {!openCategory && canRemove && (
                <button
                  onClick={() => handleDeleteAlbum(openAlbum.id, openAlbum.title)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-900"
                >
                  <Trash2 size={15} /> Delete Cookbook
                </button>
              )}
            </div>
          </div>

          <div className="cookbook-page-perspective">
          <div key={openCategory ?? 'slider'} className={pageDirection === 'forward' ? 'cookbook-page-turn-forward' : 'cookbook-page-turn-backward'}>

          {openCategory && (
            <p className="text-xs text-heritage-green-400 dark:text-heritage-dark-muted -mt-0.5 mb-1">
              {openAlbum.title} <span className="mx-1">/</span> {CATEGORY_LABEL[openCategory]}
            </p>
          )}

          {!openCategory && (
          <>
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
                      updateCookbookAlbum(openAlbum.id, { title: titleDraft.trim() });
                      setEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setEditingTitle(false);
                    }
                  }}
                />
                <button
                  onClick={() => { if (titleDraft.trim()) { updateCookbookAlbum(openAlbum.id, { title: titleDraft.trim() }); setEditingTitle(false); } }}
                  className="text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900"
                  aria-label="Save cookbook name"
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
                    aria-label="Rename cookbook"
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
                onChange={e => { updateCookbookAlbum(openAlbum.id, { featuredMemberId: e.target.value || undefined }); setEditingFeatured(false); }}
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
                {featuredMember ? `Dedicated to ${fullName(featuredMember)}` : (canAdd ? 'Tag who this cookbook is dedicated to' : '')}
              </button>
            )}
          </div>
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted mb-5 mt-1">{openAlbum.description}</p>
          </>
          )}

          {!openCategory ? (
            // Full-page category slider: swipe or use the arrows to page through
            // Breakfast / Main meals / Snacks / Desserts, then jump into a chapter.
            <div>
              <div
                className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-heritage-cream-400 dark:border-heritage-dark-border select-none touch-pan-y"
                onTouchStart={handleSlideTouchStart}
                onTouchEnd={handleSlideTouchEnd}
              >
                {SECTIONS.map((section, i) => {
                  const sectionRecipes = albumRecipes.filter(r => r.category === section.key);
                  const coverPhoto = sectionRecipes.find(r => r.photoUrl)?.photoUrl;
                  const Icon = SECTION_ICON[section.key];
                  const isActive = i === slideIndex;
                  return (
                    <div
                      key={section.key}
                      className={`absolute inset-0 transition-transform duration-500 ease-out ${isActive ? '' : 'pointer-events-none'}`}
                      style={{ transform: `translateX(${(i - slideIndex) * 100}%)` }}
                      aria-hidden={!isActive}
                    >
                      <img
                        src={coverPhoto || SECTION_ILLUSTRATION[section.key]}
                        className="w-full h-full object-cover"
                        alt={section.label}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          {coverPhoto && (
                            <p className="font-serif text-xl sm:text-2xl text-white drop-shadow-sm truncate flex items-center gap-2">
                              <span className="bg-white/90 rounded-full p-1.5 shrink-0"><Icon size={14} /></span>
                              {section.label}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-white/90 mt-1">{sectionRecipes.length} recipe{sectionRecipes.length !== 1 && 's'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openChapter(section.key)}
                            className="text-xs sm:text-sm font-medium px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-heritage-green-800 whitespace-nowrap"
                          >
                            View recipes
                          </button>
                          {canAdd && (
                            <button
                              onClick={() => { openChapter(section.key); setShowAddRecipe(true); }}
                              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white whitespace-nowrap"
                            >
                              <Plus size={14} /> Add Recipe
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
                {slideIndex < SECTIONS.length - 1 && (
                  <button
                    onClick={() => setSlideIndex(i => Math.min(i + 1, SECTIONS.length - 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/85 hover:bg-white text-heritage-green-800 rounded-full p-2 shadow-sm"
                    aria-label="Next category"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-3">
                {SECTIONS.map((section, i) => (
                  <button
                    key={section.key}
                    onClick={() => setSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slideIndex ? 'w-5 bg-heritage-green-800 dark:bg-heritage-gold-400' : 'w-1.5 bg-heritage-cream-400 dark:bg-heritage-dark-border'}`}
                    aria-label={`Go to ${section.label}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Inside a chapter: its recipes as masonry cards, plus a tile to add one.
            categoryRecipes.length === 0 && !canAdd ? (
              <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
                <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No recipes here yet.</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
                {canAdd && (
                  <button
                    onClick={() => setShowAddRecipe(true)}
                    className="break-inside-avoid mb-4 w-full h-40 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-500 dark:text-heritage-dark-muted hover:border-heritage-green-500 hover:text-heritage-green-700 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-xs font-medium">Add Recipe</span>
                  </button>
                )}
                {categoryRecipes.map((recipe, i) => {
                  const contributor = recipe.contributedByMemberId ? data.members.find(m => m.id === recipe.contributedByMemberId) : undefined;
                  const cardHeightCls = ['h-40', 'h-52', 'h-44', 'h-60'][i % 4];
                  return (
                    <div key={recipe.id} className="break-inside-avoid mb-4 group relative rounded-xl overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-shadow">
                      {recipe.isVegetarian && (
                        <span
                          className="absolute top-1.5 left-1.5 z-10 bg-heritage-gold-500 text-white rounded-full p-1 shadow-sm"
                          title="Vegetarian"
                          aria-label="Vegetarian"
                        >
                          <Star size={12} fill="currentColor" />
                        </span>
                      )}
                      {canRemove && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                          className="absolute top-1.5 right-1.5 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          aria-label="Delete recipe"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <button onClick={() => setOpenRecipeId(recipe.id)} className="block w-full text-left">
                        {recipe.photoUrl ? (
                          <div className={`${cardHeightCls} overflow-hidden bg-heritage-cream-200`}>
                            <img src={recipe.photoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                          </div>
                        ) : (
                          <div className={`${cardHeightCls} flex items-center justify-center bg-heritage-cream-200 text-3xl`}>🍽️</div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">{recipe.title}</p>
                          {recipe.cookTime && (
                            <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="shrink-0" /> {recipe.cookTime}
                            </p>
                          )}
                          {recipe.familyStory && (
                            <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mt-0.5 line-clamp-2">{recipe.familyStory}</p>
                          )}
                          {contributor && (
                            <p className="text-xs text-heritage-gold-600 dark:text-heritage-gold-400 flex items-center gap-1 mt-1 truncate">
                              <Tag size={10} className="shrink-0" /> {fullName(contributor)}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}

          </div>
          </div>
        </div>
      )}

      {showAddAlbum && (
        <AddCookbookAlbumModal
          onClose={() => setShowAddAlbum(false)}
          onCreated={(albumId) => {
            setShowAddAlbum(false);
            setOpenAlbumId(albumId);
          }}
        />
      )}

      {showAddRecipe && openAlbum && (
        <AddRecipeModal albumId={openAlbum.id} onClose={() => setShowAddRecipe(false)} initialCategory={openCategory ?? undefined} />
      )}

      {openRecipe && (
        <RecipeDetail
          recipe={openRecipe}
          onClose={() => setOpenRecipeId(null)}
          onSelectMember={onSelectMember}
          onDelete={canRemove ? () => handleDeleteRecipe(openRecipe.id) : undefined}
        />
      )}
    </div>
  );
};

const CATEGORY_LABEL: Record<RecipeCategory, string> = {
  breakfast: 'Breakfast', main: 'Main meals', snacks: 'Snacks', desserts: 'Desserts',
};

const RecipeDetail: React.FC<{
  recipe: Recipe;
  onClose: () => void;
  onSelectMember: (id: string) => void;
  onDelete?: () => void;
}> = ({ recipe, onClose, onSelectMember, onDelete }) => {
  const { data } = useApp();
  const contributor = recipe.contributedByMemberId ? data.members.find(m => m.id === recipe.contributedByMemberId) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      {/* The "open book" spread: a photo page on one side, the recipe copy on the
          other, split by a spine shadow — so it reads like a page from a
          traditional printed cookbook rather than a modern recipe-card app. */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-heritage-cream-50 dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border bg-heritage-cream-50/95 dark:bg-heritage-dark-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide font-medium text-heritage-gold-600 dark:text-heritage-gold-400">{CATEGORY_LABEL[recipe.category]}</span>
            {recipe.isVegetarian && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-heritage-gold-600 dark:text-heritage-gold-400" title="Vegetarian">
                <Star size={11} fill="currentColor" /> Vegetarian
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onDelete && (
              <button onClick={onDelete} className="text-heritage-green-500 hover:text-red-600" aria-label="Delete recipe">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="md:grid md:grid-cols-2">
          {/* Left page: the photo, full-bleed within its column. */}
          <div className="relative md:min-h-[26rem] md:border-r md:border-heritage-cream-300 dark:md:border-heritage-dark-border md:shadow-[3px_0_10px_-4px_rgba(0,0,0,0.18)]">
            {recipe.photoUrl ? (
              <img src={recipe.photoUrl} className="w-full h-56 md:h-full object-cover" alt={recipe.title} />
            ) : (
              <div className="w-full h-56 md:h-full flex items-center justify-center bg-heritage-cream-200 text-5xl">🍽️</div>
            )}
          </div>

          {/* Right page: title, cook time, story, ingredients, and method. */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">{recipe.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {recipe.cookTime && (
                  <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted flex items-center gap-1">
                    <Clock size={12} /> {recipe.cookTime}
                  </span>
                )}
                {contributor && (
                  <button onClick={() => onSelectMember(contributor.id)} className="text-xs text-heritage-gold-600 dark:text-heritage-gold-400 flex items-center gap-1 hover:underline">
                    <Tag size={11} /> Contributed by {fullName(contributor)}
                  </button>
                )}
              </div>
            </div>

            {recipe.familyStory && (
              <div className="bg-heritage-cream-100 dark:bg-heritage-dark-hover rounded-xl p-4 border border-heritage-cream-300 dark:border-heritage-dark-border">
                <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-1.5">Family Story</p>
                <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-text italic leading-relaxed">{recipe.familyStory}</p>
              </div>
            )}

            <div>
              <p className="font-serif text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-2">Ingredients</p>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-heritage-green-900 dark:text-heritage-dark-text flex gap-2">
                    <span className="text-heritage-gold-500 mt-0.5">•</span> {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-serif text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-2">Instructions</p>
              <ol className="space-y-2.5">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="text-sm text-heritage-green-900 dark:text-heritage-dark-text flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-heritage-green-800 text-white text-[11px] flex items-center justify-center font-medium">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
