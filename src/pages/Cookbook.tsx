import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Plus, UtensilsCrossed, Pencil, Check, Trash2, Tag, ChefHat, Star } from 'lucide-react';
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

/** Splits an array into consecutive chunks of `size` (last chunk may be shorter). */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Small cartoon food icons for each recipe section header, drawn in the same
// warm heritage gold/green/cream palette as the album cover illustrations
// (public/covers/*.svg) so they feel like part of the same visual family.

const BreakfastIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
    <rect x="1" y="4.5" width="9" height="10.5" rx="1.3" fill="#dfc270" stroke="#c5a059" strokeWidth="1" transform="rotate(-14 5.5 9.75)" />
    <ellipse cx="14.5" cy="14" rx="9" ry="6.3" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1.3" />
    <circle cx="15" cy="12.8" r="3.6" fill="#dfc270" stroke="#c5a059" strokeWidth="1" />
  </svg>
);

const MainMealsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
    <path d="M9 6.2c0-1.3.9-1.3.9-2.6M13 6.2c0-1.3.9-1.3.9-2.6" stroke="#386b57" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
    <rect x="0.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
    <rect x="20.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
    <rect x="3" y="9.6" width="18" height="2.1" rx="1" fill="#dfc270" stroke="#c5a059" strokeWidth="0.8" />
    <path d="M4 11.7h16v4.6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4.6z" fill="#386b57" stroke="#2c5445" strokeWidth="1" />
  </svg>
);

const SnacksIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
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

const DessertsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
    <path d="M6 12h12l-1.5 8a2 2 0 0 1-2 1.7H9.5a2 2 0 0 1-2-1.7L6 12z" fill="#c5a059" stroke="#a68241" strokeWidth="1" />
    <path d="M5 12c0-3.5 3-5.5 7-5.5s7 2 7 5.5H5z" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1" />
    <circle cx="12" cy="5" r="1.6" fill="#846332" />
  </svg>
);

const SECTION_ICON: Record<RecipeCategory, React.FC> = {
  breakfast: BreakfastIcon,
  main: MainMealsIcon,
  snacks: SnacksIcon,
  desserts: DessertsIcon,
};

export const Cookbook: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, updateCookbookAlbum, removeCookbookAlbum, removeRecipe } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingFeatured, setEditingFeatured] = useState(false);

  const openAlbum = data.cookbookAlbums.find(a => a.id === openAlbumId);
  const albumRecipes = openAlbum ? data.recipes.filter(r => r.albumId === openAlbum.id) : [];
  const openRecipe = openRecipeId ? data.recipes.find(r => r.id === openRecipeId) : undefined;
  const featuredMember = openAlbum?.featuredMemberId ? data.members.find(m => m.id === openAlbum.featuredMemberId) : undefined;

  useEffect(() => { setEditingTitle(false); setEditingFeatured(false); }, [openAlbumId]);

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
            <button onClick={() => setOpenAlbumId(null)} className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900 flex items-center gap-1">
              <ChevronLeft size={16} /> All cookbooks
            </button>
            <div className="flex items-center gap-2">
              {canAdd && (
                <button
                  onClick={() => setShowAddRecipe(true)}
                  className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
                >
                  <UtensilsCrossed size={16} /> Add Recipe
                </button>
              )}
              {canRemove && (
                <button
                  onClick={() => handleDeleteAlbum(openAlbum.id, openAlbum.title)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-900"
                >
                  <Trash2 size={15} /> Delete Cookbook
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

          {albumRecipes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border py-10 text-center">
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted">No recipes yet — be the first to add one.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {SECTIONS.map(section => {
                const sectionRecipes = albumRecipes.filter(r => r.category === section.key);
                if (sectionRecipes.length === 0) return null;
                return (
                  <div key={section.key}>
                    <h4 className="font-serif text-base text-heritage-green-800 dark:text-heritage-dark-text mb-3 pb-1.5 border-b border-heritage-cream-300 dark:border-heritage-dark-border flex items-center gap-2">
                      {(() => { const Icon = SECTION_ICON[section.key]; return <Icon />; })()}
                      {section.label}
                    </h4>
                    <div className="overflow-x-auto scrollbar-thin -mx-1 px-1 pb-2">
                      <div className="flex gap-4 w-max">
                        {chunk(sectionRecipes, 2).map((columnRecipes, ci) => (
                          <div key={ci} className="flex flex-col gap-4 shrink-0 w-40 sm:w-48">
                            {columnRecipes.map((recipe, ri) => {
                              const contributor = recipe.contributedByMemberId ? data.members.find(m => m.id === recipe.contributedByMemberId) : undefined;
                              const cardHeightCls = ['h-48', 'h-36'][ri % 2];
                              return (
                                <div key={recipe.id} className="group relative rounded-xl overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-shadow">
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
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        <AddRecipeModal albumId={openAlbum.id} onClose={() => setShowAddRecipe(false)} />
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
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
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

        {recipe.photoUrl && (
          <img src={recipe.photoUrl} className="w-full h-56 object-cover" alt={recipe.title} />
        )}

        <div className="p-6 space-y-5">
          <div>
            <h2 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">{recipe.title}</h2>
            {contributor && (
              <button onClick={() => onSelectMember(contributor.id)} className="text-xs text-heritage-gold-600 dark:text-heritage-gold-400 flex items-center gap-1 mt-1 hover:underline">
                <Tag size={11} /> Contributed by {fullName(contributor)}
              </button>
            )}
          </div>

          {recipe.familyStory && (
            <div className="bg-heritage-cream-100 dark:bg-heritage-dark-hover rounded-xl p-4 border border-heritage-cream-300 dark:border-heritage-dark-border">
              <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-1.5">Family Story</p>
              <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-text italic leading-relaxed">{recipe.familyStory}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-2">Ingredients</p>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-heritage-green-900 dark:text-heritage-dark-text flex gap-2">
                  <span className="text-heritage-gold-500 mt-0.5">•</span> {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-heritage-green-600 dark:text-heritage-dark-muted mb-2">Instructions</p>
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
  );
};
