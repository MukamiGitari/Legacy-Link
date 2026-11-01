import React, { useState } from 'react';
import { Plus, BookHeart, Music2, Mic, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { AudioRecorder } from '../components/vault/AudioRecorder';
import { FamilySong } from './FamilySong';

interface Props {
  onSelectMember: (id: string) => void;
}

// Memories read oldest-first: by the year in the era ("1940s" -> 1940), then in the order they
// were added. Memories with no era (or no year in it) go last.
const eraYear = (era?: string) => {
  const m = era?.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : Infinity;
};

export const Memories: React.FC<Props> = ({ onSelectMember }) => {
  const { data, addMemory, updateMemory, currentProfile, pushToast } = useApp();
  const chronologicalMemories = [...data.memories].sort(
    (x, y) => eraYear(x.era) - eraYear(y.era) || x.createdAt.localeCompare(y.createdAt),
  );
  const canAdd = canAddContent(currentProfile?.role);
  const [view, setView] = useState<'stories' | 'songs'>('stories');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [era, setEra] = useState('');
  const [authorMemberId, setAuthorMemberId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBusy, setAudioBusy] = useState(false);
  const [recordedByMemberId, setRecordedByMemberId] = useState('');
  const [recordedByName, setRecordedByName] = useState('');

  // Inline recording on existing memory cards without audio
  const [recordingMemId, setRecordingMemId] = useState<string | null>(null);
  const [inlineAudioBusy, setInlineAudioBusy] = useState(false);
  const [inlineRecordedBy, setInlineRecordedBy] = useState('');
  const [inlineRecordedName, setInlineRecordedName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || audioBusy) return;
    addMemory({
      title: title.trim(),
      body: body.trim(),
      era: era.trim() || undefined,
      authorMemberId: authorMemberId || undefined,
      audioUrl: audioUrl.trim() || undefined,
      recordedByMemberId: recordedByMemberId || undefined,
      recordedByName: recordedByName.trim() || undefined,
      relatedMemberIds: authorMemberId ? [authorMemberId] : [],
    });
    setTitle(''); setBody(''); setEra(''); setAuthorMemberId(''); setAudioUrl('');
    setRecordedByMemberId(''); setRecordedByName(''); setShowForm(false);
  };

  const tabCls = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      active
        ? 'bg-heritage-green-800 text-heritage-gold-200 shadow'
        : 'text-heritage-green-700 dark:text-heritage-dark-muted hover:bg-heritage-cream-50 dark:hover:bg-heritage-dark-hover'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white dark:bg-heritage-dark-card p-1.5 rounded-2xl shadow-soft border border-heritage-cream-200 dark:border-heritage-dark-border">
        <button onClick={() => setView('stories')} className={tabCls(view === 'stories')}>
          <BookHeart size={16} /> Stories
        </button>
        <button onClick={() => setView('songs')} className={tabCls(view === 'songs')}>
          <Music2 size={16} /> Family Songs
        </button>
      </div>

      {view === 'songs' && <FamilySong />}

      {view === 'stories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
              Stories keep the family's history alive — add one worth remembering.
            </p>
            {canAdd && (
              <button
                onClick={() => {
                  setShowForm(s => !s);
                  setRecordedByMemberId(currentProfile?.memberId || '');
                  setRecordedByName(currentProfile?.displayName || '');
                }}
                className="flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
              >
                <Plus size={16} /> Share a Memory
              </button>
            )}
          </div>

          {showForm && canAdd && (
            <form onSubmit={submit} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-4">
              <input
                value={title} onChange={e => setTitle(e.target.value)} placeholder="Title, e.g. Grandmother's Wedding Day & The Silk Shawl (1960)"
                className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
              />
              <textarea
                value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Tell the story..."
                className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-heritage-gold-400"
              />
              <div className="flex flex-wrap gap-3">
                <input
                  value={era} onChange={e => setEra(e.target.value)} placeholder="Era, e.g. 1960s"
                  className="flex-1 min-w-[140px] rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                />
                <select
                  value={authorMemberId} onChange={e => setAuthorMemberId(e.target.value)}
                  className="flex-1 min-w-[160px] rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
                >
                  <option value="">Story attributed to...</option>
                  {data.members.map(m => <option key={m.id} value={m.id}>{fullName(m)}</option>)}
                </select>
              </div>

              {/* Voice Narration Recorder with Member Attribution Tag */}
              <AudioRecorder
                value={audioUrl}
                onChange={setAudioUrl}
                recordedByMemberId={recordedByMemberId}
                onRecordedByMemberChange={setRecordedByMemberId}
                recordedByName={recordedByName}
                onRecordedByNameChange={setRecordedByName}
                onBusyChange={setAudioBusy}
                label="Read / narrate this memory aloud (voice note)"
              />

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
                <button type="submit" disabled={audioBusy} className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50">{audioBusy ? 'Saving audio…' : 'Publish memory'}</button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {chronologicalMemories.map(mem => {
              const author = data.members.find(m => m.id === mem.authorMemberId);
              const narrator = data.members.find(m => m.id === mem.recordedByMemberId);
              const isInlineRecording = recordingMemId === mem.id;

              return (
                <div key={mem.id} className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card overflow-hidden">
                  {mem.coverPhotoUrl && <img src={mem.coverPhotoUrl} className="w-full h-40 object-cover" alt="" />}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <BookHeart size={14} className="text-heritage-gold-500" />
                      {mem.era && <span className="text-xs px-2 py-0.5 rounded-full bg-heritage-gold-100 text-heritage-gold-700 font-medium">{mem.era}</span>}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-heritage-green-900 dark:text-heritage-dark-text">{mem.title}</h3>
                    <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{mem.body}</p>

                    {/* Audio Narration with Voice Attribution */}
                    {mem.audioUrl && (
                      <div className="mt-4 p-3.5 rounded-xl bg-heritage-cream-50/90 dark:bg-heritage-dark-hover/50 border border-heritage-cream-200 dark:border-heritage-dark-border space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-semibold text-heritage-green-900 dark:text-heritage-dark-text flex items-center gap-1.5">
                            <Mic size={14} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
                            🎙️ Narrated by: <strong className="text-heritage-bark-700 dark:text-heritage-gold-400">{narrator ? fullName(narrator) : (mem.recordedByName || 'Family Member')}</strong>
                          </span>
                          {narrator?.avatarUrl && (
                            <img src={narrator.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-heritage-gold-400" />
                          )}
                        </div>
                        <audio controls preload="none" src={mem.audioUrl} className="w-full h-9 rounded-lg shadow-xs" />
                      </div>
                    )}

                    {/* Button to add spoken narration to written words if memory has no audio */}
                    {!mem.audioUrl && canAdd && !isInlineRecording && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingMemId(mem.id);
                            setInlineRecordedBy(currentProfile?.memberId || '');
                            setInlineRecordedName(currentProfile?.displayName || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text border border-heritage-cream-300 dark:border-heritage-dark-border transition-colors"
                        >
                          <Mic size={13} className="text-heritage-bark-600 dark:text-heritage-gold-400" />
                          🎙️ Add voice narration (read aloud)
                        </button>
                      </div>
                    )}

                    {/* Inline recorder on memory card */}
                    {isInlineRecording && (
                      <div className="mt-3 p-3.5 rounded-xl bg-heritage-cream-50 dark:bg-heritage-dark-card border border-dashed border-heritage-bark-400 space-y-2">
                        <AudioRecorder
                          label="Record reading this memory aloud"
                          recordedByMemberId={inlineRecordedBy}
                          onRecordedByMemberChange={setInlineRecordedBy}
                          recordedByName={inlineRecordedName}
                          onRecordedByNameChange={setInlineRecordedName}
                          onBusyChange={setInlineAudioBusy}
                          onChange={(url) => {
                            if (!url) return;
                            updateMemory(mem.id, {
                              audioUrl: url,
                              recordedByMemberId: inlineRecordedBy || currentProfile?.memberId || undefined,
                              recordedByName: inlineRecordedName || currentProfile?.displayName || undefined,
                            });
                            pushToast('Voice narration saved to memory 🎉');
                            setRecordingMemId(null);
                          }}
                        />
                        <button
                          type="button"
                          disabled={inlineAudioBusy}
                          onClick={() => setRecordingMemId(null)}
                          className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {author && (
                      <button onClick={() => onSelectMember(author.id)} className="flex items-center gap-2 mt-4 text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text">
                        <img src={author.avatarUrl} className="w-6 h-6 rounded-full bg-heritage-cream-200 object-cover" alt="" />
                        as told by {fullName(author)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
