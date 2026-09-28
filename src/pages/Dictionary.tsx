import React, { useState, useMemo } from 'react';
import {
  Plus, Languages, Trash2, Pencil, Check, X, Mic, Volume2,
  Leaf, MessageSquare, Users, BookOpen, Sun, Search, ArrowRight,
  ChevronRight, Heart, Share2, Sparkles, Quote, MapPin, Calendar,
  VolumeX, TreePine, BookmarkCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { AudioRecorder } from '../components/vault/AudioRecorder';
import type { LanguageEntry, LanguageEntryType } from '../types';

interface Props {
  onSelectMember: (id: string) => void;
}

export type VaultCategoryFilter =
  | 'all'
  | 'proverb'
  | 'saying'
  | 'elder_wisdom'
  | 'story'
  | 'expression'
  | 'audio_only';

const CATEGORY_HUBS = [
  {
    key: 'proverb' as const,
    title: 'Proverbs',
    subtitle: "Timeless wisdom for life's journey.",
    icon: Leaf,
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    iconBg: 'bg-emerald-700 text-white',
    badgeText: 'PROVERB',
  },
  {
    key: 'saying' as const,
    title: 'Sayings',
    subtitle: 'Unique expressions from our family.',
    icon: MessageSquare,
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    iconBg: 'bg-amber-700 text-white',
    badgeText: 'SAYING',
  },
  {
    key: 'elder_wisdom' as const,
    title: 'Words of Elders',
    subtitle: 'Advice, blessings and guidance.',
    icon: Users,
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
    iconBg: 'bg-teal-800 text-white',
    badgeText: 'WORDS OF ELDERS',
  },
  {
    key: 'story' as const,
    title: 'Stories & Lessons',
    subtitle: 'Real stories behind the words.',
    icon: BookOpen,
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
    iconBg: 'bg-orange-700 text-white',
    badgeText: 'STORY',
  },
  {
    key: 'expression' as const,
    title: 'Cultural Expressions',
    subtitle: 'Our heritage, our language.',
    icon: Sun,
    badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
    iconBg: 'bg-heritage-gold-600 text-white',
    badgeText: 'CULTURAL EXPRESSION',
  },
];

const getEntryBadge = (type: LanguageEntryType) => {
  switch (type) {
    case 'proverb':
      return { label: 'PROVERB', bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' };
    case 'saying':
      return { label: 'SAYING', bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' };
    case 'elder_wisdom':
      return { label: 'WORDS OF ELDERS', bg: 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300' };
    case 'story':
      return { label: 'STORY', bg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300' };
    case 'expression':
    case 'word':
    case 'phrase':
      return { label: 'CULTURAL EXPRESSION', bg: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300' };
    case 'riddle':
      return { label: 'RIDDLE', bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' };
    case 'recording':
      return { label: 'VOICE RECORDING', bg: 'bg-heritage-gold-100 dark:bg-heritage-gold-950/40 text-heritage-gold-800 dark:text-heritage-gold-300' };
    default:
      return { label: 'WISDOM', bg: 'bg-heritage-green-100 text-heritage-green-800' };
  }
};

const matchesCategory = (entry: LanguageEntry, cat: VaultCategoryFilter): boolean => {
  if (cat === 'all') return true;
  if (cat === 'audio_only') return Boolean(entry.audioUrl);
  if (cat === 'proverb') return entry.entryType === 'proverb';
  if (cat === 'saying') return entry.entryType === 'saying';
  if (cat === 'elder_wisdom') return entry.entryType === 'elder_wisdom';
  if (cat === 'story') return entry.entryType === 'story';
  if (cat === 'expression') {
    return (
      entry.entryType === 'expression' ||
      entry.entryType === 'word' ||
      entry.entryType === 'phrase' ||
      entry.entryType === 'riddle'
    );
  }
  return true;
};

export const Dictionary: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, addLanguageEntry, updateLanguageEntry, removeLanguageEntry, pushToast } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const isAdmin = currentProfile?.role === 'super_admin' || currentProfile?.role === 'family_admin';

  // Filters and search
  const [filter, setFilter] = useState<VaultCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<LanguageEntry | null>(null);
  const [detailTab, setDetailTab] = useState<'meaning' | 'story' | 'related'>('meaning');
  const [savedFavorites, setSavedFavorites] = useState<Set<string>>(() => new Set());

  // Form modal / drawer
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<LanguageEntryType>('proverb');
  const [formTerm, setFormTerm] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formStoryBehind, setFormStoryBehind] = useState('');
  const [formLanguage, setFormLanguage] = useState('Kikuyu');
  const [formCategory, setFormCategory] = useState('Family Wisdom');
  const [formYear, setFormYear] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSaidBy, setFormSaidBy] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editStoryBehind, setEditStoryBehind] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');

  // Audio recording state
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioEditId, setAudioEditId] = useState<string | null>(null);
  const [pendingAudio, setPendingAudio] = useState('');

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        pushToast('Removed from your saved collection');
      } else {
        next.add(id);
        pushToast('Saved to your collection ❤️');
      }
      return next;
    });
  };

  const handleShare = (entry: LanguageEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareText = `"${entry.term}" — ${entry.meaning} (${entry.language || 'Family Wisdom'})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      pushToast('Quote copied to clipboard! 📋');
    }
  };

  const audioLabel = (type: LanguageEntryType) =>
    type === 'word' ? 'Record pronunciation'
    : type === 'recording' ? 'Voice recording'
    : "Record how it's spoken";

  const startAudioEdit = (id: string, current?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAudioEditId(id);
    setPendingAudio(current ?? '');
  };

  const saveAudioEdit = (id: string) => {
    updateLanguageEntry(id, { audioUrl: pendingAudio });
    setAudioEditId(null);
    if (selectedEntry && selectedEntry.id === id) {
      setSelectedEntry(prev => prev ? { ...prev, audioUrl: pendingAudio } : null);
    }
    pushToast('Voice recording saved successfully');
  };

  const startEdit = (entry: LanguageEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(entry.id);
    setEditTerm(entry.term);
    setEditMeaning(entry.meaning);
    setEditAnswer(entry.answer ?? '');
    setEditStoryBehind(entry.storyBehind ?? '');
    setEditLanguage(entry.language ?? '');
    setEditCategory(entry.category ?? '');
    setEditYear(entry.yearRecorded ?? '');
    setEditLocation(entry.location ?? '');
    setEditAudioUrl(entry.audioUrl ?? '');
  };

  const saveEdit = (id: string, hasAnswer: boolean) => {
    if (!editTerm.trim() || !editMeaning.trim()) return;
    updateLanguageEntry(id, {
      term: editTerm.trim(),
      meaning: editMeaning.trim(),
      answer: hasAnswer && editAnswer.trim() ? editAnswer.trim() : undefined,
      storyBehind: editStoryBehind.trim() || undefined,
      language: editLanguage.trim() || undefined,
      category: editCategory.trim() || undefined,
      yearRecorded: editYear.trim() || undefined,
      location: editLocation.trim() || undefined,
      audioUrl: editAudioUrl.trim() || undefined,
    });
    if (selectedEntry && selectedEntry.id === id) {
      setSelectedEntry(prev =>
        prev
          ? {
              ...prev,
              term: editTerm.trim(),
              meaning: editMeaning.trim(),
              answer: hasAnswer && editAnswer.trim() ? editAnswer.trim() : undefined,
              storyBehind: editStoryBehind.trim() || undefined,
              language: editLanguage.trim() || undefined,
              category: editCategory.trim() || undefined,
              yearRecorded: editYear.trim() || undefined,
              location: editLocation.trim() || undefined,
              audioUrl: editAudioUrl.trim() || undefined,
            }
          : null
      );
    }
    setEditingId(null);
    pushToast('Heritage entry updated');
  };

  const submitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm.trim() || !formMeaning.trim()) return;
    addLanguageEntry({
      entryType: formType,
      term: formTerm.trim(),
      meaning: formMeaning.trim(),
      answer: formType === 'riddle' && formAnswer.trim() ? formAnswer.trim() : undefined,
      storyBehind: formStoryBehind.trim() || undefined,
      language: formLanguage.trim() || undefined,
      category: formCategory.trim() || undefined,
      yearRecorded: formYear.trim() || undefined,
      location: formLocation.trim() || undefined,
      saidByMemberId: formSaidBy || undefined,
      audioUrl: formAudioUrl.trim() || undefined,
    });
    setFormTerm('');
    setFormMeaning('');
    setFormAnswer('');
    setFormStoryBehind('');
    setFormYear('');
    setFormLocation('');
    setFormSaidBy('');
    setFormAudioUrl('');
    setShowForm(false);
    pushToast('Wisdom entry added to Heritage Vault 🎉');
  };

  // Filtered and searched entries
  const allEntries = useMemo(() => {
    return [...data.languageEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.languageEntries]);

  // Find featured quote (or default to the first saying/proverb)
  const featuredQuote = useMemo(() => {
    return (
      allEntries.find(e => e.id === 'lang_featured' || e.term.includes('A tree does not forget')) ||
      allEntries.find(e => e.entryType === 'saying' || e.entryType === 'proverb') ||
      allEntries[0]
    );
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const matchCat = matchesCategory(entry, filter);
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const speaker = entry.saidByMemberId ? data.members.find(m => m.id === entry.saidByMemberId) : null;
      const speakerName = speaker ? fullName(speaker).toLowerCase() : '';

      return (
        entry.term.toLowerCase().includes(q) ||
        entry.meaning.toLowerCase().includes(q) ||
        (entry.storyBehind && entry.storyBehind.toLowerCase().includes(q)) ||
        (entry.language && entry.language.toLowerCase().includes(q)) ||
        (entry.category && entry.category.toLowerCase().includes(q)) ||
        speakerName.includes(q)
      );
    });
  }, [allEntries, filter, searchQuery, data.members]);

  // Related quotes for the detail view
  const relatedQuotes = useMemo(() => {
    if (!selectedEntry) return [];
    return allEntries
      .filter(e => e.id !== selectedEntry.id && (e.entryType === selectedEntry.entryType || e.language === selectedEntry.language))
      .slice(0, 3);
  }, [allEntries, selectedEntry]);

  const scrollToCollection = (catKey: VaultCategoryFilter) => {
    setFilter(catKey);
    const el = document.getElementById('heritage-collection-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 1. TOP HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-heritage-green-950 via-heritage-green-900 to-heritage-green-800 text-white shadow-xl p-6 sm:p-10 border border-heritage-green-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-heritage-gold-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-10 opacity-10 pointer-events-none">
          <TreePine size={220} className="text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-heritage-gold-400" />
            <span className="text-xs font-bold tracking-widest text-heritage-gold-400 uppercase">
              OUR FAMILY WISDOM
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Heritage Vault
          </h1>

          <p className="text-heritage-cream-100 text-base sm:text-lg leading-relaxed max-w-2xl">
            Words, sayings and proverbs passed down through generations.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-heritage-cream-300 font-medium">
            <span className="bg-heritage-green-800/80 px-2.5 py-1 rounded-full border border-heritage-green-600/40">Proverbs</span>
            <span>•</span>
            <span className="bg-heritage-green-800/80 px-2.5 py-1 rounded-full border border-heritage-green-600/40">Sayings</span>
            <span>•</span>
            <span className="bg-heritage-green-800/80 px-2.5 py-1 rounded-full border border-heritage-green-600/40">Words of Elders</span>
            <span>•</span>
            <span className="bg-heritage-green-800/80 px-2.5 py-1 rounded-full border border-heritage-green-600/40">Stories & Lessons</span>
            <span>•</span>
            <span className="bg-heritage-green-800/80 px-2.5 py-1 rounded-full border border-heritage-green-600/40">Cultural Expressions</span>
          </div>

          {canAdd && (
            <div className="pt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-heritage-gold-500 hover:bg-heritage-gold-400 text-heritage-green-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Plus size={18} /> Add Wisdom to Vault
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. FEATURED HERO QUOTE CARD */}
      {featuredQuote && (
        <div className="relative overflow-hidden rounded-2xl border border-heritage-gold-300/80 dark:border-heritage-dark-border bg-gradient-to-r from-heritage-cream-100 via-white to-heritage-cream-50 dark:from-heritage-dark-card dark:to-heritage-dark-hover p-6 sm:p-8 shadow-sm">
          <div className="absolute right-4 bottom-2 opacity-10 text-heritage-gold-600 pointer-events-none">
            <TreePine size={180} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-3xl">
              <Quote size={48} className="text-heritage-gold-500 shrink-0 mt-1 opacity-80" />
              <div className="space-y-3">
                <blockquote className="font-serif text-2xl sm:text-3xl font-bold text-heritage-green-950 dark:text-heritage-dark-text leading-snug">
                  "{featuredQuote.term}"
                </blockquote>

                <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-muted leading-relaxed">
                  — {featuredQuote.language || 'Family Wisdom'} • {featuredQuote.meaning}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-heritage-green-700 dark:text-heritage-dark-muted pt-1">
                  {featuredQuote.saidByMemberId && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users size={14} className="text-heritage-gold-600" />
                      <span>
                        Shared by:{' '}
                        {fullName(data.members.find(m => m.id === featuredQuote.saidByMemberId) ?? { firstName: 'Family', lastName: 'Elder' } as any)}
                      </span>
                    </div>
                  )}
                  {featuredQuote.yearRecorded && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-heritage-gold-600" />
                      <span>Recorded: {featuredQuote.yearRecorded}</span>
                    </div>
                  )}
                  {featuredQuote.category && (
                    <div className="flex items-center gap-1.5">
                      <Leaf size={14} className="text-heritage-gold-600" />
                      <span>Category: {featuredQuote.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEntry(featuredQuote)}
              className="shrink-0 flex items-center gap-2 bg-heritage-green-900 hover:bg-heritage-green-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow transition-colors cursor-pointer"
            >
              <span>View Full Story</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 3. EXPLORE OUR HERITAGE VAULT (5 CATEGORY CARDS) */}
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px bg-heritage-cream-300 dark:bg-heritage-dark-border flex-1 max-w-xs" />
          <div className="flex items-center gap-2 text-heritage-green-900 dark:text-heritage-dark-text font-serif text-xl sm:text-2xl font-bold">
            <Leaf size={20} className="text-heritage-gold-500" />
            <h2>Explore Our Heritage Vault</h2>
            <Leaf size={20} className="text-heritage-gold-500 transform scale-x-[-1]" />
          </div>
          <div className="h-px bg-heritage-cream-300 dark:bg-heritage-dark-border flex-1 max-w-xs" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_HUBS.map(hub => {
            const Icon = hub.icon;
            const count = allEntries.filter(e => matchesCategory(e, hub.key)).length;
            const isActive = filter === hub.key;
            return (
              <div
                key={hub.key}
                onClick={() => scrollToCollection(hub.key)}
                className={`group rounded-2xl border transition-all p-5 flex flex-col justify-between items-center text-center cursor-pointer shadow-xs hover:shadow-md ${
                  isActive
                    ? 'border-heritage-gold-500 bg-heritage-gold-50/70 dark:bg-heritage-gold-950/30 ring-2 ring-heritage-gold-400'
                    : 'border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card hover:border-heritage-gold-400'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-xs transition-transform group-hover:scale-110 ${hub.iconBg}`}>
                  <Icon size={22} />
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-heritage-green-900 dark:text-heritage-dark-text">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted line-clamp-2">
                    {hub.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border/50 w-full flex items-center justify-center gap-1 text-xs font-semibold text-heritage-green-800 dark:text-heritage-gold-400 group-hover:text-heritage-gold-600">
                  <span>View All ({count})</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. HERITAGE VAULT COLLECTION & BROWSE SECTION */}
      <div id="heritage-collection-section" className="space-y-6 pt-4">
        {/* Banner with Filter & Search */}
        <div className="rounded-2xl bg-heritage-cream-100/90 dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-heritage-green-950 dark:text-heritage-dark-text">
                Heritage Collection
              </h3>
              <p className="text-xs sm:text-sm text-heritage-green-700 dark:text-heritage-dark-muted">
                Explore our collection of proverbs, sayings and family wisdom ({filteredEntries.length} items)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-heritage-green-600 dark:text-heritage-dark-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search proverbs, sayings, speakers..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-hover text-heritage-green-950 dark:text-heritage-dark-text focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-heritage-green-400 hover:text-heritage-green-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'all'
                  ? 'bg-heritage-green-900 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              All ({allEntries.length})
            </button>

            <button
              onClick={() => setFilter('proverb')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'proverb'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              <Leaf size={13} /> Proverbs
            </button>

            <button
              onClick={() => setFilter('saying')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'saying'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              <MessageSquare size={13} /> Sayings
            </button>

            <button
              onClick={() => setFilter('elder_wisdom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'elder_wisdom'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              <Users size={13} /> Words of Elders
            </button>

            <button
              onClick={() => setFilter('story')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'story'
                  ? 'bg-orange-800 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              <BookOpen size={13} /> Stories
            </button>

            <button
              onClick={() => setFilter('expression')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === 'expression'
                  ? 'bg-heritage-gold-600 text-white shadow-xs'
                  : 'bg-white dark:bg-heritage-dark-hover text-heritage-green-800 dark:text-heritage-dark-muted border border-heritage-cream-300 dark:border-heritage-dark-border hover:bg-heritage-cream-200'
              }`}
            >
              <Sun size={13} /> Cultural Expressions
            </button>

            <button
              onClick={() => setFilter('audio_only')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ml-auto ${
                filter === 'audio_only'
                  ? 'bg-heritage-gold-700 text-white shadow-xs'
                  : 'bg-heritage-gold-50 dark:bg-heritage-gold-950/30 text-heritage-gold-800 dark:text-heritage-gold-300 border border-heritage-gold-300 dark:border-heritage-gold-800/50'
              }`}
            >
              <Mic size={13} /> With Audio
            </button>
          </div>
        </div>

        {/* 2-COLUMN COLLECTION GRID */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border p-12 text-center space-y-3 bg-heritage-cream-50/50 dark:bg-heritage-dark-card/50">
            <Languages size={36} className="mx-auto text-heritage-green-400" />
            <h4 className="font-serif text-lg font-semibold text-heritage-green-900 dark:text-heritage-dark-text">
              No entries found
            </h4>
            <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted max-w-sm mx-auto">
              No wisdom or language entries matched your search filter. Try resetting the filters or add a new entry.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-heritage-gold-600 underline cursor-pointer"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEntries.map(entry => {
              const badge = getEntryBadge(entry.entryType);
              const saidBy = entry.saidByMemberId
                ? data.members.find(m => m.id === entry.saidByMemberId)
                : null;
              const isFav = savedFavorites.has(entry.id);
              const isEditing = editingId === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => !isEditing && setSelectedEntry(entry)}
                  className={`group rounded-2xl border transition-all p-5 flex flex-col justify-between relative bg-white dark:bg-heritage-dark-card hover:border-heritage-gold-400 hover:shadow-md cursor-pointer ${
                    isFav
                      ? 'border-heritage-gold-300 dark:border-heritage-gold-900/50'
                      : 'border-heritage-cream-300 dark:border-heritage-dark-border'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top row: Badge & Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${badge.bg}`}>
                        {badge.label}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={e => toggleFavorite(entry.id, e)}
                          title={isFav ? 'Remove favorite' : 'Save to favorites'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav
                              ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
                              : 'text-heritage-green-400 hover:text-red-500 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
                          }`}
                        >
                          <Heart size={14} className={isFav ? 'fill-current' : ''} />
                        </button>

                        <button
                          type="button"
                          onClick={e => handleShare(entry, e)}
                          title="Share quote"
                          className="p-1.5 rounded-lg text-heritage-green-400 hover:text-heritage-green-800 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors cursor-pointer"
                        >
                          <Share2 size={14} />
                        </button>

                        {canAdd && !isEditing && (
                          <button
                            type="button"
                            onClick={e => startEdit(entry, e)}
                            title="Edit entry"
                            className="p-1.5 rounded-lg text-heritage-green-400 hover:text-heritage-green-800 hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Term / Quote */}
                    {isEditing ? (
                      <div className="space-y-3 pt-2" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editTerm}
                          onChange={e => setEditTerm(e.target.value)}
                          className="w-full font-serif text-lg rounded-lg border border-heritage-gold-400 dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-1.5 focus:outline-hidden"
                          placeholder="Term / Quote"
                        />
                        <textarea
                          value={editMeaning}
                          onChange={e => setEditMeaning(e.target.value)}
                          rows={2}
                          className="w-full text-xs rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2"
                          placeholder="Meaning / Translation"
                        />
                        <textarea
                          value={editStoryBehind}
                          onChange={e => setEditStoryBehind(e.target.value)}
                          rows={2}
                          className="w-full text-xs rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2"
                          placeholder="Story or context behind the words..."
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={editLanguage}
                            onChange={e => setEditLanguage(e.target.value)}
                            placeholder="Language (e.g. Kikuyu, Swahili)"
                            className="text-xs rounded-lg border border-heritage-cream-400 px-2.5 py-1.5 dark:bg-heritage-dark-hover"
                          />
                          <input
                            value={editYear}
                            onChange={e => setEditYear(e.target.value)}
                            placeholder="Year recorded (e.g. 1965)"
                            className="text-xs rounded-lg border border-heritage-cream-400 px-2.5 py-1.5 dark:bg-heritage-dark-hover"
                          />
                        </div>
                        <AudioRecorder
                          value={editAudioUrl}
                          onChange={setEditAudioUrl}
                          onBusyChange={setAudioBusy}
                          label={audioLabel(entry.entryType)}
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(entry.id, entry.entryType === 'riddle')}
                            disabled={audioBusy}
                            className="px-3 py-1 text-xs rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-serif text-lg font-bold text-heritage-green-950 dark:text-heritage-dark-text leading-snug group-hover:text-heritage-green-800 dark:group-hover:text-heritage-gold-300 transition-colors">
                          "{entry.term}"
                        </h4>

                        <p className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted leading-relaxed line-clamp-2">
                          {entry.meaning}
                        </p>

                        {entry.language && (
                          <span className="inline-block text-[11px] font-medium text-heritage-gold-700 dark:text-heritage-gold-400">
                            {entry.language}
                          </span>
                        )}

                        {/* Audio Player Widget if clip exists */}
                        {entry.audioUrl && (
                          <div
                            className="bg-heritage-cream-100/80 dark:bg-heritage-dark-hover/80 rounded-lg p-2 flex items-center gap-2.5 border border-heritage-cream-300 dark:border-heritage-dark-border"
                            onClick={e => e.stopPropagation()}
                          >
                            <Volume2 size={16} className="text-heritage-gold-600 shrink-0" />
                            <audio controls src={entry.audioUrl} className="w-full h-7 rounded-sm" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Card Footer */}
                  {!isEditing && (
                    <div className="mt-4 pt-3 border-t border-heritage-cream-200 dark:border-heritage-dark-border/50 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-heritage-green-600 dark:text-heritage-dark-muted truncate">
                        {saidBy ? (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onSelectMember(saidBy.id);
                            }}
                            className="flex items-center gap-1.5 hover:underline font-medium text-heritage-green-800 dark:text-heritage-dark-text truncate cursor-pointer"
                          >
                            <img
                              src={saidBy.avatarUrl}
                              alt=""
                              className="w-4 h-4 rounded-full bg-heritage-cream-300 shrink-0"
                            />
                            <span className="truncate">{fullName(saidBy)}</span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-heritage-green-500 dark:text-heritage-dark-muted truncate">
                            <Users size={12} /> Family Lineage
                          </span>
                        )}
                        {entry.yearRecorded && <span>• {entry.yearRecorded}</span>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(isAdmin || entry.contributedByProfileId === currentProfile?.id) && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm(`Remove "${entry.term}" from the Heritage Vault?`)) {
                                removeLanguageEntry(entry.id);
                              }
                            }}
                            title="Remove entry"
                            className="p-1 text-heritage-green-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        <div className="w-6 h-6 rounded-full bg-heritage-gold-500/10 dark:bg-heritage-gold-500/20 text-heritage-gold-700 dark:text-heritage-gold-400 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE DETAIL VIEW MODAL (BOTTOM-LEFT SCREEN DESIGN) */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Breadcrumb */}
            <div className="px-6 py-4 bg-heritage-cream-100/80 dark:bg-heritage-dark-hover border-b border-heritage-cream-300 dark:border-heritage-dark-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-heritage-green-700 dark:text-heritage-dark-muted font-medium truncate">
                <span className="hover:underline cursor-pointer" onClick={() => setSelectedEntry(null)}>
                  Heritage Vault
                </span>
                <ChevronRight size={13} />
                <span className="capitalize">{getEntryBadge(selectedEntry.entryType).label}</span>
                <ChevronRight size={13} />
                <span className="text-heritage-green-950 dark:text-heritage-dark-text font-bold truncate">
                  "{selectedEntry.term}"
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-lg text-heritage-green-600 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Top Hero Section of Detail View */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left Visual Illustration Box */}
                <div className="w-full md:w-64 h-48 sm:h-56 rounded-xl bg-gradient-to-br from-heritage-green-900 via-heritage-green-800 to-heritage-gold-900 text-white p-6 flex flex-col justify-between shrink-0 shadow-inner relative overflow-hidden border border-heritage-green-700">
                  <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
                    <TreePine size={160} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-heritage-gold-300 font-semibold tracking-wide">
                    <Sparkles size={14} />
                    <span>ANCESTRAL WISDOM</span>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="font-serif text-lg font-bold leading-tight line-clamp-3">
                      "{selectedEntry.term}"
                    </p>
                    <p className="text-[11px] text-heritage-cream-200">
                      {selectedEntry.language || 'Family Heritage'}
                    </p>
                  </div>
                </div>

                {/* Right Details & Title */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md ${getEntryBadge(selectedEntry.entryType).bg}`}>
                      {getEntryBadge(selectedEntry.entryType).label}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => toggleFavorite(selectedEntry.id, e)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          savedFavorites.has(selectedEntry.id)
                            ? 'border-red-300 bg-red-50 dark:bg-red-950/40 text-red-700 font-medium'
                            : 'border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-muted hover:bg-heritage-cream-100'
                        }`}
                      >
                        <Heart size={14} className={savedFavorites.has(selectedEntry.id) ? 'fill-current' : ''} />
                        <span>{savedFavorites.has(selectedEntry.id) ? 'Saved' : 'Save to Collection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={e => handleShare(selectedEntry, e)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-muted hover:bg-heritage-cream-100 transition-colors cursor-pointer"
                      >
                        <Share2 size={14} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-green-950 dark:text-heritage-dark-text leading-snug">
                    "{selectedEntry.term}"
                  </h3>

                  {selectedEntry.language && (
                    <p className="text-sm font-medium text-heritage-green-700 dark:text-heritage-gold-400">
                      — {selectedEntry.language}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-heritage-green-700 dark:text-heritage-dark-muted pt-1">
                    {selectedEntry.saidByMemberId && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-heritage-gold-600" />
                        <span>
                          Shared by:{' '}
                          {fullName(data.members.find(m => m.id === selectedEntry.saidByMemberId) ?? { firstName: 'Family', lastName: 'Elder' } as any)}
                        </span>
                      </div>
                    )}
                    {selectedEntry.yearRecorded && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-heritage-gold-600" />
                        <span>Recorded: {selectedEntry.yearRecorded}</span>
                      </div>
                    )}
                    {selectedEntry.category && (
                      <div className="flex items-center gap-1.5">
                        <Leaf size={14} className="text-heritage-gold-600" />
                        <span>Category: {selectedEntry.category}</span>
                      </div>
                    )}
                  </div>

                  {/* Audio Widget in Detail View */}
                  {selectedEntry.audioUrl && (
                    <div className="mt-3 bg-heritage-cream-100/90 dark:bg-heritage-dark-hover rounded-xl p-3 flex items-center gap-3 border border-heritage-cream-300 dark:border-heritage-dark-border">
                      <Volume2 size={20} className="text-heritage-gold-600 shrink-0" />
                      <audio controls src={selectedEntry.audioUrl} className="w-full h-8 rounded-sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom 2-Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-heritage-cream-200 dark:border-heritage-dark-border">
                {/* Left 2 Columns: Tabs (The Meaning | The Story Behind It | Related Quotes) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 border-b border-heritage-cream-300 dark:border-heritage-dark-border text-sm">
                    <button
                      type="button"
                      onClick={() => setDetailTab('meaning')}
                      className={`pb-2 font-medium transition-colors cursor-pointer ${
                        detailTab === 'meaning'
                          ? 'text-heritage-green-900 dark:text-heritage-gold-400 border-b-2 border-heritage-green-900 dark:border-heritage-gold-400 font-bold'
                          : 'text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900'
                      }`}
                    >
                      The Meaning
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailTab('story')}
                      className={`pb-2 font-medium transition-colors cursor-pointer ${
                        detailTab === 'story'
                          ? 'text-heritage-green-900 dark:text-heritage-gold-400 border-b-2 border-heritage-green-900 dark:border-heritage-gold-400 font-bold'
                          : 'text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900'
                      }`}
                    >
                      The Story Behind It
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailTab('related')}
                      className={`pb-2 font-medium transition-colors cursor-pointer ${
                        detailTab === 'related'
                          ? 'text-heritage-green-900 dark:text-heritage-gold-400 border-b-2 border-heritage-green-900 dark:border-heritage-gold-400 font-bold'
                          : 'text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900'
                      }`}
                    >
                      Related Quotes ({relatedQuotes.length})
                    </button>
                  </div>

                  {/* Tab 1: The Meaning */}
                  {detailTab === 'meaning' && (
                    <div className="space-y-5 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-heritage-green-900 dark:text-heritage-dark-text font-serif font-bold text-base">
                          <Leaf size={16} className="text-heritage-gold-600" />
                          <h4>The Meaning & Lesson</h4>
                        </div>
                        <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-muted leading-relaxed">
                          {selectedEntry.meaning}
                        </p>
                      </div>

                      {selectedEntry.answer && (
                        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Answer: </span>
                          <span className="text-xs text-purple-800 dark:text-purple-200">{selectedEntry.answer}</span>
                        </div>
                      )}

                      {/* Highlighted Quote Callout */}
                      <div className="p-4 rounded-xl bg-heritage-cream-100/90 dark:bg-heritage-dark-hover border border-heritage-cream-300 dark:border-heritage-dark-border flex items-start gap-3">
                        <TreePine size={24} className="text-heritage-green-800 dark:text-heritage-gold-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <blockquote className="font-serif text-sm font-semibold italic text-heritage-green-950 dark:text-heritage-dark-text">
                            "{selectedEntry.term}"
                          </blockquote>
                          <p className="text-xs text-heritage-green-700 dark:text-heritage-dark-muted">
                            — {selectedEntry.language || 'Family Wisdom'} • Passed down for posterity
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: The Story Behind It */}
                  {detailTab === 'story' && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-heritage-green-900 dark:text-heritage-dark-text font-serif font-bold text-base">
                        <BookOpen size={16} className="text-heritage-gold-600" />
                        <h4>The Context & Memories</h4>
                      </div>
                      <p className="text-sm text-heritage-green-800 dark:text-heritage-dark-muted leading-relaxed">
                        {selectedEntry.storyBehind ||
                          'This wisdom was passed down by our family elders during harvests, gatherings, and evening stories to remind future generations of their values and heritage.'}
                      </p>
                    </div>
                  )}

                  {/* Tab 3: Related Quotes */}
                  {detailTab === 'related' && (
                    <div className="space-y-3 pt-2">
                      {relatedQuotes.length === 0 ? (
                        <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
                          No other related quotes in this category yet.
                        </p>
                      ) : (
                        relatedQuotes.map(rel => (
                          <div
                            key={rel.id}
                            onClick={() => setSelectedEntry(rel)}
                            className="p-3 rounded-xl border border-heritage-cream-300 dark:border-heritage-dark-border hover:border-heritage-gold-400 bg-white dark:bg-heritage-dark-hover transition-colors cursor-pointer flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <p className="font-serif text-sm font-bold text-heritage-green-900 dark:text-heritage-dark-text">
                                "{rel.term}"
                              </p>
                              <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted line-clamp-1">
                                {rel.meaning}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-heritage-gold-600 shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: "Details" Card */}
                <div className="rounded-2xl border border-heritage-cream-300 dark:border-heritage-dark-border bg-heritage-cream-50/80 dark:bg-heritage-dark-hover/60 p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none text-heritage-green-800">
                    <Leaf size={100} />
                  </div>

                  <h4 className="font-serif font-bold text-base text-heritage-green-950 dark:text-heritage-dark-text border-b border-heritage-cream-300 dark:border-heritage-dark-border pb-2">
                    Details
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium">Original Language</span>
                      <span className="font-semibold text-heritage-green-950 dark:text-heritage-dark-text text-right">
                        {selectedEntry.language || 'Kimeru / Kikuyu'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium">Source / Speaker</span>
                      <span className="font-semibold text-heritage-green-950 dark:text-heritage-dark-text text-right">
                        {selectedEntry.saidByMemberId
                          ? fullName(data.members.find(m => m.id === selectedEntry.saidByMemberId) ?? { firstName: 'Elder', lastName: '' } as any)
                          : 'Family Tradition'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium">Recorded Year</span>
                      <span className="font-semibold text-heritage-green-950 dark:text-heritage-dark-text text-right">
                        {selectedEntry.yearRecorded || 'Passed orally'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium">Location</span>
                      <span className="font-semibold text-heritage-green-950 dark:text-heritage-dark-text text-right">
                        {selectedEntry.location || 'Nkubu, Kenya'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-heritage-green-600 dark:text-heritage-dark-muted font-medium">Category</span>
                      <span className="font-semibold text-heritage-green-950 dark:text-heritage-dark-text text-right">
                        {selectedEntry.category || 'Family Wisdom'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD / RECORD NEW WISDOM MODAL */}
      {showForm && canAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 my-auto space-y-5">
            <div className="flex items-center justify-between border-b border-heritage-cream-300 dark:border-heritage-dark-border pb-3">
              <div className="flex items-center gap-2">
                <Plus size={20} className="text-heritage-gold-600" />
                <h3 className="font-serif text-xl font-bold text-heritage-green-950 dark:text-heritage-dark-text">
                  Add to Heritage Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-heritage-green-600 hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitNewEntry} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1.5">
                  Category Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['proverb', 'saying', 'elder_wisdom', 'story', 'expression', 'riddle', 'recording'] as LanguageEntryType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        formType === t
                          ? 'bg-heritage-green-900 text-white border-heritage-green-900'
                          : 'border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-muted'
                      }`}
                    >
                      {getEntryBadge(t).label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Term / Quote */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                  The Proverb, Saying, or Phrase
                </label>
                <input
                  required
                  value={formTerm}
                  onChange={e => setFormTerm(e.target.value)}
                  placeholder='e.g. "A tree does not forget its roots."'
                  className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
                />
              </div>

              {/* Meaning */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                  Meaning & Translation
                </label>
                <textarea
                  required
                  rows={2}
                  value={formMeaning}
                  onChange={e => setFormMeaning(e.target.value)}
                  placeholder="What it means, and its life lesson for the family..."
                  className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
                />
              </div>

              {/* Context / Story Behind */}
              <div>
                <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                  The Story Behind It (Context & Memories)
                </label>
                <textarea
                  rows={2}
                  value={formStoryBehind}
                  onChange={e => setFormStoryBehind(e.target.value)}
                  placeholder="When or how was this shared? Any memories attached to it? (optional)"
                  className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
                />
              </div>

              {formType === 'riddle' && (
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                    Traditional Riddle Answer
                  </label>
                  <input
                    value={formAnswer}
                    onChange={e => setFormAnswer(e.target.value)}
                    placeholder="The answer to the riddle"
                    className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Speaker / Attributed Member */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                    Spoken By or Featuring (Optional)
                  </label>
                  <select
                    value={formSaidBy}
                    onChange={e => setFormSaidBy(e.target.value)}
                    className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                  >
                    <option value="">Family Elder / General Tradition</option>
                    {data.members.map(mem => (
                      <option key={mem.id} value={mem.id}>
                        {fullName(mem)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                    Original Language
                  </label>
                  <input
                    value={formLanguage}
                    onChange={e => setFormLanguage(e.target.value)}
                    placeholder="e.g. Kikuyu, Swahili, Kimeru, English"
                    className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Year & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                    Approximate Year / Era
                  </label>
                  <input
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    placeholder="e.g. 1965, 1987"
                    className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-muted mb-1">
                    Location / Setting
                  </label>
                  <input
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g. Nkubu, Kenya"
                    className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Voice Recorder */}
              <div className="pt-1">
                <AudioRecorder
                  value={formAudioUrl}
                  onChange={setFormAudioUrl}
                  onBusyChange={setAudioBusy}
                  label={audioLabel(formType)}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-heritage-cream-400 text-heritage-green-800 dark:text-heritage-dark-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={audioBusy || !formTerm.trim() || !formMeaning.trim()}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-heritage-green-900 hover:bg-heritage-green-800 text-white shadow disabled:opacity-50 cursor-pointer"
                >
                  Add to Heritage Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
