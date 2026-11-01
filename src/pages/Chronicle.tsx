import React, { useState } from 'react';
import { Plus, Mic, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../lib/lineage';
import { canAddContent } from '../lib/permissions';
import { AudioRecorder } from '../components/vault/AudioRecorder';

export const Chronicle: React.FC = () => {
  const { data, addChronicleEra, updateChronicleEra, currentProfile, pushToast } = useApp();
  const canAdd = canAddContent(currentProfile?.role);
  const eras = [...data.chronicleEras].sort((a, b) => a.sortOrder - b.sortOrder);

  const [showForm, setShowForm] = useState(false);
  const [eraLabel, setEraLabel] = useState('');
  const [headline, setHeadline] = useState('');
  const [narrative, setNarrative] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBusy, setAudioBusy] = useState(false);
  const [recordedByMemberId, setRecordedByMemberId] = useState('');
  const [recordedByName, setRecordedByName] = useState('');

  // Inline recording for existing eras without audio
  const [recordingEraId, setRecordingEraId] = useState<string | null>(null);
  const [inlineAudioBusy, setInlineAudioBusy] = useState(false);
  const [inlineRecordedBy, setInlineRecordedBy] = useState('');
  const [inlineRecordedName, setInlineRecordedName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eraLabel.trim() || !headline.trim() || audioBusy) return;
    addChronicleEra({
      eraLabel: eraLabel.trim(),
      headline: headline.trim(),
      narrative: narrative.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      recordedByMemberId: recordedByMemberId || undefined,
      recordedByName: recordedByName.trim() || undefined,
    });
    setEraLabel(''); setHeadline(''); setNarrative(''); setPhotoUrl('');
    setAudioUrl(''); setRecordedByMemberId(''); setRecordedByName(''); setShowForm(false);
    pushToast('Era added to Family Chronicle 🎉');
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-8">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          A multi-era chronicle tracing {data.family.name} from its origins to today.
        </p>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm(s => !s);
              setRecordedByMemberId(currentProfile?.memberId || '');
              setRecordedByName(currentProfile?.displayName || '');
            }}
            className="shrink-0 flex items-center gap-1.5 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
          >
            <Plus size={16} /> Add Era
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={submit} className="mb-10 rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-4">
          <input
            value={eraLabel}
            onChange={e => setEraLabel(e.target.value)}
            placeholder='Era label (e.g. "1890s – Origins")'
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <input
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Headline"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            rows={3}
            placeholder="Narrative (optional)"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />
          <input
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            placeholder="Photo URL (optional)"
            className="w-full rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border dark:bg-heritage-dark-hover dark:text-heritage-dark-text px-3 py-2 text-sm"
          />

          {/* Voice Narration Recorder with Member Attribution */}
          <AudioRecorder
            value={audioUrl}
            onChange={setAudioUrl}
            recordedByMemberId={recordedByMemberId}
            onRecordedByMemberChange={setRecordedByMemberId}
            recordedByName={recordedByName}
            onRecordedByNameChange={setRecordedByName}
            onBusyChange={setAudioBusy}
            label="Spoken Era Oral History / Narrative (voice note)"
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-2 text-sm rounded-lg border border-heritage-cream-400 text-heritage-green-700 dark:text-heritage-dark-muted">Cancel</button>
            <button type="submit" disabled={audioBusy} className="px-3.5 py-2 text-sm rounded-lg bg-heritage-green-800 text-white font-medium disabled:opacity-50">{audioBusy ? 'Saving audio…' : 'Add to Chronicle'}</button>
          </div>
        </form>
      )}

      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-heritage-gold-300 dark:bg-heritage-gold-700" />
        <div className="space-y-10">
          {eras.map(era => {
            const speaker = data.members.find(m => m.id === era.recordedByMemberId);
            const isInlineRecording = recordingEraId === era.id;

            return (
              <div key={era.id} className="relative">
                <span className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-heritage-green-800 border-4 border-heritage-cream-100 dark:border-heritage-dark-bg" />
                <p className="text-xs font-semibold uppercase tracking-wide text-heritage-gold-600 dark:text-heritage-gold-400">{era.eraLabel}</p>
                <h3 className="font-serif text-xl font-bold text-heritage-green-900 dark:text-heritage-dark-text mt-1">{era.headline}</h3>
                {era.narrative && <p className="text-sm text-heritage-green-700 dark:text-heritage-dark-muted mt-2 leading-relaxed">{era.narrative}</p>}
                {era.photoUrl && <img src={era.photoUrl} className="mt-3 rounded-lg w-full max-w-md h-44 object-cover shadow-soft" alt="" />}

                {/* Spoken Era Audio with Voice Tagging */}
                {era.audioUrl && (
                  <div className="mt-3 p-3.5 rounded-xl bg-heritage-cream-50/90 dark:bg-heritage-dark-hover/50 border border-heritage-cream-200 dark:border-heritage-dark-border space-y-2 max-w-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-heritage-green-900 dark:text-heritage-dark-text flex items-center gap-1.5">
                        <Mic size={14} className="text-heritage-gold-600 dark:text-heritage-gold-400" />
                        🎙️ Oral History Spoken by: <strong className="text-heritage-bark-700 dark:text-heritage-gold-400">{speaker ? fullName(speaker) : (era.recordedByName || 'Family Elder')}</strong>
                      </span>
                      {speaker?.avatarUrl && (
                        <img src={speaker.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-heritage-gold-400" />
                      )}
                    </div>
                    <audio controls preload="none" src={era.audioUrl} className="w-full h-9 rounded-lg shadow-xs" />
                  </div>
                )}

                {/* Add Oral History button if era has no audio yet */}
                {!era.audioUrl && canAdd && !isInlineRecording && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRecordingEraId(era.id);
                        setInlineRecordedBy(currentProfile?.memberId || '');
                        setInlineRecordedName(currentProfile?.displayName || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-heritage-cream-100 dark:bg-heritage-dark-hover hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text border border-heritage-cream-300 dark:border-heritage-dark-border transition-colors"
                    >
                      <Mic size={13} className="text-heritage-bark-600 dark:text-heritage-gold-400" />
                      🎙️ Add oral history recording (read narrative aloud)
                    </button>
                  </div>
                )}

                {/* Inline recorder on chronicle card */}
                {isInlineRecording && (
                  <div className="mt-3 p-3.5 rounded-xl bg-heritage-cream-50 dark:bg-heritage-dark-card border border-dashed border-heritage-bark-400 space-y-2 max-w-lg">
                    <AudioRecorder
                      label="Record oral history narrative for this era"
                      recordedByMemberId={inlineRecordedBy}
                      onRecordedByMemberChange={setInlineRecordedBy}
                      recordedByName={inlineRecordedName}
                      onRecordedByNameChange={setInlineRecordedName}
                      onBusyChange={setInlineAudioBusy}
                      onChange={(url) => {
                        if (!url) return;
                        updateChronicleEra(era.id, {
                          audioUrl: url,
                          recordedByMemberId: inlineRecordedBy || currentProfile?.memberId || undefined,
                          recordedByName: inlineRecordedName || currentProfile?.displayName || undefined,
                        });
                        pushToast('Oral history recording saved to era 🎉');
                        setRecordingEraId(null);
                      }}
                    />
                    <button
                      type="button"
                      disabled={inlineAudioBusy}
                      onClick={() => setRecordingEraId(null)}
                      className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
