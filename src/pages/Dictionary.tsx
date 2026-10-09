import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, X, Mic, Heart, ArrowRight,
  BookOpen, MessageSquare, Quote, Leaf, Users, BookMarked,
  Feather, Search, Volume2, Pause,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent, canDelete } from '../lib/permissions';
import { AudioRecorder } from '../components/vault/AudioRecorder';
import type { LanguageEntry, LanguageEntryType } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onSelectMember: (id: string) => void;
}

// ── Category metadata ─────────────────────────────────────────────────────────

interface CategoryDef {
  key: LanguageEntryType | 'story';
  filterTypes: LanguageEntryType[];
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  badgeColor: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'word',
    filterTypes: ['word', 'expression'],
    label: 'Words',
    icon: <BookOpen size={20} />,
    iconColor: 'text-heritage-gold-700',
    badgeColor: 'bg-yellow-50 text-yellow-800',
  },
  {
    key: 'phrase',
    filterTypes: ['phrase', 'riddle'],
    label: 'Phrases',
    icon: <MessageSquare size={20} />,
    iconColor: 'text-blue-700',
    badgeColor: 'bg-blue-50 text-blue-800',
  },
  {
    key: 'saying',
    filterTypes: ['saying'],
    label: 'Family Sayings',
    icon: <Quote size={20} />,
    iconColor: 'text-amber-700',
    badgeColor: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'proverb',
    filterTypes: ['proverb'],
    label: 'Proverbs',
    icon: <BookMarked size={20} />,
    iconColor: 'text-heritage-bark-600',
    badgeColor: 'bg-heritage-bark-50 text-heritage-bark-700',
  },
  {
    key: 'expression',
    filterTypes: ['expression', 'elder_wisdom', 'story'],
    label: 'Cultural Expressions',
    icon: <Leaf size={20} />,
    iconColor: 'text-amber-900',
    badgeColor: 'bg-amber-50 text-amber-900',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryDef(entry: LanguageEntry): CategoryDef {
  return (
    CATEGORIES.find(c => c.filterTypes.includes(entry.entryType)) ?? CATEGORIES[CATEGORIES.length - 1]
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const Dictionary: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, addLanguageEntry, updateLanguageEntry, removeLanguageEntry, pushToast } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const canRemove = canDelete(currentProfile?.role);

  // Local likes (no backend field)
  const [likes, setLikes] = useState<Record<string, number>>({});

  // Detail modal
  const [selectedEntry, setSelectedEntry] = useState<LanguageEntry | null>(null);

  // Add wisdom modal
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<CategoryDef>(CATEGORIES[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formOriginal, setFormOriginal] = useState('');
  const [formContributor, setFormContributor] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formAudioBusy, setFormAudioBusy] = useState(false);

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikes(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const openAddForm = (cat: CategoryDef) => {
    setFormCategory(cat);
    setFormTitle('');
    setFormOriginal('');
    setFormMeaning('');
    setFormContext('');
    setFormAudioUrl('');
    setFormContributor('');
    setShowForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMeaning.trim()) return;
    const contributor = data.members.find(m => m.id === formContributor);
    addLanguageEntry({
      entryType: formCategory.filterTypes[0],
      term: formTitle.trim(),
      meaning: formMeaning.trim(),
      storyBehind: formContext.trim() || undefined,
      language: formOriginal.trim() || undefined,
      audioUrl: formAudioUrl.trim() || undefined,
      saidByMemberId: formContributor || undefined,
    });
    setShowForm(false);
    pushToast('Wisdom entry added to Heritage Vault 🎉');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this wisdom entry? This can't be undone.")) {
      removeLanguageEntry(id);
      setSelectedEntry(null);
    }
  };

  return (
    <div className="space-y-0">
      <>
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-white dark:bg-heritage-dark-card p-3 rounded-2xl shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key as string}
            onClick={() => {
              const el = document.getElementById(`vault-section-${cat.key as string}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border border-heritage-cream-300 dark:border-heritage-dark-border bg-heritage-cream-50 dark:bg-heritage-dark-hover hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-card ${cat.iconColor}`}
          >
            {cat.icon}
            <span className="text-heritage-green-800 dark:text-heritage-dark-text">{cat.label}</span>
          </button>
        ))}
        {canAdd && (
          <button
            onClick={() => openAddForm(CATEGORIES[0])}
            className="ml-auto flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-soft transition-colors shrink-0"
          >
            <Plus size={14} /> Add Wisdom
          </button>
        )}
      </div>

      {/* ── Category Sections ── */}
      <div className="space-y-10">
        {CATEGORIES.map(cat => {
          const entries = data.languageEntries.filter(e => cat.filterTypes.includes(e.entryType));
          return (
            <CategorySection
              key={cat.key as string}
              sectionId={`vault-section-${cat.key as string}`}
              cat={cat}
              entries={entries}
              members={data.members}
              likes={likes}
              canAdd={canAdd}
              canRemove={canRemove}
              onAdd={() => openAddForm(cat)}
              onView={setSelectedEntry}
              onToggleLike={toggleLike}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
      </>

      {/* ── Add Wisdom Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-heritage-dark-card rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-heritage-cream-200 dark:border-heritage-dark-border my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-heritage-dark-card py-2 z-10 border-b border-heritage-cream-100 dark:border-heritage-dark-border">
              <h3 className="text-xl font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text flex items-center gap-2">
                <Feather size={18} className="text-heritage-bark-600" /> Add Wisdom Item
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-heritage-green-500 hover:text-heritage-green-900 p-2 rounded-full hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {/* Title + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                    Title / Phrase
                  </label>
                  <input
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Agendi mũirĩru..."
                    className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory.key as string}
                    onChange={e => setFormCategory(CATEGORIES.find(c => c.key === e.target.value) ?? CATEGORIES[0])}
                    className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.key as string} value={c.key as string}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Original Language + Contributor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                    Original Language / Text
                  </label>
                  <input
                    value={formOriginal}
                    onChange={e => setFormOriginal(e.target.value)}
                    placeholder="e.g. Kĩmĩrũ / Native phrasing"
                    className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                    Contributor
                  </label>
                  <select
                    value={formContributor}
                    onChange={e => setFormContributor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text"
                  >
                    <option value="">— Select contributor —</option>
                    {data.members.map(m => (
                      <option key={m.id} value={m.id}>{fullName(m)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meaning */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                  English Translation & Meaning
                </label>
                <textarea
                  required
                  rows={3}
                  value={formMeaning}
                  onChange={e => setFormMeaning(e.target.value)}
                  placeholder="Explain the deeper meaning and translation..."
                  className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text resize-none"
                />
              </div>

              {/* Context */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                  Full Story / Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formContext}
                  onChange={e => setFormContext(e.target.value)}
                  placeholder="Provide background story, context, or lesson..."
                  className="w-full px-4 py-2.5 bg-heritage-cream-50 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-500 dark:text-heritage-dark-text resize-none"
                />
              </div>

              {/* Audio Recording */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted uppercase tracking-wider mb-1">
                  Voice Recording (Optional)
                </label>
                <AudioRecorder
                  value={formAudioUrl}
                  onChange={setFormAudioUrl}
                  label="Record how it's spoken"
                  onBusyChange={setFormAudioBusy}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-heritage-cream-100 dark:border-heritage-dark-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formAudioBusy}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-heritage-bark-600 hover:bg-heritage-bark-700 text-white shadow-soft transition-all disabled:opacity-50"
                >
                  Save Wisdom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedEntry && (
        <WisdomDetailModal
          entry={selectedEntry}
          members={data.members}
          likes={likes[selectedEntry.id] ?? 0}
          canRemove={canRemove}
          canAdd={canAdd}
          onClose={() => setSelectedEntry(null)}
          onDelete={() => handleDelete(selectedEntry.id)}
          onLike={() => toggleLike(selectedEntry.id)}
          onSelectMember={onSelectMember}
          onAudioSaved={(url) => {
            updateLanguageEntry(selectedEntry.id, { audioUrl: url });
            setSelectedEntry(prev => prev ? { ...prev, audioUrl: url } : null);
            pushToast('Voice recording saved');
          }}
        />
      )}
    </div>
  );
};

// ── CategorySection ───────────────────────────────────────────────────────────

interface CategorySectionProps {
  sectionId: string;
  cat: CategoryDef;
  entries: LanguageEntry[];
  members: ReturnType<typeof useApp>['data']['members'];
  likes: Record<string, number>;
  canAdd: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onView: (entry: LanguageEntry) => void;
  onToggleLike: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
}

function CategorySection({
  sectionId, cat, entries, members, likes, canAdd, canRemove,
  onAdd, onView, onToggleLike, onDelete,
}: CategorySectionProps) {
  return (
    <div id={sectionId} className="bg-white dark:bg-heritage-dark-card rounded-2xl p-6 sm:p-8 shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border space-y-6 scroll-mt-4">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-heritage-cream-100 dark:border-heritage-dark-border pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-heritage-cream-100 dark:bg-heritage-dark-hover flex items-center justify-center shadow-inner ${cat.iconColor}`}>
            {cat.icon}
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-heritage-green-900 dark:text-heritage-dark-text">
              {cat.label}
            </h3>
            <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted font-medium">
              {entries.length} Item{entries.length !== 1 ? 's' : ''} Added
            </p>
          </div>
        </div>
        {canAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted transition-all shadow-soft border border-heritage-cream-300 dark:border-heritage-dark-border"
          >
            <Plus size={13} /> Add Item
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="border-2 border-dashed border-heritage-cream-200 dark:border-heritage-dark-border rounded-2xl p-8 text-center bg-heritage-cream-50/50 dark:bg-heritage-dark-hover/30">
          <div className="w-12 h-12 rounded-full bg-heritage-cream-100 dark:bg-heritage-dark-hover mx-auto flex items-center justify-center text-heritage-green-500 dark:text-heritage-dark-muted mb-3">
            <Feather size={20} />
          </div>
          <h4 className="font-bold text-heritage-green-800 dark:text-heritage-dark-text text-sm">0 Items Added</h4>
          <p className="text-heritage-green-500 dark:text-heritage-dark-muted text-xs mt-1 max-w-sm mx-auto">
            Add the first item to {cat.label.toLowerCase()}
          </p>
          {canAdd && (
            <button
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 bg-heritage-bark-600 hover:bg-heritage-bark-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <Plus size={13} /> Add the first item to {cat.label.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map(entry => (
            <WisdomCard
              key={entry.id}
              entry={entry}
              members={members}
              likes={likes[entry.id] ?? 0}
              cat={cat}
              canRemove={canRemove}
              onView={() => onView(entry)}
              onLike={e => onToggleLike(entry.id, e)}
              onDelete={e => { e.stopPropagation(); onDelete(entry.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SpeakButton ───────────────────────────────────────────────────────────────

// Only one clip plays at a time across the whole vault.
let activeClip: HTMLAudioElement | null = null;

/** Small speaker button that plays/pauses one clip — sits next to the word. */
function SpeakButton({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      const a = new Audio(src);
      a.onended = () => setPlaying(false);
      a.onpause = () => setPlaying(false);
      a.onplay = () => setPlaying(true);
      audioRef.current = a;
    }
    const a = audioRef.current;
    if (a.paused) {
      if (activeClip && activeClip !== a) activeClip.pause();
      activeClip = a;
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pause pronunciation' : 'Play pronunciation'}
      title={playing ? 'Pause' : 'Listen'}
      className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        playing
          ? 'bg-heritage-green-800 text-heritage-gold-200'
          : 'bg-heritage-gold-100 text-heritage-gold-700 hover:bg-heritage-gold-200 dark:bg-heritage-dark-card dark:text-heritage-gold-400'
      }`}
    >
      {playing ? <Pause size={15} /> : <Volume2 size={15} />}
    </button>
  );
}

// ── WisdomCard ────────────────────────────────────────────────────────────────

interface WisdomCardProps {
  entry: LanguageEntry;
  members: ReturnType<typeof useApp>['data']['members'];
  likes: number;
  cat: CategoryDef;
  canRemove: boolean;
  onView: () => void;
  onLike: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function WisdomCard({ entry, members, likes, cat, canRemove, onView, onLike, onDelete }: WisdomCardProps) {
  const contributor = entry.saidByMemberId ? members.find(m => m.id === entry.saidByMemberId) : undefined;
  const { currentProfile, updateLanguageEntry, pushToast } = useApp();
  const canAddVoice = canAddContent(currentProfile?.role);
  const [recording, setRecording] = useState(false);

  return (
    <div
      onClick={onView}
      className="group bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-2xl p-6 border border-heritage-cream-200 dark:border-heritage-dark-border hover:border-heritage-bark-400 dark:hover:border-heritage-bark-600 transition-all duration-300 shadow-soft hover:shadow-soft-lg cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        {/* Category badge + likes */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${cat.badgeColor}`}>
            {cat.label}
          </span>
          <div className="flex items-center gap-2">
            {/* Likes */}
            <button
              onClick={onLike}
              className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted flex items-center gap-1 font-semibold hover:text-rose-500 transition-colors"
            >
              <Heart size={12} className="text-rose-500 fill-rose-500" /> {likes}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-2">
          <h4 className="flex-1 min-w-0 font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text text-lg group-hover:text-heritage-bark-600 dark:group-hover:text-heritage-bark-400 transition-colors line-clamp-2">
            {entry.term}
          </h4>
          {entry.audioUrl && <SpeakButton src={entry.audioUrl} />}
        </div>

        {/* Original text (language field) */}
        {entry.language && (
          <div className="text-xs italic font-serif text-heritage-green-800 dark:text-heritage-dark-muted bg-heritage-cream-100 dark:bg-heritage-dark-card/60 p-2.5 rounded-xl border-l-2 border-heritage-bark-400 line-clamp-2">
            "{entry.language}"
          </div>
        )}

        {/* Meaning */}
        <p className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted line-clamp-3 leading-relaxed">
          {entry.meaning}
        </p>

        {/* Voice: playback is the speaker next to the word; cards without a clip get a record option here */}
        {!entry.audioUrl && canAddVoice && (
          <div onClick={(e) => e.stopPropagation()}>
            {recording ? (
              <div className="space-y-2">
                <AudioRecorder
                  label="Record the pronunciation"
                  maxSeconds={60}
                  onChange={(url) => {
                    if (!url) return;
                    updateLanguageEntry(entry.id, { audioUrl: url });
                    pushToast('Voice recording saved');
                    setRecording(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setRecording(false)}
                  className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRecording(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-heritage-bark-400 text-heritage-bark-600 dark:text-heritage-bark-400 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-card transition-colors"
              >
                <Mic size={13} /> Add voice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border text-xs">
        <span className="text-heritage-green-600 dark:text-heritage-dark-muted italic truncate max-w-[60%]">
          {contributor ? `By ${fullName(contributor)}` : ''}
        </span>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={onDelete}
              className="text-heritage-green-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
          <span className="text-heritage-bark-600 dark:text-heritage-bark-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            Read <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── WisdomDetailModal ─────────────────────────────────────────────────────────

interface WisdomDetailModalProps {
  entry: LanguageEntry;
  members: ReturnType<typeof useApp>['data']['members'];
  likes: number;
  canRemove: boolean;
  canAdd: boolean;
  onClose: () => void;
  onDelete: () => void;
  onLike: () => void;
  onSelectMember: (id: string) => void;
  onAudioSaved: (url: string) => void;
}

function WisdomDetailModal({
  entry, members, likes, canRemove, canAdd,
  onClose, onDelete, onLike, onSelectMember, onAudioSaved,
}: WisdomDetailModalProps) {
  const cat = categoryDef(entry);
  const contributor = entry.saidByMemberId ? members.find(m => m.id === entry.saidByMemberId) : undefined;
  const [showAudioEdit, setShowAudioEdit] = useState(false);
  const [pendingAudio, setPendingAudio] = useState(entry.audioUrl ?? '');
  const [audioBusy, setAudioBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-heritage-dark-card rounded-2xl shadow-2xl border border-heritage-cream-200 dark:border-heritage-dark-border my-8 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Scrollable body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow">
          {/* Header row */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-2 shadow-soft ${
                cat.iconColor.includes('bark') ? 'bg-heritage-bark-600' :
                cat.iconColor.includes('amber-700') ? 'bg-amber-600' :
                cat.iconColor.includes('green') ? 'bg-heritage-green-700' :
                cat.iconColor.includes('blue') ? 'bg-blue-700' :
                'bg-amber-800'
              }`}>
                {cat.label}
              </span>
              <h3 className="text-2xl font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text">
                {entry.term}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-heritage-green-500 hover:text-heritage-green-900 p-2 rounded-full hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Original text box */}
          {entry.language && (
            <div className="bg-heritage-cream-100/70 dark:bg-heritage-dark-hover p-4 rounded-2xl border-l-4 border-heritage-bark-400 italic text-heritage-green-900 dark:text-heritage-dark-text text-sm font-serif">
              "{entry.language}"
            </div>
          )}

          {/* Meaning */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-heritage-green-600 dark:text-heritage-dark-muted">
              Meaning & Translation
            </h4>
            <p className="text-heritage-green-800 dark:text-heritage-dark-text text-sm leading-relaxed bg-heritage-cream-50 dark:bg-heritage-dark-hover p-4 rounded-2xl border border-heritage-cream-100 dark:border-heritage-dark-border">
              {entry.meaning}
            </p>
          </div>

          {/* Context / Story */}
          {entry.storyBehind && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-heritage-green-600 dark:text-heritage-dark-muted">
                Historical Context & Lesson
              </h4>
              <p className="text-heritage-green-800 dark:text-heritage-dark-text text-sm leading-relaxed bg-heritage-cream-50 dark:bg-heritage-dark-hover p-4 rounded-2xl border border-heritage-cream-100 dark:border-heritage-dark-border">
                {entry.storyBehind}
              </p>
            </div>
          )}

          {/* Audio section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-heritage-green-600 dark:text-heritage-dark-muted flex items-center gap-1.5">
              <Mic size={13} /> Voice Recording
            </h4>

            {entry.audioUrl && !showAudioEdit && (
              <div className="space-y-2">
                <audio controls src={entry.audioUrl} className="w-full h-9 rounded-lg" />
                {canAdd && (
                  <button
                    onClick={() => { setPendingAudio(entry.audioUrl ?? ''); setShowAudioEdit(true); }}
                    className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text underline"
                  >
                    Replace recording
                  </button>
                )}
              </div>
            )}

            {!entry.audioUrl && !showAudioEdit && canAdd && (
              <button
                onClick={() => { setPendingAudio(''); setShowAudioEdit(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-200 dark:border-heritage-dark-border transition-all"
              >
                <Mic size={13} /> Add voice recording
              </button>
            )}

            {!entry.audioUrl && !showAudioEdit && !canAdd && (
              <p className="text-xs text-heritage-green-400 dark:text-heritage-dark-muted italic">No recording yet.</p>
            )}

            {showAudioEdit && (
              <div className="space-y-3">
                <AudioRecorder
                  value={pendingAudio}
                  onChange={setPendingAudio}
                  label="Record how it's spoken"
                  onBusyChange={setAudioBusy}
                />
                <div className="flex gap-2">
                  <button
                    disabled={audioBusy}
                    onClick={() => { onAudioSaved(pendingAudio); setShowAudioEdit(false); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-heritage-green-800 hover:bg-heritage-green-700 text-white transition-all disabled:opacity-50"
                  >
                    Save Recording
                  </button>
                  <button
                    onClick={() => setShowAudioEdit(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 text-heritage-green-700 dark:text-heritage-dark-muted transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer: contributor + likes */}
          <div className="flex items-center justify-between pt-4 border-t border-heritage-cream-100 dark:border-heritage-dark-border text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
            <span>
              Contributed by:{' '}
              {contributor ? (
                <button
                  onClick={() => { onClose(); onSelectMember(contributor.id); }}
                  className="font-semibold text-heritage-green-900 dark:text-heritage-dark-text hover:underline"
                >
                  {fullName(contributor)}
                </button>
              ) : (
                <strong className="text-heritage-green-900 dark:text-heritage-dark-text font-semibold">Family</strong>
              )}
            </span>
            <button
              onClick={onLike}
              className="px-3 py-1.5 rounded-xl bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text font-semibold transition-all flex items-center gap-1.5 border border-heritage-cream-200 dark:border-heritage-dark-border"
            >
              <Heart size={12} className="text-rose-500 fill-rose-500" />
              {likes} Like{likes !== 1 ? 's' : ''}
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
