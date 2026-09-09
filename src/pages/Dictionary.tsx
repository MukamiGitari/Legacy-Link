import React, { useState } from 'react';
import { Plus, Languages, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import type { LanguageEntryType } from '../types';

interface Props {
  onSelectMember: (id: string) => void;
}

const TYPE_LABEL: Record<LanguageEntryType, string> = {
  word: 'Word',
  phrase: 'Phrase / Sentence',
  proverb: 'Proverb',
  riddle: 'Riddle',
  saying: 'Family Saying',
};

const TYPE_BADGE_CLASS: Record<LanguageEntryType, string> = {
  word: 'bg-heritage-green-100 text-heritage-green-800',
  phrase: 'bg-heritage-gold-100 text-heritage-gold-700',
  proverb: 'bg-heritage-bark-100 text-heritage-bark-800',
  riddle: 'bg-purple-100 text-purple-700',
  saying: 'bg-blue-100 text-blue-700',
};

const TYPE_ORDER: LanguageEntryType[] = ['word', 'phrase', 'proverb', 'riddle', 'saying'];

export const Dictionary: React.FC<Props> = ({ onSelectMember }) => {
  const { data, currentProfile, addLanguageEntry, removeLanguageEntry } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const isAdmin = currentProfile?.role === 'super_admin' || currentProfile?.role === 'family_admin';

  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<LanguageEntryType>('word');
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [answer, setAnswer] = useState('');
  const [saidByMemberId, setSaidByMemberId] = useState('');
  const [filter, setFilter] = useState<LanguageEntryType | 'all'>('all');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;
    addLanguageEntry({
      entryType,
      term: term.trim(),
      meaning: meaning.trim(),
      answer: entryType === 'riddle' && answer.trim() ? answer.trim() : undefined,
      saidByMemberId: entryType === 'saying' && saidByMemberId ? saidByMemberId : undefined,
    });
    setTerm(''); setMeaning(''); setAnswer(''); setSaidByMemberId(''); setShowForm(false);
  };

  const entries = [...data.languageEntries]
    .filter(e => filter === 'all' || e.entryType === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          A living dictionary of the family's language, its proverbs and riddles, and the personal
          sayings loved ones are known for. Spelling and dialect will vary from person to person —
          that's part of keeping it alive, so don't worry about getting it "perfect."
        </p>
        {canAdd && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={16} /> Add an Entry
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {TYPE_ORDER.map(t => (
              <button
                key={t} type="button" onClick={() => setEntryType(t)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  entryType === t
                    ? 'bg-heritage-green-800 text-white border-heritage-green-800'
                    : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <input
            value={term} onChange={e => setTerm(e.target.value)}
            placeholder={
              entryType === 'saying'
                ? 'The saying, e.g. "Taste where you come from."'
                : entryType === 'riddle'
                ? 'The riddle, in your family\'s language'
                : entryType === 'proverb'
                ? 'The proverb, in your family\'s language'
                : entryType === 'phrase'
                ? 'The phrase or sentence, in your family\'s language'
                : 'The word, in your family\'s language'
            }
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
          />

          <textarea
            value={meaning} onChange={e => setMeaning(e.target.value)} rows={3}
            placeholder={
              entryType === 'saying'
                ? 'What it means, and the story or context behind it...'
                : 'What it means in English, and any context worth adding...'
            }
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
          />

          {entryType === 'riddle' && (
            <input
              value={answer} onChange={e => setAnswer(e.target.value)} placeholder="The traditional answer (optional)"
              className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            />
          )}

          {entryType === 'saying' && (
            <select
              value={saidByMemberId} onChange={e => setSaidByMemberId(e.target.value)}
              className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            >
              <option value="">Who says this often? (optional)</option>
              {data.members.map(mem => <option key={mem.id} value={mem.id}>{fullName(mem)}</option>)}
            </select>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium">Add to dictionary</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${filter === 'all' ? 'bg-heritage-green-800 text-white border-heritage-green-800' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'}`}
        >
          All ({data.languageEntries.length})
        </button>
        {TYPE_ORDER.map(t => {
          const count = data.languageEntries.filter(e => e.entryType === t).length;
          if (count === 0) return null;
          return (
            <button
              key={t} onClick={() => setFilter(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${filter === t ? 'bg-heritage-green-800 text-white border-heritage-green-800' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'}`}
            >
              {TYPE_LABEL[t]} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted italic py-8 text-center">
            Nothing here yet — be the first to add a word, proverb, riddle, or family saying.
          </p>
        )}
        {entries.map(entry => {
          const saidBy = entry.saidByMemberId ? data.members.find(mem => mem.id === entry.saidByMemberId) : undefined;
          return (
            <div key={entry.id} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Languages size={14} className="text-heritage-gold-500" />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE_CLASS[entry.entryType]}`}>
                    {TYPE_LABEL[entry.entryType]}
                  </span>
                </div>
                {(isAdmin || entry.contributedByProfileId === currentProfile?.id) && (
                  <button
                    onClick={() => removeLanguageEntry(entry.id)}
                    className="text-heritage-green-400 hover:text-red-600 shrink-0"
                    title="Remove entry"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <p className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">{entry.term}</p>
              <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{entry.meaning}</p>

              {entry.answer && (
                <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-2">
                  <span className="font-medium">Answer:</span> {entry.answer}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                {saidBy ? (
                  <button onClick={() => onSelectMember(saidBy.id)} className="flex items-center gap-2 text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
                    <img src={saidBy.avatarUrl} className="w-6 h-6 rounded-full bg-heritage-cream-200" alt="" />
                    said often by {fullName(saidBy)}
                  </button>
                ) : <span />}
                <span className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                  added by {entry.contributedByName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
