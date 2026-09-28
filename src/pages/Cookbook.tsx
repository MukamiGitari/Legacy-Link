import React, { useState, useMemo } from 'react';
import {
  X, Plus, Clock, Star, Tag, ChefHat, Trash2, Search,
  ShoppingBasket, ListChecks, Flame, ArrowRight, BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddRecipeModal } from '../components/cookbook/AddRecipeModal';
import type { Recipe, RecipeCategory } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTIONS: { key: RecipeCategory; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: <BreakfastIcon size={20} />,
    color: 'text-amber-700',
  },
  {
    key: 'main',
    label: 'Main meals',
    icon: <MainMealsIcon size={20} />,
    color: 'text-heritage-green-700',
  },
  {
    key: 'snacks',
    label: 'Snacks',
    icon: <SnacksIcon size={20} />,
    color: 'text-heritage-bark-600',
  },
  {
    key: 'desserts',
    label: 'Desserts',
    icon: <DessertsIcon size={20} />,
    color: 'text-purple-700',
  },
];

// ── Category filter type ──────────────────────────────────────────────────────

type CategoryFilter = 'all' | RecipeCategory;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onSelectMember: (id: string) => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export const Cookbook: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, removeRecipe } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  const familyCookbook = data.cookbookAlbums[0] || {
    id: 'c0000000-0000-0000-0000-000000000001',
    familyId: data.family?.id || 'a0000000-0000-0000-0000-000000000001',
    title: "M'Ikunyua Traditional Kitchen & Heritage Recipes",
    style: 'traditional',
    description: 'Preserving time-tested Kĩmĩrũ culinary wisdom from generation to generation.',
  };

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addCategory, setAddCategory] = useState<RecipeCategory | null>(null);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const openRecipe = openRecipeId ? data.recipes.find(r => r.id === openRecipeId) : undefined;

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm("Delete this recipe? This can't be undone.")) {
      removeRecipe(recipeId);
      setOpenRecipeId(null);
    }
  };

  // Which sections to render (filtered by active category pill)
  const visibleSections = useMemo(
    () => (activeCategory === 'all' ? SECTIONS : SECTIONS.filter(s => s.key === activeCategory)),
    [activeCategory],
  );

  // Per-section recipe filter (search)
  const filteredFor = (key: RecipeCategory) =>
    data.recipes.filter(r => {
      if (r.category !== key) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const contributor = r.contributedByMemberId
        ? data.members.find(m => m.id === r.contributedByMemberId)
        : undefined;
      return (
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.toLowerCase().includes(q)) ||
        (contributor && fullName(contributor).toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-0">
      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ background: 'linear-gradient(135deg, #fdf8f0 0%, #f0e6d0 60%, #d4c4a0 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <ChefHat size={260} className="text-heritage-green-800" />
        </div>
        <div className="relative z-10 flex items-center justify-between px-8 py-8 gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-heritage-green-800/10 flex items-center justify-center">
              <ChefHat size={26} className="text-heritage-green-800" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-heritage-green-900 leading-tight">
                {familyCookbook.title}
              </h1>
              <p className="text-heritage-green-600 text-sm mt-1">
                {familyCookbook.description}
              </p>
              <div className="mt-2 w-12 h-0.5 bg-heritage-gold-500 rounded-full" />
            </div>
          </div>
          <div className="shrink-0 max-w-xs text-right hidden md:block">
            <p className="font-serif text-lg italic text-heritage-green-800 leading-snug">
              "Food is the thread that weaves our family stories together."
            </p>
            <div className="mt-2 flex justify-end">
              <div className="w-5 h-5 rounded-full border-2 border-heritage-green-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-heritage-green-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-heritage-dark-card p-4 rounded-2xl shadow-soft border border-heritage-cream-300 dark:border-heritage-dark-border mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipes by name, ingredient, or author..."
            className="w-full pl-9 pr-4 py-2 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text transition-all"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-heritage-green-800 text-white shadow-soft'
                : 'bg-heritage-cream-100 dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card'
            }`}
          >
            All Categories
          </button>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveCategory(s.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeCategory === s.key
                  ? 'bg-heritage-green-800 text-white shadow-soft'
                  : 'bg-heritage-cream-100 dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card'
              }`}
            >
              {s.label}
            </button>
          ))}

          {/* Add Recipe button */}
          {canAdd && (
            <button
              onClick={() => { setAddCategory(null); setShowAddRecipe(true); }}
              className="ml-auto flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-soft transition-colors shrink-0"
            >
              <Plus size={14} /> Add Recipe
            </button>
          )}
        </div>
      </div>

      {/* ── Category Sections ── */}
      <div className="space-y-10">
        {visibleSections.map(section => {
          const sectionRecipes = filteredFor(section.key);
          return (
            <div
              key={section.key}
              className="bg-white dark:bg-heritage-dark-card rounded-2xl p-6 shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border space-y-6"
            >
              {/* Section header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-heritage-cream-100 dark:border-heritage-dark-border pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-heritage-cream-100 dark:bg-heritage-dark-hover flex items-center justify-center shadow-inner ${section.color}`}>
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text font-bold">
                      {section.label}
                    </h3>
                    <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted font-medium">
                      {sectionRecipes.length} recipe{sectionRecipes.length !== 1 ? 's' : ''} added
                    </p>
                  </div>
                </div>
                {canAdd && (
                  <button
                    onClick={() => { setAddCategory(section.key); setShowAddRecipe(true); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted transition-all shadow-soft border border-heritage-cream-300 dark:border-heritage-dark-border"
                  >
                    <Plus size={13} /> Add {section.label}
                  </button>
                )}
              </div>

              {/* Empty state */}
              {sectionRecipes.length === 0 ? (
                <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-8 text-center bg-heritage-cream-50/50 dark:bg-heritage-dark-hover/30">
                  <div className="w-12 h-12 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-500 dark:text-heritage-dark-muted mb-3">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="font-bold text-heritage-green-800 dark:text-heritage-dark-text text-sm">
                    0 Recipes Added
                  </h4>
                  <p className="text-heritage-green-500 dark:text-heritage-dark-muted text-xs mt-1 max-w-sm mx-auto">
                    Add the first recipe to {section.label.toLowerCase()}
                  </p>
                  {canAdd && (
                    <button
                      onClick={() => { setAddCategory(section.key); setShowAddRecipe(true); }}
                      className="mt-4 inline-flex items-center gap-2 bg-heritage-bark-600 hover:bg-heritage-bark-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-soft transition-all"
                    >
                      <Plus size={13} /> Add the first recipe to {section.label.toLowerCase()}
                    </button>
                  )}
                </div>
              ) : (
                /* Recipe grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sectionRecipes.map(recipe => {
                    const contributor = recipe.contributedByMemberId
                      ? data.members.find(m => m.id === recipe.contributedByMemberId)
                      : undefined;
                    return (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        contributor={contributor ? fullName(contributor) : undefined}
                        canRemove={canRemove}
                        onOpen={() => setOpenRecipeId(recipe.id)}
                        onDelete={() => handleDeleteRecipe(recipe.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modals ── */}
      {showAddRecipe && (
        <AddRecipeModal
          albumId={familyCookbook.id}
          onClose={() => setShowAddRecipe(false)}
          initialCategory={addCategory ?? undefined}
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

// ── RecipeCard ────────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  contributor?: string;
  canRemove: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function RecipeCard({ recipe, contributor, canRemove, onOpen, onDelete }: RecipeCardProps) {
  return (
    <div
      className="group bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-2xl overflow-hidden border border-heritage-cream-200 dark:border-heritage-dark-border hover:border-heritage-bark-400 dark:hover:border-heritage-bark-600 transition-all duration-300 shadow-soft hover:shadow-soft-lg cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden bg-heritage-cream-200 dark:bg-heritage-dark-card shrink-0">
        {recipe.photoUrl ? (
          <img
            src={recipe.photoUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🍲
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
          {CATEGORY_LABEL[recipe.category]}
        </span>
        {/* Veg badge */}
        {recipe.isVegetarian && (
          <span className="absolute top-3 right-3 bg-heritage-gold-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-soft">
            <Star size={9} fill="currentColor" /> Veg
          </span>
        )}
        {/* Delete button */}
        {canRemove && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute bottom-2 right-2 bg-black/50 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete recipe"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <h4 className="font-serif font-bold text-heritage-green-900 dark:text-heritage-dark-text text-lg group-hover:text-heritage-bark-600 transition-colors line-clamp-1">
            {recipe.title}
          </h4>
          {(recipe.cookTime || recipe.familyStory) && (
            <div className="flex items-center gap-3 text-xs text-heritage-green-600 dark:text-heritage-dark-muted mt-2">
              {recipe.cookTime && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {recipe.cookTime}
                  </span>
                  {recipe.familyStory && <span>•</span>}
                </>
              )}
              {recipe.familyStory && (
                <span className="flex items-center gap-1 italic line-clamp-1">
                  <Flame size={11} /> {recipe.familyStory}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border text-xs">
          {contributor ? (
            <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium truncate">
              By <strong className="text-heritage-green-900 dark:text-heritage-dark-text">{contributor}</strong>
            </span>
          ) : (
            <span />
          )}
          <span className="text-heritage-bark-600 dark:text-heritage-bark-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 shrink-0 ml-2">
            View Recipe <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── RecipeDetail Modal ────────────────────────────────────────────────────────

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
  const contributor = recipe.contributedByMemberId
    ? data.members.find(m => m.id === recipe.contributedByMemberId)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-heritage-dark-card rounded-2xl shadow-2xl border border-heritage-cream-200 dark:border-heritage-dark-border my-8 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header image ── */}
        <div className="relative h-64 sm:h-80 w-full bg-heritage-green-900 flex-shrink-0">
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-heritage-cream-200">
              🍲
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-heritage-bark-600 text-white mb-2 shadow-soft">
              {CATEGORY_LABEL[recipe.category]}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white leading-tight">
              {recipe.title}
            </h2>
            {contributor && (
              <p className="text-heritage-cream-200 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <Tag size={12} />
                Contributed by <strong>{fullName(contributor)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow">

          {/* Meta stats bar */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-2xl border border-heritage-cream-200 dark:border-heritage-dark-border text-center">
            <div>
              <span className="block text-xs text-heritage-green-600 dark:text-heritage-dark-muted uppercase font-semibold tracking-wide">Cook Time</span>
              <span className="text-sm font-bold text-heritage-green-900 dark:text-heritage-dark-text mt-0.5 block">
                {recipe.cookTime || '—'}
              </span>
            </div>
            <div className="border-x border-heritage-cream-200 dark:border-heritage-dark-border">
              {recipe.isVegetarian ? (
                <>
                  <span className="block text-xs text-heritage-green-600 dark:text-heritage-dark-muted uppercase font-semibold tracking-wide">Dietary</span>
                  <span className="text-sm font-bold text-heritage-gold-600 dark:text-heritage-gold-400 mt-0.5 block flex items-center justify-center gap-1">
                    <Star size={12} fill="currentColor" /> Vegetarian
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-xs text-heritage-green-600 dark:text-heritage-dark-muted uppercase font-semibold tracking-wide">Category</span>
                  <span className="text-sm font-bold text-heritage-green-900 dark:text-heritage-dark-text mt-0.5 block">
                    {CATEGORY_LABEL[recipe.category]}
                  </span>
                </>
              )}
            </div>
            <div>
              <span className="block text-xs text-heritage-green-600 dark:text-heritage-dark-muted uppercase font-semibold tracking-wide">Added By</span>
              <span className="text-sm font-bold text-heritage-green-900 dark:text-heritage-dark-text mt-0.5 block truncate">
                {contributor ? (
                  <button
                    onClick={() => { onClose(); onSelectMember(contributor.id); }}
                    className="hover:text-heritage-gold-600 hover:underline transition-colors"
                  >
                    {fullName(contributor)}
                  </button>
                ) : '—'}
              </span>
            </div>
          </div>

          {/* Family story */}
          {recipe.familyStory && (
            <div className="bg-heritage-cream-100 dark:bg-heritage-dark-hover rounded-2xl p-4 border border-heritage-cream-200 dark:border-heritage-dark-border italic">
              <p className="text-xs font-semibold uppercase tracking-wider text-heritage-green-600 dark:text-heritage-dark-muted mb-1">Family Story</p>
              <p className="text-sm text-heritage-green-900 dark:text-heritage-dark-text leading-relaxed">
                "{recipe.familyStory}"
              </p>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h4 className="text-lg font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text mb-3 flex items-center gap-2">
              <ShoppingBasket size={18} className="text-heritage-bark-600" /> Ingredients
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-heritage-cream-50 dark:bg-heritage-dark-hover/50 p-4 rounded-2xl border border-heritage-cream-100 dark:border-heritage-dark-border text-sm">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-heritage-green-800 dark:text-heritage-dark-text">
                  <span className="text-heritage-bark-600 mt-0.5 shrink-0">✓</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="text-lg font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text mb-3 flex items-center gap-2">
              <ListChecks size={18} className="text-heritage-green-700" /> Step-by-Step Instructions
            </h4>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-3 bg-heritage-cream-50 dark:bg-heritage-dark-hover p-3.5 rounded-xl border border-heritage-cream-100 dark:border-heritage-dark-border">
                  <span className="w-6 h-6 rounded-full bg-heritage-green-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-heritage-green-900 dark:text-heritage-dark-text text-sm leading-relaxed">
                    {step.replace(/^\d+[\.)]\s*/, '')}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="p-4 bg-heritage-cream-50 dark:bg-heritage-dark-hover border-t border-heritage-cream-200 dark:border-heritage-dark-border flex justify-end gap-3 flex-shrink-0">
          {onDelete && (
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
};

// ── Category SVG Icons ────────────────────────────────────────────────────────

function BreakfastIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="1" y="4.5" width="9" height="10.5" rx="1.3" fill="#dfc270" stroke="#c5a059" strokeWidth="1" transform="rotate(-14 5.5 9.75)" />
      <ellipse cx="14.5" cy="14" rx="9" ry="6.3" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1.3" />
      <circle cx="15" cy="12.8" r="3.6" fill="#dfc270" stroke="#c5a059" strokeWidth="1" />
    </svg>
  );
}

function MainMealsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M9 6.2c0-1.3.9-1.3.9-2.6M13 6.2c0-1.3.9-1.3.9-2.6" stroke="#386b57" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
      <rect x="0.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
      <rect x="20.5" y="10" width="3" height="1.9" rx="0.9" fill="#c5a059" />
      <rect x="3" y="9.6" width="18" height="2.1" rx="1" fill="#dfc270" stroke="#c5a059" strokeWidth="0.8" />
      <path d="M4 11.7h16v4.6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4.6z" fill="#386b57" stroke="#2c5445" strokeWidth="1" />
    </svg>
  );
}

function SnacksIcon({ size = 18 }: { size?: number }) {
  return (
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
}

function DessertsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M6 12h12l-1.5 8a2 2 0 0 1-2 1.7H9.5a2 2 0 0 1-2-1.7L6 12z" fill="#c5a059" stroke="#a68241" strokeWidth="1" />
      <path d="M5 12c0-3.5 3-5.5 7-5.5s7 2 7 5.5H5z" fill="#fdf8ee" stroke="#c5a059" strokeWidth="1" />
      <circle cx="12" cy="5" r="1.6" fill="#846332" />
    </svg>
  );
}
