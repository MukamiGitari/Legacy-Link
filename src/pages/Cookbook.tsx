import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, Plus, Clock, Star, ChefHat, Trash2, Search, Mic, MicOff,
  Flame, ArrowRight, BookOpen, Camera, Loader2, Heart,
  LayoutGrid, Columns, Sparkles, Check, CalendarDays, Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { AddRecipeModal } from '../components/cookbook/AddRecipeModal';
import {
  WeeklyMealPlanner,
  createEmptyWeeklyPlan,
  type WeeklyPlan,
} from '../components/cookbook/WeeklyMealPlanner';
import { PlanRecipeModal } from '../components/cookbook/PlanRecipeModal';
import type { Recipe, RecipeCategory } from '../types';
import { canAddContent, canDelete } from '../lib/permissions';

// ── Category Metadata ─────────────────────────────────────────────────────────

const CATEGORIES: { key: RecipeCategory; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'main', label: 'Main meals', icon: '🍲' },
  { key: 'snacks', label: 'Snacks', icon: '🥟' },
  { key: 'desserts', label: 'Desserts', icon: '🍰' },
];

export const isVeganRecipe = (r: Recipe): boolean => {
  const text = (
    r.title +
    ' ' +
    r.ingredients.join(' ') +
    ' ' +
    (r.familyStory || '')
  ).toLowerCase();

  const nonVegan = [
    'meat', 'beef', 'chicken', 'pork', 'fish', 'goat', 'lamb', 'mutton',
    'milk', 'butter', 'cream', 'cheese', 'yoghurt', 'yogurt', 'egg', 'eggs',
    'ghee', 'lard', 'bacon', 'mayo', 'honey', 'poultry'
  ];
  const hasAnimalProducts = nonVegan.some((item) => text.includes(item));
  if (text.includes('vegan') || text.includes('plant-based')) return true;
  if (r.isVegetarian && !hasAnimalProducts) return true;
  if (!hasAnimalProducts && r.ingredients.length > 0 && !text.includes('meat') && !text.includes('bone')) return true;
  return false;
};

export const isVegetarianRecipe = (r: Recipe): boolean => {
  if (r.isVegetarian) return true;
  const text = (
    r.title +
    ' ' +
    r.ingredients.join(' ') +
    ' ' +
    (r.familyStory || '')
  ).toLowerCase();
  const meats = ['meat', 'beef', 'chicken', 'pork', 'fish', 'goat', 'lamb', 'mutton', 'bacon', 'lard', 'poultry'];
  return !meats.some((m) => text.includes(m));
};

export const getDietaryStatus = (r: Recipe): { label: string; icon: string; isVegan: boolean } | null => {
  if (isVeganRecipe(r)) {
    return { label: 'Vegan', icon: '🌱', isVegan: true };
  }
  if (isVegetarianRecipe(r)) {
    return { label: 'Vegetarian', icon: '🌿', isVegan: false };
  }
  return null;
};

interface Props {
  onSelectMember: (id: string) => void;
}

