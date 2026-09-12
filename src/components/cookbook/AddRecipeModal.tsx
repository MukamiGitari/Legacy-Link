import React, { useState } from 'react';
import { X, Star, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fullName } from '../../lib/lineage';
import type { RecipeCategory } from '../../types';

const CATEGORY_OPTIONS: { key: RecipeCategory; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'main', label: 'Main meals' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'desserts', label: 'Desserts' },
];

interface Props {
  albumId: string;
  onClose: () => void;
  /** When adding a recipe from inside an already-open category, lock the section to it. */
  initialCategory?: RecipeCategory;
}

export const AddRecipeModal: React.FC<Props> = ({ albumId, onClose, initialCategory }) => {
  const { data, addRecipe } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecipeCategory>(initialCategory ?? 'main');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [familyStory, setFamilyStory] = useState('');
  const [contributedByMemberId, setContributedByMemberId] = useState('');

  const inputCls = "w-full rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400";
  const labelCls = "block text-xs font-medium text-heritage-green-700 dark:text-heritage-dark-muted mb-1";

  const handlePhotoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoUrl(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const ingredients = ingredientsText.split('\n').map(s => s.trim()).filter(Boolean);
    const instructions = instructionsText.split('\n').map(s => s.trim()).filter(Boolean);
    addRecipe({
      albumId,
      title: title.trim(),
      category,
      isVegetarian,
      photoUrl: photoUrl || undefined,
      ingredients,
      instructions,
      cookTime: cookTime.trim() || undefined,
      familyStory: familyStory.trim() || undefined,
      contributedByMemberId: contributedByMemberId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-white dark:bg-heritage-dark-card rounded-2xl shadow-soft-lg"
      >
        <div className="sticky top-0 bg-white dark:bg-heritage-dark-card flex items-center justify-between px-6 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border z-10">
          <h2 className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">Add Recipe</h2>
          <button type="button" onClick={onClose} className="text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Food photo</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-heritage-cream-200 flex items-center justify-center border border-heritage-cream-400 dark:border-heritage-dark-border shrink-0">
                {photoPreview
                  ? <img src={photoPreview} className="w-full h-full object-cover" alt="" />
                  : <span className="text-2xl">🍽️</span>}
              </div>
              <span className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
                {photoPreview ? 'Photo selected' : 'Optional — choose a photo of the finished dish'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoFile(e.target.files?.[0])} />
            </label>
          </div>

          <div>
            <label className={labelCls}>Recipe title *</label>
            <input required className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Naomi's Mandazi" />
          </div>

          <div>
            <label className={labelCls}>Section</label>
            {initialCategory ? (
              <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full bg-heritage-green-800 text-white">
                {CATEGORY_OPTIONS.find(c => c.key === initialCategory)?.label}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(c => (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                      ${category === c.key
                        ? 'bg-heritage-green-800 border-heritage-green-800 text-white'
                        : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsVegetarian(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${isVegetarian
                  ? 'bg-heritage-gold-500 border-heritage-gold-500 text-white'
                  : 'bg-white dark:bg-heritage-dark-hover border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted hover:border-heritage-green-500'
                }`}
              aria-pressed={isVegetarian}
            >
              <Star size={13} fill={isVegetarian ? 'currentColor' : 'none'} /> Vegetarian
            </button>
          </div>

          <div>
            <label className={labelCls}>Cook time</label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-heritage-green-400" />
              <input
                className={`${inputCls} pl-8`}
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                placeholder="e.g. 45 min, or 1 hr 30 min"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ingredients (one per line) *</label>
            <textarea required rows={5} className={inputCls} value={ingredientsText} onChange={e => setIngredientsText(e.target.value)}
              placeholder={'3 cups flour\n1 cup sugar\n2 eggs'} />
          </div>

          <div>
            <label className={labelCls}>Instructions (one step per line) *</label>
            <textarea required rows={5} className={inputCls} value={instructionsText} onChange={e => setInstructionsText(e.target.value)}
              placeholder={'Mix the dry ingredients together.\nFold in the eggs.\nBake at 180°C for 30 minutes.'} />
          </div>

          <div>
            <label className={labelCls}>Contributed by (optional)</label>
            <select className={inputCls} value={contributedByMemberId} onChange={e => setContributedByMemberId(e.target.value)}>
              <option value="">Unattributed</option>
              {data.members.map(m => (
                <option key={m.id} value={m.id}>{fullName(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Family story (optional)</label>
            <textarea rows={4} className={inputCls} value={familyStory} onChange={e => setFamilyStory(e.target.value)}
              placeholder="Who made this, when, and why it matters to the family..." />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
          <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium">Add recipe</button>
        </div>
      </form>
    </div>
  );
};
