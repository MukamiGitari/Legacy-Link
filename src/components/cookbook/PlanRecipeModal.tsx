import React, { useState } from 'react';
import { X, CalendarDays, Check } from 'lucide-react';
import type { Recipe } from '../../types';
import {
  DAYS_OF_WEEK,
  MEAL_SLOTS,
  type DayOfWeek,
  type MealSlot,
  type WeeklyPlan,
} from './WeeklyMealPlanner';

interface PlanRecipeModalProps {
  recipe: Recipe;
  weeklyPlan: WeeklyPlan;
  onUpdatePlan: (plan: WeeklyPlan) => void;
  onClose: () => void;
  pushToast: (msg: string, tone?: 'error' | 'success') => void;
}

export const PlanRecipeModal: React.FC<PlanRecipeModalProps> = ({
  recipe,
  weeklyPlan,
  onUpdatePlan,
  onClose,
  pushToast,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(
    recipe.category === 'breakfast'
      ? 'breakfast'
      : recipe.category === 'snacks' || recipe.category === 'desserts'
      ? 'snack'
      : 'dinner'
  );

  const handleConfirm = () => {
    const updated: WeeklyPlan = {
      ...weeklyPlan,
      [selectedDay]: {
        ...(weeklyPlan[selectedDay] || {}),
        [selectedSlot]: { recipeId: recipe.id },
      },
    };
    onUpdatePlan(updated);
    pushToast(`Scheduled "${recipe.title}" for ${selectedDay} ${selectedSlot}! 🍲`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#161c24] text-white rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-heritage-gold-500/20 text-heritage-gold-400 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-white">Add to Weekly Meal Plan</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{recipe.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* 1. Day of Week Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-heritage-gold-400">
            Select Day of Week
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  selectedDay === day
                    ? 'bg-heritage-gold-500 text-heritage-green-950 border-heritage-gold-400 shadow-md'
                    : 'bg-[#1b222d] border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Meal Slot Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-heritage-gold-400">
            Select Meal Slot
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_SLOTS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSlot(key)}
                className={`p-3 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                  selectedSlot === key
                    ? 'bg-heritage-gold-500 text-heritage-green-950 border-heritage-gold-400 shadow-md'
                    : 'bg-[#1b222d] border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-heritage-gold-500 text-heritage-green-950 font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check size={16} strokeWidth={3} />
          <span>Schedule to {selectedDay} {selectedSlot}</span>
        </button>
      </div>
    </div>
  );
};
export default PlanRecipeModal;
