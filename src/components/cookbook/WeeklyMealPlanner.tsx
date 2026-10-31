import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  X,
  Sparkles,
  ShoppingBag,
  Check,
  Clock,
  Flame,
  ArrowRight,
  Printer,
  RotateCcw,
  ChefHat,
  Search,
} from 'lucide-react';
import type { Recipe, RecipeCategory } from '../../types';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  recipeId?: string;
  customTitle?: string;
  notes?: string;
}

export type WeeklyPlan = Record<DayOfWeek, Partial<Record<MealSlot, PlannedMeal>>>;

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const MEAL_SLOTS: { key: MealSlot; label: string; icon: string; defaultCategory: RecipeCategory }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', defaultCategory: 'breakfast' },
  { key: 'lunch', label: 'Lunch', icon: '☀️', defaultCategory: 'main' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', defaultCategory: 'main' },
  { key: 'snack', label: 'Snack / Tea', icon: '☕', defaultCategory: 'snacks' },
];

export const createEmptyWeeklyPlan = (): WeeklyPlan => ({
  Monday: {},
  Tuesday: {},
  Wednesday: {},
  Thursday: {},
  Friday: {},
  Saturday: {},
  Sunday: {},
});

interface WeeklyMealPlannerProps {
  recipes: Recipe[];
  weeklyPlan: WeeklyPlan;
  onUpdatePlan: (plan: WeeklyPlan) => void;
  onOpenRecipe: (id: string) => void;
  pushToast: (msg: string, tone?: 'error' | 'success') => void;
}