export const Cookbook: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, removeRecipe, pushToast } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  const familyCookbook = data.cookbookAlbums[0] || {
    id: 'c0000000-0000-0000-0000-000000000001',
    familyId: data.family?.id || 'a0000000-0000-0000-0000-000000000001',
    title: `${data.family?.name || "M'Ikunyua"} Kitchen Hub & Heritage Recipes`,
    style: 'traditional',
    description: 'Preserving time-tested family culinary wisdom across generations.',
  };

  // State
  const [activeTab, setActiveTab] = useState<'recipes' | 'pantry' | 'favorites' | 'stories' | 'meal_plan'>('recipes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | RecipeCategory>('all');
  const [onlyVegetarian, setOnlyVegetarian] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid'>('masonry');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addCategory, setAddCategory] = useState<RecipeCategory | null>(null);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [planningRecipe, setPlanningRecipe] = useState<Recipe | null>(null);

  // Weekly Plan in localStorage
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() => {
    try {
      const saved = localStorage.getItem('legacy-link-weekly-meal-plan');
      return saved ? JSON.parse(saved) : createEmptyWeeklyPlan();
    } catch {
      return createEmptyWeeklyPlan();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('legacy-link-weekly-meal-plan', JSON.stringify(weeklyPlan));
    } catch {}
  }, [weeklyPlan]);

  // Favorites in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('legacy-link-favorite-recipes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('legacy-link-favorite-recipes', JSON.stringify(favoriteIds));
    } catch {}
  }, [favoriteIds]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      pushToast(exists ? 'Removed from favorites' : 'Saved to favorites ❤️', 'success');
      return next;
    });
  };

  // Speech Recognition / Voice Mic Search
  const [isListening, setIsListening] = useState(false);
  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      pushToast('Voice search is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => {
        setIsListening(false);
        pushToast('Voice recognition canceled or unavailable.');
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          setSearchQuery(spoken);
          pushToast(`Searching for: "${spoken}"`, 'success');
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const openRecipe = openRecipeId ? data.recipes.find((r) => r.id === openRecipeId) : undefined;

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm("Delete this recipe? This can't be undone.")) {
      removeRecipe(recipeId);
      setOpenRecipeId(null);
    }
  };

  // Recipe Rating generator (consistent per recipe ID for visual realism)
  const getRecipeRating = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
    const score = 4.6 + (Math.abs(hash) % 4) * 0.1;
    return score.toFixed(1);
  };

  // Main Filtered Recipe Stream
  const filteredRecipes = useMemo(() => {
    return data.recipes.filter((r) => {
      // 1. Tab filter
      if (activeTab === 'favorites' && !favoriteIds.includes(r.id)) return false;
      if (activeTab === 'stories' && !r.familyStory) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

      // 3. Vegetarian / Vegan filter
      if (onlyVegetarian && !isVegetarianRecipe(r)) return false;

      // 4. Pantry / search query filter (matches title, ingredient list, author, or story)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const terms = q.split(',').map((t) => t.trim()).filter(Boolean);

        const titleMatch = terms.some((t) => r.title.toLowerCase().includes(t));
        const ingredientMatch = terms.some((t) =>
          r.ingredients.some((ing) => ing.toLowerCase().includes(t))
        );
        const storyMatch = r.familyStory && terms.some((t) => r.familyStory!.toLowerCase().includes(t));
        const contributor = r.contributedByMemberId
          ? data.members.find((m) => m.id === r.contributedByMemberId)
          : undefined;
        const authorMatch = contributor && terms.some((t) => fullName(contributor).toLowerCase().includes(t));

        if (!titleMatch && !ingredientMatch && !storyMatch && !authorMatch) return false;
      }

      return true;
    });
  }, [data.recipes, activeTab, selectedCategory, onlyVegetarian, searchQuery, favoriteIds, data.members]);

  const scheduledCount = useMemo(() => {
    return Object.values(weeklyPlan).reduce((acc, cur) => acc + Object.keys(cur).length, 0);
  }, [weeklyPlan]);

  const totalVegCount = useMemo(() => {
    return data.recipes.filter(isVegetarianRecipe).length;
  }, [data.recipes]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Kitchen Hub Navigation Header (Tablet Style) ── */}
      <div className="bg-[#12171e] text-white rounded-3xl p-5 md:p-6 shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-heritage-gold-600 to-amber-400 text-heritage-green-950 flex items-center justify-center shadow-lg font-bold">
            <ChefHat size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black tracking-tight text-xl md:text-2xl text-white">
                KITCHEN HUB: <span className="text-heritage-gold-400">COOKBOOK</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-heritage-gold-500/20 text-heritage-gold-300 border border-heritage-gold-500/30">
                Tablet Console
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {familyCookbook.description || 'Preserving time-tested family culinary heritage'}
            </p>
          </div>
        </div>

        {/* Sub-tabs matching Tablet Mockup */}
        <div className="flex items-center gap-1.5 bg-[#1b222c] p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-heritage-gold-500 text-heritage-green-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            All Recipes
          </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'pantry'
                ? 'bg-heritage-gold-500 text-heritage-green-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Pantry Search
          </button>
          <button
            onClick={() => setActiveTab('meal_plan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'meal_plan'
                ? 'bg-heritage-gold-500 text-heritage-green-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays size={13} className={activeTab === 'meal_plan' ? 'text-heritage-green-950' : 'text-heritage-gold-400'} />
            <span>Meal Plan ({scheduledCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'favorites'
                ? 'bg-heritage-gold-500 text-heritage-green-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart size={13} className={activeTab === 'favorites' ? 'fill-heritage-green-950' : ''} />
            Favorites ({favoriteIds.length})
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'stories'
                ? 'bg-heritage-gold-500 text-heritage-green-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Family Stories
          </button>
        </div>
      </div>

      {/* ── Active View Rendering ── */}
      {activeTab === 'meal_plan' ? (
        /* ── WEEKLY MEAL PLANNER TIMETABLE ── */
        <WeeklyMealPlanner
          recipes={data.recipes}
          weeklyPlan={weeklyPlan}
          onUpdatePlan={setWeeklyPlan}
          onOpenRecipe={(id) => setOpenRecipeId(id)}
          pushToast={pushToast}
        />
      ) : (
        /* ── REGULAR RECIPE STREAM & PANTRY FINDER ── */
        <>
          {/* ── 2. Full-Width Interactive Pantry Finder Console (Golden Highlighted Box) ── */}
          <div className="bg-[#12171e] text-white p-5 md:p-6 rounded-3xl border-2 border-heritage-gold-500/80 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-heritage-gold-400" />
                <span className="font-serif font-bold text-sm md:text-base tracking-wide text-heritage-gold-300">
                  Interactive Pantry Finder & Category Explorer
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{filteredRecipes.length} recipes matched</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-heritage-gold-400 hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>

            {/* Search Input with Voice Mic */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by pantry ingredients (e.g., maize, potatoes, coconut, ndengu)..."
                className="w-full pl-11 pr-14 py-3.5 bg-[#1c232d] border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-heritage-gold-500 transition-all shadow-inner"
              />
              <button
                onClick={startVoiceSearch}
                title="Voice Search Pantry"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/10 text-heritage-gold-300 hover:bg-white/20'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            {/* Popular Pantry Ingredient Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Pantry Staples:</span>
              {['Potatoes', 'Green Maize', 'Coconut Milk', 'Pumpkin Leaves', 'Ndengu', 'Beans'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setSearchQuery(chip)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-heritage-gold-500/20 hover:text-heritage-gold-300 text-[11px] text-slate-300 border border-white/5 transition-colors shrink-0"
                >
                  +{chip}
                </button>
              ))}
            </div>

            {/* Category & Vegetarian/Vegan Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-heritage-gold-500 text-heritage-green-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
                      selectedCategory === cat.key
                        ? 'bg-heritage-gold-500 text-heritage-green-950 font-bold shadow-md'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Vegetarian / Vegan Badge Filter Toggle */}
              <button
                onClick={() => setOnlyVegetarian((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  onlyVegetarian
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-emerald-400 hover:bg-emerald-500/10'
                }`}
                title="Filter by Vegetarian or Vegan meals"
              >
                <span>🌱</span>
                <span>Vegetarian / Vegan ({totalVegCount})</span>
              </button>
            </div>
          </div>

          {/* ── 3. Recipe Stream Controls & Layout Switcher ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="font-serif font-black text-xl text-heritage-green-950 dark:text-heritage-gold-300 tracking-wide uppercase flex items-center gap-2">
                <span>Compact Recipe Stream</span>
                <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-heritage-green-800 text-heritage-cream-100 dark:bg-heritage-dark-card dark:text-heritage-dark-muted">
                  {filteredRecipes.length}
                </span>
              </h2>
              <p className="text-xs text-heritage-bark-500 dark:text-heritage-dark-muted">
                {layoutMode === 'masonry'
                  ? 'Masonry stream active: dynamic heights showcase full recipe titles and heirlooms without clipping.'
                  : 'Compact grid active: uniform tablet dashboard cards.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Layout Toggle (Masonry vs Grid) */}
              <div className="flex items-center gap-1 bg-white dark:bg-heritage-dark-card p-1 rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border shadow-soft">
                <button
                  onClick={() => setLayoutMode('masonry')}
                  title="Masonry Stream View (Dynamic Title Height)"
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    layoutMode === 'masonry'
                      ? 'bg-heritage-green-800 text-white shadow-soft'
                      : 'text-heritage-bark-600 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
                >
                  <Columns size={15} />
                  <span className="hidden sm:inline">Masonry</span>
                </button>
                <button
                  onClick={() => setLayoutMode('grid')}
                  title="Compact Grid View (Uniform Tablet Cards)"
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    layoutMode === 'grid'
                      ? 'bg-heritage-green-800 text-white shadow-soft'
                      : 'text-heritage-bark-600 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>

              {/* Add Recipe Action Button */}
              {canAdd && (
                <button
                  onClick={() => {
                    setAddCategory(null);
                    setShowAddRecipe(true);
                  }}
                  className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-soft transition-all active:scale-95 shrink-0"
                >
                  <Plus size={15} /> Add Recipe
                </button>
              )}
            </div>
          </div>

          {/* ── 4. Recipe Stream (Masonry vs Grid Rendering) ── */}
          {filteredRecipes.length === 0 ? (
            <div className="bg-white dark:bg-heritage-dark-card border-2 border-dashed border-heritage-cream-300 dark:border-heritage-dark-border rounded-3xl p-12 text-center shadow-soft">
              <div className="w-16 h-16 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-bark-500 mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-heritage-green-950 dark:text-heritage-dark-text">
                No recipes matched your search
              </h3>
              <p className="text-xs text-heritage-bark-500 dark:text-heritage-dark-muted mt-1 max-w-sm mx-auto">
                Try adjusting your pantry search ingredients or turning off the Vegetarian/Vegan filter.
              </p>
              {canAdd && (
                <button
                  onClick={() => {
                    setAddCategory(null);
                    setShowAddRecipe(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-soft transition-all"
                >
                  <Plus size={15} /> Add a New Recipe
                </button>
              )}
            </div>
          ) : layoutMode === 'masonry' ? (
            /* ── MASONRY VIEW: Multi-column staggered layout ── */
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {filteredRecipes.map((recipe) => {
                const contributor = recipe.contributedByMemberId
                  ? data.members.find((m) => m.id === recipe.contributedByMemberId)
                  : undefined;
                const isFav = favoriteIds.includes(recipe.id);
                const rating = getRecipeRating(recipe.id);

                return (
                  <div key={recipe.id} className="break-inside-avoid">
                    <TabletRecipeCard
                      recipe={recipe}
                      contributor={contributor ? fullName(contributor) : undefined}
                      isFavorite={isFav}
                      onToggleFavorite={(e) => toggleFavorite(recipe.id, e)}
                      onPlan={() => setPlanningRecipe(recipe)}
                      rating={rating}
                      canRemove={canRemove}
                      onOpen={() => setOpenRecipeId(recipe.id)}
                      onDelete={() => handleDeleteRecipe(recipe.id)}
                      isMasonry={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── COMPACT GRID VIEW: Tablet dashboard grid ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredRecipes.map((recipe) => {
                const contributor = recipe.contributedByMemberId
                  ? data.members.find((m) => m.id === recipe.contributedByMemberId)
                  : undefined;
                const isFav = favoriteIds.includes(recipe.id);
                const rating = getRecipeRating(recipe.id);

                return (
                  <TabletRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    contributor={contributor ? fullName(contributor) : undefined}
                    isFavorite={isFav}
                    onToggleFavorite={(e) => toggleFavorite(recipe.id, e)}
                    onPlan={() => setPlanningRecipe(recipe)}
                    rating={rating}
                    canRemove={canRemove}
                    onOpen={() => setOpenRecipeId(recipe.id)}
                    onDelete={() => handleDeleteRecipe(recipe.id)}
                    isMasonry={false}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showAddRecipe && (
        <AddRecipeModal
          albumId={familyCookbook.id}
          onClose={() => setShowAddRecipe(false)}
          initialCategory={addCategory ?? undefined}
        />
      )}

      {planningRecipe && (
        <PlanRecipeModal
          recipe={planningRecipe}
          weeklyPlan={weeklyPlan}
          onUpdatePlan={setWeeklyPlan}
          onClose={() => setPlanningRecipe(null)}
          pushToast={pushToast}
        />
      )}

      {openRecipe && (
        <RecipeDetail
          recipe={openRecipe}
          onClose={() => setOpenRecipeId(null)}
          onSelectMember={onSelectMember}
          onPlan={() => setPlanningRecipe(openRecipe)}
          onDelete={canRemove ? () => handleDeleteRecipe(openRecipe.id) : undefined}
        />
      )}
    </div>
  );
};

// ── Tablet-Styled Recipe Card (Matching the Uploaded Image) ───────────────────

interface TabletRecipeCardProps {
  recipe: Recipe;
  contributor?: string;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onPlan: () => void;
  rating: string;
  canRemove: boolean;
  onOpen: () => void;
  onDelete: () => void;
  isMasonry: boolean;
}

function TabletRecipeCard({
  recipe,
  contributor,
  isFavorite,
  onToggleFavorite,
  onPlan,
  rating,
  canRemove,
  onOpen,
  onDelete,
  isMasonry,
}: TabletRecipeCardProps) {
  const dietary = getDietaryStatus(recipe);

  return (
    <div
      onClick={onOpen}
      className="group bg-[#161c24] text-white rounded-2xl overflow-hidden border border-white/10 hover:border-heritage-gold-500/80 transition-all duration-300 shadow-md hover:shadow-2xl cursor-pointer flex flex-col relative"
    >
      {/* ── Photo Container with Rounded Aspect & Floating Badges ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1f2732] shrink-0">
        {recipe.photoUrl ? (
          <img
            src={recipe.photoUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-[#161c24] to-[#252f3d]">
            🍲
          </div>
        )}

        {/* Favorite Heart Button (Top Right) */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center transition-transform active:scale-75 text-white shadow-md z-10"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white/90 hover:text-red-400'}
          />
        </button>

        {/* Prep Time Pill (Bottom Left over Photo - Tablet Style) */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-md">
          <Clock size={12} className="text-heritage-gold-400" />
          <span>{recipe.cookTime || '25 mins Prep'}</span>
        </div>

        {/* Vegan or Vegetarian Badge (Top Left over Photo) */}
        {dietary && (
          <span
            className={`absolute top-2.5 left-2.5 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-md uppercase tracking-wider ${
              dietary.isVegan ? 'bg-emerald-600/95 border border-emerald-400/40' : 'bg-green-700/95 border border-green-400/40'
            }`}
          >
            <span>{dietary.icon}</span>
            <span>{dietary.label}</span>
          </span>
        )}

        {/* Delete button for Admins */}
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete recipe"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* ── Card Body with Masonry-Optimized Titles ── */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-2.5">
        <div>
          <h3
            className={`font-serif font-black text-white group-hover:text-heritage-gold-400 transition-colors uppercase tracking-tight leading-snug text-sm sm:text-base ${
              isMasonry ? 'line-clamp-none' : 'line-clamp-2 min-h-[2.5rem]'
            }`}
          >
            {recipe.title}
          </h3>

          {/* Heirloom story preview (visible in masonry stream) */}
          {isMasonry && recipe.familyStory && (
            <p className="text-xs text-slate-400 italic line-clamp-2 mt-1.5 leading-relaxed">
              "{recipe.familyStory}"
            </p>
          )}
        </div>

        {/* Dietary / Category, Star Rating & Plan Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            {dietary ? (
              <span
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  dietary.isVegan
                    ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                    : 'text-green-300 bg-green-500/15 border-green-500/30'
                }`}
              >
                <span>{dietary.icon}</span>
                <span>{dietary.label}</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 capitalize">
                {recipe.category}
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlan();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-heritage-gold-400 hover:text-white bg-heritage-gold-500/10 hover:bg-heritage-gold-500/30 px-2 py-0.5 rounded-md border border-heritage-gold-500/30 transition-colors"
              title="Add to weekly meal plan"
            >
              <CalendarDays size={11} />
              <span>Plan</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-heritage-gold-400 font-bold text-xs">
            <Star size={13} className="fill-heritage-gold-400 text-heritage-gold-400" />
            <span>{rating}</span>
          </div>
        </div>

        {/* Contributor / Family attribution */}
        {contributor && (
          <div className="text-[10px] text-slate-400 truncate">
            Family Heirloom by <span className="text-slate-200 font-medium">{contributor}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RecipeDetail Modal ────────────────────────────────────────────────────────

const RecipeDetail: React.FC<{
  recipe: Recipe;
  onClose: () => void;
  onSelectMember: (id: string) => void;
  onPlan: () => void;
  onDelete?: () => void;
}> = ({ recipe, onClose, onSelectMember, onPlan, onDelete }) => {
  const { data, currentProfile, updateRecipe, isOnlineMode, pushToast } = useApp();
  const canEdit = canAddContent(currentProfile?.role);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dietary = getDietaryStatus(recipe);

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file || updatingPhoto) return;
    setUpdatingPhoto(true);
    try {
      let url = '';
      if (isOnlineMode) {
        const { uploadFileToR2 } = await import('../lib/api');
        const res = await uploadFileToR2({ category: 'photos', file });
        url = res.url;
      } else {
        const reader = new FileReader();
        url = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      updateRecipe(recipe.id, { photoUrl: url });
      pushToast('Recipe photo updated successfully!', 'success');
    } catch (err: any) {
      pushToast(`Failed to update recipe photo: ${err?.message || 'unknown error'}`);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const contributor = recipe.contributedByMemberId
    ? data.members.find((m) => m.id === recipe.contributedByMemberId)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[#161c24] text-white rounded-3xl shadow-2xl border border-white/10 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header photo banner */}
        <div className="relative h-64 sm:h-80 w-full bg-[#1c232d] shrink-0">
          {recipe.photoUrl ? (
            <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-[#12171e]">
              🍲
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161c24] via-black/40 to-transparent" />

          {/* Add / Change Photo button */}
          {canEdit && (
            <div className="absolute top-4 left-4 z-10">
              <button
                type="button"
                disabled={updatingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all shadow-md"
              >
                {updatingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>{updatingPhoto ? 'Uploading…' : recipe.photoUrl ? 'Change Photo' : 'Add Photo'}</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-gold-400 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {recipe.category.toUpperCase()}
              </span>
              {dietary && (
                <span
                  className={`text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 ${
                    dietary.isVegan ? 'bg-emerald-600' : 'bg-green-700'
                  }`}
                >
                  <span>{dietary.icon}</span>
                  <span>{dietary.label}</span>
                </span>
              )}
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-white mt-1 uppercase tracking-tight">
              {recipe.title}
            </h2>
            {recipe.cookTime && (
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <Clock size={12} className="text-heritage-gold-400" /> {recipe.cookTime}
              </p>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Schedule to Meal Plan Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-heritage-gold-500/20 via-amber-500/10 to-transparent border border-heritage-gold-500/30">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-heritage-gold-400" size={18} />
              <span className="text-xs text-white font-bold">Cook this during the week?</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onPlan();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-heritage-gold-500 hover:bg-heritage-gold-400 text-heritage-green-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              + Add to Weekly Timetable
            </button>
          </div>

          {/* Family Heirloom Story */}
          {recipe.familyStory && (
            <div className="p-4 rounded-2xl bg-heritage-gold-500/10 border border-heritage-gold-500/30 text-heritage-gold-200">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-heritage-gold-400 mb-1">
                <Flame size={14} /> Family Heritage Story
              </div>
              <p className="text-sm italic leading-relaxed text-slate-200">"{recipe.familyStory}"</p>
            </div>
          )}

          {/* Ingredients & Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div className="bg-[#1b222c] p-5 rounded-2xl border border-white/5">
              <h3 className="font-serif font-bold text-base text-heritage-gold-400 uppercase tracking-wider mb-3">
                Ingredients ({recipe.ingredients.length})
              </h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-heritage-gold-500 mt-0.5">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="bg-[#1b222c] p-5 rounded-2xl border border-white/5">
              <h3 className="font-serif font-bold text-base text-heritage-gold-400 uppercase tracking-wider mb-3">
                Preparation Steps ({recipe.instructions.length})
              </h3>
              <ol className="space-y-3 text-sm text-slate-200">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-heritage-gold-500/20 text-heritage-gold-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
            {contributor ? (
              <span>
                Heirloom passed down by{' '}
                <button
                  onClick={() => {
                    onClose();
                    onSelectMember(recipe.contributedByMemberId!);
                  }}
                  className="font-bold text-heritage-gold-400 hover:underline"
                >
                  {fullName(contributor)}
                </button>
              </span>
            ) : (
              <span />
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 size={13} /> Delete Recipe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Cookbook;
