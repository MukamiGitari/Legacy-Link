import React, { useState } from 'react';
import { X, Plus, Clock, Star, Tag, ChefHat, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddRecipeModal } from '../components/cookbook/AddRecipeModal';
import type { Recipe, RecipeCategory } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

const SECTIONS: { key: RecipeCategory; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'main', label: 'Main meals' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'desserts', label: 'Desserts' },
];

interface Props {
  onSelectMember: (id: string) => void;
}

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

export const Cookbook: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, removeRecipe } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  // Single Universal Family Cookbook
  const familyCookbook = data.cookbookAlbums[0] || {
    id: 'c0000000-0000-0000-0000-000000000001',
    familyId: data.family?.id || 'a0000000-0000-0000-0000-000000000001',
    title: 'Family Cookbook',
    style: 'traditional',
    description: 'Heirloom recipes, traditional favorites, and the family stories behind them.',
  };

  const [openCategory, setOpenCategory] = useState<RecipeCategory | null>(null);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const openRecipe = openRecipeId ? data.recipes.find(r => r.id === openRecipeId) : undefined;

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm("Delete this recipe? This can't be undone.")) {
      removeRecipe(recipeId);
      setOpenRecipeId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-heritage-green-100 dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-gold-400">
              <ChefHat size={24} />
            </span>
            <div>
              <h2 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text font-bold">
                {familyCookbook.title}
              </h2>
              <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
                {familyCookbook.description}
              </p>
            </div>
          </div>
        </div>

        {canAdd && (
          <button
            onClick={() => {
              setOpenCategory(null);
              setShowAddRecipe(true);
            }}
            className="flex items-center gap-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-soft transition-colors shrink-0"
          >
            <Plus size={16} /> Add Recipe
          </button>
        )}
      </div>

      {/* Recipe Categories / Sections: Breakfast, Main meals, Snacks, Desserts */}
      <div className="space-y-10 mt-4">
        {SECTIONS.map((section) => {
          const sectionRecipes = data.recipes.filter(r => r.category === section.key);
          const Icon = SECTION_ICON[section.key];
          return (
            <div key={section.key} className="space-y-4">
              <div className="flex items-center justify-between border-b border-heritage-cream-300 dark:border-heritage-dark-border pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="bg-heritage-green-100 dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-gold-400 p-2 rounded-xl flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text font-semibold">
                    {section.label}
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-heritage-cream-200 dark:bg-heritage-dark-hover text-heritage-green-700 dark:text-heritage-dark-muted font-sans">
                    {sectionRecipes.length}
                  </span>
                </div>
                {canAdd && (
                  <button
                    onClick={() => {
                      setOpenCategory(section.key);
                      setShowAddRecipe(true);
                    }}
                    className="text-xs font-medium text-heritage-green-800 hover:text-heritage-green-950 dark:text-heritage-dark-muted dark:hover:text-heritage-dark-text flex items-center gap-1.5 bg-heritage-cream-100 dark:bg-heritage-dark-hover px-3 py-1.5 rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border transition-colors"
                  >
                    <Plus size={14} /> Add {section.label}
                  </button>
                )}
              </div>

              {sectionRecipes.length === 0 ? (
                canAdd ? (
                  <button
                    onClick={() => {
                      setOpenCategory(section.key);
                      setShowAddRecipe(true);
                    }}
                    className="w-full py-8 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-green-500 dark:text-heritage-dark-muted hover:border-heritage-gold-400 hover:text-heritage-green-800 transition-colors text-xs"
                  >
                    <Plus size={20} className="text-heritage-gold-600" />
                    <span>Add the first recipe to {section.label.toLowerCase()}</span>
                  </button>
                ) : (
                  <p className="text-xs text-heritage-green-400 dark:text-heritage-dark-muted italic py-3">No {section.label.toLowerCase()} recipes yet.</p>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sectionRecipes.map((recipe) => {
                    const contributor = recipe.contributedByMemberId ? data.members.find(m => m.id === recipe.contributedByMemberId) : undefined;
                    return (
                      <div
                        key={recipe.id}
                        className="group relative rounded-2xl overflow-hidden border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:shadow-soft-lg transition-all flex flex-col justify-between"
                      >
                        {recipe.isVegetarian && (
                          <span
                            className="absolute top-2 left-2 z-10 bg-heritage-gold-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                            title="Vegetarian"
                          >
                            <Star size={10} fill="currentColor" /> Veg
                          </span>
                        )}
                        {canRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecipe(recipe.id);
                            }}
                            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                            aria-label="Delete recipe"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setOpenRecipeId(recipe.id)}
                          className="block w-full text-left flex-1"
                        >
                          <div className="h-44 overflow-hidden bg-heritage-cream-200 flex items-center justify-center">
                            {recipe.photoUrl ? (
                              <img
                                src={recipe.photoUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt={recipe.title}
                              />
                            ) : (
                              <span className="text-4xl">🍲</span>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="text-base font-serif font-semibold text-heritage-green-900 dark:text-heritage-dark-text group-hover:text-heritage-gold-600 transition-colors line-clamp-1">
                              {recipe.title}
                            </h4>
                            {recipe.cookTime && (
                              <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted flex items-center gap-1.5">
                                <Clock size={12} className="text-heritage-gold-600 shrink-0" /> {recipe.cookTime}
                              </p>
                            )}
                            {recipe.familyStory && (
                              <p className="text-xs text-heritage-green-600/80 dark:text-heritage-dark-muted line-clamp-2 italic">
                                "{recipe.familyStory}"
                              </p>
                            )}
                            {contributor && (
                              <p className="text-xs text-heritage-gold-700 dark:text-heritage-gold-400 flex items-center gap-1 font-medium pt-1 border-t border-heritage-cream-200 dark:border-heritage-dark-border truncate">
                                <Tag size={11} className="shrink-0" /> {fullName(contributor)}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showAddRecipe && (
        <AddRecipeModal
          albumId={familyCookbook.id}
          onClose={() => setShowAddRecipe(false)}
          initialCategory={openCategory ?? undefined}
        />
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
  breakfast: 'Breakfast',
  main: 'Main meals',
  snacks: 'Snacks',
  desserts: 'Desserts',
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-heritage-cream-50 dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg border border-heritage-cream-300 dark:border-heritage-dark-border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border bg-heritage-cream-50/95 dark:bg-heritage-dark-card/95 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-heritage-gold-100 dark:bg-heritage-gold-950 text-heritage-gold-700 dark:text-heritage-gold-300">
              {CATEGORY_LABEL[recipe.category]}
            </span>
            {recipe.isVegetarian && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-heritage-gold-600 dark:text-heritage-gold-400">
                <Star size={11} fill="currentColor" /> Vegetarian
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onDelete && (
              <button onClick={onDelete} className="text-heritage-green-500 hover:text-red-600 p-1 transition-colors" aria-label="Delete recipe">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 p-1" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="md:grid md:grid-cols-2">
          {/* Photo */}
          <div className="relative md:min-h-104 md:border-r md:border-heritage-cream-300 dark:md:border-heritage-dark-border bg-heritage-cream-200">
            {recipe.photoUrl ? (
              <img src={recipe.photoUrl} className="w-full h-64 md:h-full object-cover" alt={recipe.title} />
            ) : (
              <div className="w-full h-64 md:h-full flex items-center justify-center text-6xl">🍲</div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text font-bold leading-tight">
                {recipe.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {recipe.cookTime && (
                  <span className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted flex items-center gap-1.5 font-medium">
                    <Clock size={13} className="text-heritage-gold-600" /> {recipe.cookTime}
                  </span>
                )}
                {contributor && (
                  <button onClick={() => onSelectMember(contributor.id)} className="text-xs text-heritage-gold-700 dark:text-heritage-gold-400 flex items-center gap-1 hover:underline font-medium">
                    <Tag size={12} /> Contributed by {fullName(contributor)}
                  </button>
                )}
              </div>
            </div>

            {recipe.familyStory && (
              <div className="bg-heritage-cream-100 dark:bg-heritage-dark-hover rounded-xl p-4 border border-heritage-cream-300 dark:border-heritage-dark-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-heritage-green-700 dark:text-heritage-dark-muted mb-1">Family Story</p>
                <p className="text-sm text-heritage-green-900 dark:text-heritage-dark-text italic leading-relaxed">{recipe.familyStory}</p>
              </div>
            )}

            <div>
              <p className="font-serif text-xs font-semibold uppercase tracking-wider text-heritage-green-700 dark:text-heritage-dark-muted mb-2">Ingredients</p>
              <ul className="space-y-1.5 bg-white dark:bg-heritage-dark-hover/50 p-4 rounded-xl border border-heritage-cream-200 dark:border-heritage-dark-border">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-heritage-green-900 dark:text-heritage-dark-text flex items-start gap-2">
                    <span className="text-heritage-gold-600 mt-0.5">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-serif text-xs font-semibold uppercase tracking-wider text-heritage-green-700 dark:text-heritage-dark-muted mb-2">Instructions</p>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="text-sm text-heritage-green-900 dark:text-heritage-dark-text flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-heritage-green-800 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
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
