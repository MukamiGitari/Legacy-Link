import React, { useState } from 'react';
import { Plus, Languages, Trash2, Pencil, Check, X, Mic, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { AudioRecorder } from '../components/vault/AudioRecorder';
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
  recording: 'Voice Recording',
};

const TYPE_BADGE_CLASS: Record<LanguageEntryType, string> = {
  word: 'bg-heritage-green-100 text-heritage-green-800',
  phrase: 'bg-heritage-gold-100 text-heritage-gold-700',
  proverb: 'bg-heritage-bark-100 text-heritage-bark-800',
  riddle: 'bg-purple-100 text-purple-700',
  saying: 'bg-blue-100 text-blue-700',
  recording: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const TYPE_ORDER: LanguageEntryType[] = ['word', 'phrase', 'proverb', 'riddle', 'saying', 'recording'];

export const Dictionary: React.FC<Props> = ({ onSelectMember }) => {
  const { data, isOnlineMode, currentProfile, addLanguageEntry, updateLanguageEntry, removeLanguageEntry, pushToast } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const isAdmin = currentProfile?.role === 'super_admin' || currentProfile?.role === 'family_admin';

  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<LanguageEntryType>('word');
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [answer, setAnswer] = useState('');
  const [saidByMemberId, setSaidByMemberId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [filter, setFilter] = useState<LanguageEntryType | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');

  // Audio: `audioBusy` is true while any recorder is recording/uploading so
  // forms can't be saved with a half-finished clip.
  const [audioBusy, setAudioBusy] = useState(false);
  // Recording straight onto an existing entry card.
  const [audioEditId, setAudioEditId] = useState<string | null>(null);
  const [pendingAudio, setPendingAudio] = useState('');

  const audioLabel = (type: LanguageEntryType) =>
    type === 'word' ? 'Record the pronunciation'
    : type === 'recording' ? 'Voice recording'
    : "Record how it's said";

  const startAudioEdit = (id: string, current?: string) => {
    setAudioEditId(id);
    setPendingAudio(current ?? '');
  };

  const saveAudioEdit = (id: string) => {
    // '' (not undefined) so removing a clip is also sent to the server.
    updateLanguageEntry(id, { audioUrl: pendingAudio });
    setAudioEditId(null);
  };

  const startEdit = (id: string, currentTerm: string, currentMeaning: string, currentAnswer?: string, currentAudioUrl?: string) => {
    setEditingId(id);
    setEditTerm(currentTerm);
    setEditMeaning(currentMeaning);
    setEditAnswer(currentAnswer ?? '');
    setEditAudioUrl(currentAudioUrl ?? '');
  };

  const saveEdit = (id: string, hasAnswer: boolean) => {
    if (!editTerm.trim() || !editMeaning.trim()) return;
    updateLanguageEntry(id, {
      term: editTerm.trim(),
      meaning: editMeaning.trim(),
      answer: hasAnswer && editAnswer.trim() ? editAnswer.trim() : undefined,
      audioUrl: editAudioUrl.trim(),
    });
    setEditingId(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;
    addLanguageEntry({
      entryType,
      term: term.trim(),
      meaning: meaning.trim(),
      answer: entryType === 'riddle' && answer.trim() ? answer.trim() : undefined,
      audioUrl: audioUrl.trim() || undefined,
      saidByMemberId: (entryType === 'saying' || entryType === 'recording') && saidByMemberId ? saidByMemberId : undefined,
    });
    setTerm(''); setMeaning(''); setAnswer(''); setSaidByMemberId(''); setAudioUrl(''); setShowForm(false);
  };

  const entries = [...data.languageEntries]
    .filter(e => filter === 'all' || e.entryType === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          A living dictionary of the family's language, proverbs, riddles, personal sayings, and voice recordings.
          Preserve spoken dialects and loved ones' voices for generations to come.
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
        <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-4">
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
              entryType === 'recording'
                ? 'Title for this voice recording (e.g. "Grandpa explaining the harvest story")'
                : entryType === 'saying'
                ? 'The saying, e.g. "Taste where you come from."'
                : entryType === 'riddle'
                ? 'The riddle, in your family\'s language'
                : entryType === 'proverb'
                ? 'The proverb, in your family\'s language'
                : entryType === 'phrase'
                ? 'The phrase or sentence, in your family\'s language'
                : 'The word, in your family\'s language'
            }
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
          />

          <textarea
            value={meaning} onChange={e => setMeaning(e.target.value)} rows={3}
            placeholder={
              entryType === 'recording'
                ? 'Description or summary of what is spoken in this recording...'
                : entryType === 'saying'
                ? 'What it means, and the story or context behind it...'
                : 'What it means in English, and any context worth adding...'
            }
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
          />

          {entryType === 'riddle' && (
            <input
              value={answer} onChange={e => setAnswer(e.target.value)} placeholder="The traditional answer (optional)"
              className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            />
          )}

          {(entryType === 'saying' || entryType === 'recording') && (
            <select
              value={saidByMemberId} onChange={e => setSaidByMemberId(e.target.value)}
              className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
            >
              <option value="">Who is speaking or known for this? (optional)</option>
              {data.members.map(mem => <option key={mem.id} value={mem.id}>{fullName(mem)}</option>)}
            </select>
          )}

          <AudioRecorder
            value={audioUrl}
            onChange={setAudioUrl}
            onBusyChange={setAudioBusy}
            label={audioLabel(entryType)}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" disabled={audioBusy} className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50">Add to Heritage Vault</button>
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
            Nothing here yet — be the first to add a word, proverb, riddle, family saying, or voice recording.
          </p>
        )}
        {entries.map(entry => {
          const saidBy = entry.saidByMemberId ? data.members.find(mem => mem.id === entry.saidByMemberId) : undefined;
          const isEditing = editingId === entry.id;
          return (
            <div key={entry.id} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Languages size={14} className="text-heritage-gold-500" />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE_CLASS[entry.entryType]}`}>
                    {TYPE_LABEL[entry.entryType]}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {canAdd && !isEditing && (
                    <button
                      onClick={() => startEdit(entry.id, entry.term, entry.meaning, entry.answer, entry.audioUrl)}
                      className="text-heritage-green-400 hover:text-heritage-green-800 dark:text-heritage-dark-muted"
                      title="Suggest a correction"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {(isAdmin || entry.contributedByProfileId === currentProfile?.id) && !isEditing && (
                    <button
                      onClick={() => removeLanguageEntry(entry.id)}
                      className="text-heritage-green-400 hover:text-red-600"
                      title="Remove entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={editTerm} onChange={e => setEditTerm(e.target.value)}
                    className="w-full font-serif text-lg rounded-lg border border-heritage-gold-400 dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-1.5 focus:outline-hidden"
                  />
                  <textarea
                    value={editMeaning} onChange={e => setEditMeaning(e.target.value)} rows={3}
                    className="w-full text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
                  />
                  {entry.entryType === 'riddle' && (
                    <input
                      value={editAnswer} onChange={e => setEditAnswer(e.target.value)} placeholder="The traditional answer (optional)"
                      className="w-full text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2"
                    />
                  )}
                  <AudioRecorder
                    value={editAudioUrl}
                    onChange={setEditAudioUrl}
                    onBusyChange={setAudioBusy}
                    label={audioLabel(entry.entryType)}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={() => saveEdit(entry.id, entry.entryType === 'riddle')} disabled={audioBusy} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50">
                      <Check size={13} /> Save correction
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">{entry.term}</p>
                  <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{entry.meaning}</p>

                  {entry.answer && (
                    <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mt-2">
                      <span className="font-medium">Answer:</span> {entry.answer}
                    </p>
                  )}

                  {entry.audioUrl && (
                    <div className="mt-3 bg-heritage-cream-100/70 dark:bg-heritage-dark-hover/70 rounded-lg p-2.5 flex items-center gap-3 border border-heritage-cream-300 dark:border-heritage-dark-border">
                      <Volume2 size={18} className="text-heritage-gold-600 shrink-0" />
                      <audio controls src={entry.audioUrl} className="w-full h-8 rounded-sm" />
                    </div>
                  )}

                  {canAdd && (
                    audioEditId === entry.id ? (
                      <div className="mt-3 space-y-2">
                        <AudioRecorder
                          value={pendingAudio}
                          onChange={setPendingAudio}
                          onBusyChange={setAudioBusy}
                          label={audioLabel(entry.entryType)}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAudioEditId(null)}
                            disabled={audioBusy}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted disabled:opacity-50"
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            onClick={() => saveAudioEdit(entry.id)}
                            disabled={audioBusy || pendingAudio === (entry.audioUrl ?? '')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50"
                          >
                            <Check size={13} /> Save audio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startAudioEdit(entry.id, entry.audioUrl)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-heritage-green-700 dark:text-heritage-gold-400 hover:underline"
                      >
                        <Mic size={14} /> {entry.audioUrl ? 'Replace or remove audio' : audioLabel(entry.entryType)}
                      </button>
                    )
                  )}
                </>
              )}

              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                {saidBy ? (
                  <button onClick={() => onSelectMember(saidBy.id)} className="flex items-center gap-2 text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900">
                    <img src={saidBy.avatarUrl} className="w-6 h-6 rounded-full bg-heritage-cream-200" alt="" />
                    {entry.entryType === 'recording' ? 'recorded by / featuring' : 'said often by'} {fullName(saidBy)}
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