export const WeeklyMealPlanner: React.FC<WeeklyMealPlannerProps> = ({
  recipes,
  weeklyPlan,
  onUpdatePlan,
  onOpenRecipe,
  pushToast,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [viewMode, setViewMode] = useState<'full_week' | 'day_by_day'>('full_week');
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Slot editing modal
  const [editingSlot, setEditingSlot] = useState<{ day: DayOfWeek; slot: MealSlot } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [customMealInput, setCustomMealInput] = useState('');

  // Assign recipe or custom title to slot
  const assignMeal = (day: DayOfWeek, slot: MealSlot, meal: PlannedMeal) => {
    const updated: WeeklyPlan = {
      ...weeklyPlan,
      [day]: {
        ...(weeklyPlan[day] || {}),
        [slot]: meal,
      },
    };
    onUpdatePlan(updated);
    setEditingSlot(null);
    setRecipeSearch('');
    setCustomMealInput('');
    pushToast(`Added to ${day} ${slot}!`, 'success');
  };

  // Remove meal from slot
  const removeMeal = (day: DayOfWeek, slot: MealSlot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dayPlan = { ...(weeklyPlan[day] || {}) };
    delete dayPlan[slot];
    const updated: WeeklyPlan = {
      ...weeklyPlan,
      [day]: dayPlan,
    };
    onUpdatePlan(updated);
    pushToast(`Removed from ${day} ${slot}.`);
  };

  // Clear entire week
  const clearEntireWeek = () => {
    if (window.confirm('Clear all meals planned for this week?')) {
      onUpdatePlan(createEmptyWeeklyPlan());
      pushToast('Weekly meal timetable cleared.');
    }
  };

  // Smart Heritage Auto-Fill
  const autoFillHeritagePlan = () => {
    if (recipes.length === 0) {
      pushToast('Add some recipes to your cookbook first to auto-fill!');
      return;
    }

    const breakfasts = recipes.filter((r) => r.category === 'breakfast');
    const mains = recipes.filter((r) => r.category === 'main');
    const snacks = recipes.filter((r) => r.category === 'snacks');
    const allMains = mains.length > 0 ? mains : recipes;

    const randomPick = (arr: Recipe[]) => (arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : recipes[0]);

    const newPlan = createEmptyWeeklyPlan();
    DAYS_OF_WEEK.forEach((day) => {
      newPlan[day] = {
        breakfast: { recipeId: randomPick(breakfasts.length > 0 ? breakfasts : recipes).id },
        lunch: { recipeId: randomPick(allMains).id },
        dinner: { recipeId: randomPick(allMains).id },
        snack: { recipeId: randomPick(snacks.length > 0 ? snacks : recipes).id },
      };
    });

    onUpdatePlan(newPlan);
    pushToast('Auto-filled your weekly timetable with family favorites! 🍲', 'success');
  };

  // Aggregate grocery list from all planned recipes
  const groceryItems = React.useMemo(() => {
    const items = new Set<string>();
    DAYS_OF_WEEK.forEach((d) => {
      const dayPlan = weeklyPlan[d];
      if (!dayPlan) return;
      MEAL_SLOTS.forEach(({ key }) => {
        const meal = dayPlan[key];
        if (meal?.recipeId) {
          const rec = recipes.find((r) => r.id === meal.recipeId);
          rec?.ingredients.forEach((ing) => items.add(ing.trim()));
        }
      });
    });
    return Array.from(items);
  }, [weeklyPlan, recipes]);

  const toggleCheckIngredient = (item: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // Count planned meals
  const totalPlannedMeals = React.useMemo(() => {
    let count = 0;
    DAYS_OF_WEEK.forEach((d) => {
      const dayPlan = weeklyPlan[d];
      if (dayPlan) {
        MEAL_SLOTS.forEach(({ key }) => {
          if (dayPlan[key]) count++;
        });
      }
    });
    return count;
  }, [weeklyPlan]);

  return (
    <div className="space-y-6">
      {/* ── Control Bar ── */}
      <div className="bg-[#12171e] text-white p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-black text-xl text-white tracking-wide uppercase flex items-center gap-2">
              <CalendarDays className="text-heritage-gold-400" size={22} />
              <span>Weekly Heritage Meal Plan & Timetable</span>
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-heritage-gold-500/20 text-heritage-gold-300 border border-heritage-gold-500/30">
              {totalPlannedMeals} meals scheduled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize breakfast, lunch, dinner, and tea for every day of the week.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={autoFillHeritagePlan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-heritage-gold-500 text-heritage-green-950 hover:brightness-110 shadow-md transition-all active:scale-95"
            title="Auto-fill week with family favorites"
          >
            <Sparkles size={14} /> Auto-Fill Week
          </button>

          <button
            onClick={() => setShowGroceryList(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1f2733] hover:bg-[#283241] text-heritage-gold-300 border border-white/10 shadow-md transition-all"
            title="Generate grocery shopping list"
          >
            <ShoppingBag size={14} />
            <span>Grocery List ({groceryItems.length})</span>
          </button>

          <div className="flex items-center bg-[#1c232e] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('full_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'full_week' ? 'bg-heritage-gold-500 text-heritage-green-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Week
            </button>
            <button
              onClick={() => setViewMode('day_by_day')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'day_by_day' ? 'bg-heritage-gold-500 text-heritage-green-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day by Day
            </button>
          </div>

          {totalPlannedMeals > 0 && (
            <button
              onClick={clearEntireWeek}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title="Clear entire timetable"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Day-by-Day Switcher (if day_by_day mode) ── */}
      {viewMode === 'day_by_day' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const dayMealsCount = Object.keys(weeklyPlan[day] || {}).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-heritage-gold-500 text-heritage-green-950 border-heritage-gold-400 shadow-md scale-105'
                    : 'bg-[#141a22] text-slate-300 border-white/5 hover:bg-white/5'
                }`}
              >
                <span>{day}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20' : 'bg-white/10 text-slate-400'}`}>
                  {dayMealsCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Timetable Grid Display ── */}
      {viewMode === 'full_week' ? (
        /* Full Week Grid (7 Columns on large screens, scrollable or wrap) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayPlan = weeklyPlan[day] || {};
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

            return (
              <div
                key={day}
                className={`bg-[#141a22] rounded-3xl p-3.5 border flex flex-col justify-between space-y-3 transition-all ${
                  isToday ? 'border-heritage-gold-500/80 shadow-lg shadow-heritage-gold-500/10 ring-1 ring-heritage-gold-500/30' : 'border-white/10'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-black text-sm text-white">{day.slice(0, 3)}</span>
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-heritage-gold-500 text-heritage-green-950 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {Object.keys(dayPlan).length}/4
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-2.5 flex-1">
                  {MEAL_SLOTS.map(({ key: slotKey, label: slotLabel, icon: slotIcon }) => {
                    const meal = dayPlan[slotKey];
                    const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
                    const title = recipe?.title || meal?.customTitle;

                    return (
                      <div key={slotKey} className="space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                          <span>{slotIcon}</span>
                          <span>{slotLabel}</span>
                        </div>

                        {meal && title ? (
                          <div
                            onClick={() => (recipe ? onOpenRecipe(recipe.id) : null)}
                            className="group/meal bg-[#1b222d] hover:bg-[#222b38] border border-white/10 hover:border-heritage-gold-500/60 rounded-xl p-2 cursor-pointer transition-all relative overflow-hidden"
                          >
                            {recipe?.photoUrl && (
                              <div className="h-14 w-full rounded-lg overflow-hidden mb-1.5 relative">
                                <img src={recipe.photoUrl} alt={title} className="w-full h-full object-cover group-hover/meal:scale-105 transition-transform" />
                                {recipe.cookTime && (
                                  <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    {recipe.cookTime}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="font-serif font-bold text-xs text-white group-hover/meal:text-heritage-gold-300 leading-snug line-clamp-2">
                              {title}
                            </p>

                            <button
                              onClick={(e) => removeMeal(day, slotKey, e)}
                              className="absolute top-1 right-1 p-1 rounded-md bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover/meal:opacity-100 transition-opacity"
                              title="Remove meal"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSlot({ day, slot: slotKey })}
                            className="w-full py-2 px-2 rounded-xl border border-dashed border-white/10 hover:border-heritage-gold-500/60 hover:bg-white/5 text-[11px] text-slate-400 hover:text-heritage-gold-300 flex items-center justify-center gap-1 transition-all"
                          >
                            <Plus size={11} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day by Day View: Large visual card for the selected day */
        <div className="bg-[#141a22] rounded-3xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-serif font-black text-2xl text-white">{selectedDay}'s Menu</h3>
              <p className="text-xs text-slate-400">Timetable for breakfast, lunch, dinner, and refreshments</p>
            </div>
            <button
              onClick={() => {
                const dayPlan = { ...(weeklyPlan[selectedDay] || {}) };
                const updated = { ...weeklyPlan, [selectedDay]: {} };
                onUpdatePlan(updated);
                pushToast(`Cleared meals for ${selectedDay}.`);
              }}
              className="text-xs text-red-400 hover:underline"
            >
              Clear {selectedDay}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_SLOTS.map(({ key: slotKey, label: slotLabel, icon: slotIcon }) => {
              const meal = (weeklyPlan[selectedDay] || {})[slotKey];
              const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
              const title = recipe?.title || meal?.customTitle;

              return (
                <div
                  key={slotKey}
                  className="bg-[#1b222d] rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-heritage-gold-400">
                      <span>{slotIcon}</span>
                      <span>{slotLabel}</span>
                    </div>
                    {meal && (
                      <button
                        onClick={() => removeMeal(selectedDay, slotKey)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {meal && title ? (
                    <div className="space-y-2 flex-1">
                      {recipe?.photoUrl && (
                        <div className="h-32 w-full rounded-xl overflow-hidden relative">
                          <img src={recipe.photoUrl} alt={title} className="w-full h-full object-cover" />
                          {recipe.cookTime && (
                            <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              ⏱️ {recipe.cookTime}
                            </span>
                          )}
                        </div>
                      )}

                      <h4 className="font-serif font-black text-base text-white">{title}</h4>
                      {recipe?.familyStory && (
                        <p className="text-xs text-slate-400 italic line-clamp-2">"{recipe.familyStory}"</p>
                      )}

                      {recipe && (
                        <button
                          onClick={() => onOpenRecipe(recipe.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-heritage-gold-400 hover:underline"
                        >
                          View Recipe <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 border-2 border-dashed border-white/5 rounded-xl">
                      <ChefHat size={26} className="text-slate-600" />
                      <p className="text-xs text-slate-400">Nothing planned yet</p>
                      <button
                        onClick={() => setEditingSlot({ day: selectedDay, slot: slotKey })}
                        className="px-3 py-1.5 rounded-xl bg-heritage-gold-500/20 hover:bg-heritage-gold-500/30 text-heritage-gold-300 font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <Plus size={13} /> Schedule Meal
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Assign Meal Modal ── */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setEditingSlot(null)} />
          <div className="relative w-full max-w-xl bg-[#161c24] text-white rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-black text-lg text-white">
                  Schedule {editingSlot.day} {editingSlot.slot.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400">Choose from your family cookbook or enter a custom dish</p>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Custom Meal Input */}
            <div className="space-y-1.5 bg-[#1b222d] p-3.5 rounded-2xl border border-white/5">
              <label className="text-xs font-bold uppercase tracking-wider text-heritage-gold-400">
                Custom Dish Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customMealInput}
                  onChange={(e) => setCustomMealInput(e.target.value)}
                  placeholder="e.g., Grandma's Tea & Mandazi, Leftover Sukuma..."
                  className="flex-1 bg-[#12171e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-heritage-gold-500"
                />
                <button
                  onClick={() => {
                    if (customMealInput.trim()) {
                      assignMeal(editingSlot.day, editingSlot.slot, { customTitle: customMealInput.trim() });
                    }
                  }}
                  disabled={!customMealInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-heritage-gold-500 text-heritage-green-950 font-bold text-xs disabled:opacity-40"
                >
                  Set Custom
                </button>
              </div>
            </div>

            {/* Pick from Cookbook Recipes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pick from Cookbook Recipes ({recipes.length})
                </label>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Filter recipes..."
                  className="w-full pl-9 pr-4 py-2 bg-[#1b222d] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {recipes
                  .filter((r) => r.title.toLowerCase().includes(recipeSearch.toLowerCase()))
                  .map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => assignMeal(editingSlot.day, editingSlot.slot, { recipeId: rec.id })}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1b222d] hover:bg-heritage-gold-500/20 border border-white/5 hover:border-heritage-gold-500/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {rec.photoUrl ? (
                          <img src={rec.photoUrl} alt={rec.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#141a22] flex items-center justify-center text-lg shrink-0">
                            🍲
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-xs text-white group-hover:text-heritage-gold-300 truncate">
                            {rec.title}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">{rec.category} • {rec.cookTime || '25 min'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-heritage-gold-400 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grocery Shopping List Modal ── */}
      {showGroceryList && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowGroceryList(false)} />
          <div className="relative w-full max-w-xl bg-[#161c24] text-white rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-heritage-gold-500/20 text-heritage-gold-400 flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-white">Weekly Grocery Shopping List</h3>
                  <p className="text-xs text-slate-400">Aggregated from all scheduled meals this week</p>
                </div>
              </div>
              <button onClick={() => setShowGroceryList(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {groceryItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No recipes with ingredients planned yet! Add recipes to your weekly timetable to generate your shopping list.
                </div>
              ) : (
                groceryItems.map((item, idx) => {
                  const isChecked = Boolean(checkedIngredients[item]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheckIngredient(item)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white/5 border-white/5 text-slate-500 line-through'
                          : 'bg-[#1b222d] border-white/10 text-white hover:border-heritage-gold-500/40'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-white/20 bg-black/20'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-medium flex-1">{item}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with checklist count and print */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>
                {Object.values(checkedIngredients).filter(Boolean).length} of {groceryItems.length} checked
              </span>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                <Printer size={13} /> Print List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WeeklyMealPlanner;
