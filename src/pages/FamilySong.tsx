import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic, Square, Play, Download, Trash2, Plus, X, Music2,
  Upload, ChevronDown, ChevronUp, Loader2, RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { isAdminRole, canAddContent } from '../lib/permissions';

// ── types ─────────────────────────────────────────────────────────────────────

interface SongSection {
  id: string;
  title: string;
  lyrics: string | null;
  position: number;
  created_at: string;
}

interface SongTake {
  id: string;
  section_id: string;
  name: string;
  audio_url: string;
  photo_url: string | null;
  created_at: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const MAX_SECS = 15;

function initials(name: string) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function shrinkImage(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadToR2(
  file: File | Blob,
  filename: string,
  contentType: string,
  kind: 'audio' | 'photo'
): Promise<string> {
  const { uploadUrl, publicUrl } = await api.post<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }>('/songs/takes/presign', { filename, contentType, kind });

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed');
  return publicUrl;
}

// ── now-playing overlay ───────────────────────────────────────────────────────

interface NowPlayingOverlayProps {
  take: SongTake;
  sectionTitle: string;
  onClose: () => void;
}

const NowPlayingOverlay: React.FC<NowPlayingOverlayProps> = ({ take, sectionTitle, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-5 p-6">
    <button
      onClick={onClose}
      className="absolute top-4 right-5 text-white/70 hover:text-white text-2xl leading-none"
    >
      ✕
    </button>

    {take.photo_url ? (
      <img
        src={take.photo_url}
        alt={take.name}
        className="w-52 h-52 rounded-full object-cover border-4 border-heritage-gold-400 shadow-2xl"
      />
    ) : (
      <div className="w-52 h-52 rounded-full bg-heritage-green-800 border-4 border-heritage-gold-400 flex items-center justify-center text-5xl font-bold text-heritage-gold-200 shadow-2xl">
        {initials(take.name)}
      </div>
    )}

    <p className="text-heritage-gold-200 text-2xl font-bold">{take.name}</p>
    <p className="text-white/60 text-sm">{sectionTitle}</p>
  </div>
);

// ── recorder panel ────────────────────────────────────────────────────────────

interface RecorderProps {
  sectionId: string;
  onSaved: () => void;
}

const Recorder: React.FC<RecorderProps> = ({ sectionId, onSaved }) => {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'preview' | 'saving'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoThumb, setPhotoThumb] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startRecording = async () => {
    setErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('Your browser does not support recording.'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        setPhase('preview');
      };
      rec.start();
      recRef.current = rec;
      setElapsed(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= MAX_SECS) { stopRecording(); return e + 1; }
          return e + 1;
        });
      }, 1000);
    } catch (e: any) {
      setErr('Could not access microphone: ' + e.message);
    }
  };

  const stopRecording = () => {
    clearTimer();
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const thumb = await shrinkImage(file, 300);
    setPhotoThumb(thumb);
  };

  const handleSave = async () => {
    if (!blob) { setErr('Record something first.'); return; }
    if (!name.trim()) { setErr('Enter your name.'); return; }
    setPhase('saving');
    setErr(null);
    try {
      const audioUrl = await uploadToR2(blob, 'recording.webm', 'audio/webm', 'audio');
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadToR2(photoFile, photoFile.name, photoFile.type, 'photo');
      }
      await api.post('/songs/takes', { sectionId, name: name.trim(), audioUrl, photoUrl });
      // reset
      setPhase('idle');
      setBlob(null);
      setBlobUrl(null);
      setName('');
      setPhotoFile(null);
      setPhotoThumb(null);
      setElapsed(0);
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'Save failed.');
      setPhase('preview');
    }
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-xl border border-heritage-cream-200 dark:border-heritage-dark-border p-4 mb-4">
      <p className="text-xs font-semibold text-heritage-green-700 dark:text-heritage-dark-muted mb-3 uppercase tracking-wider">
        🎙 Record this part (max {MAX_SECS}s)
      </p>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        {phase === 'idle' || phase === 'preview' ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
          >
            <Mic size={14} /> {phase === 'preview' ? 'Re-record' : 'Record'}
          </button>
        ) : phase === 'recording' ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg"
          >
            <Square size={14} /> Stop ({MAX_SECS - elapsed}s left)
          </button>
        ) : (
          <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-heritage-gold-400 text-white text-sm font-semibold rounded-lg opacity-70">
            <Loader2 size={14} className="animate-spin" /> Saving…
          </button>
        )}

        {phase === 'preview' && blobUrl && (
          <audio controls src={blobUrl} className="h-9 w-44" />
        )}
      </div>

      {(phase === 'preview' || phase === 'saving') && (
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 text-sm border border-heritage-cream-300 dark:border-heritage-dark-border rounded-lg bg-white dark:bg-heritage-dark-card dark:text-heritage-dark-text"
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 bg-heritage-cream-100 dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border rounded-lg text-xs font-semibold hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover transition-colors">
              <Upload size={13} /> Add photo (optional)
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoThumb && (
              <img src={photoThumb} alt="preview" className="w-10 h-10 rounded-full object-cover border-2 border-heritage-gold-400" />
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={phase === 'saving'}
            className="px-5 py-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            💾 Save My Take
          </button>
        </div>
      )}

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
};

// ── take card ─────────────────────────────────────────────────────────────────

interface TakeCardProps {
  take: SongTake;
  canRemove: boolean;
  onDelete: () => void;
  onPlay: () => void;
}

const TakeCard: React.FC<TakeCardProps> = ({ take, canRemove, onDelete, onPlay }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-heritage-dark-card border border-heritage-cream-200 dark:border-heritage-dark-border rounded-xl px-4 py-3 flex-wrap">
    <button onClick={onPlay} className="shrink-0 focus:outline-none" title="Show singer">
      {take.photo_url ? (
        <img src={take.photo_url} alt={take.name} className="w-10 h-10 rounded-full object-cover border-2 border-heritage-gold-400" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-heritage-green-800 flex items-center justify-center text-heritage-gold-200 text-sm font-bold border-2 border-heritage-gold-400">
          {initials(take.name)}
        </div>
      )}
    </button>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-heritage-green-900 dark:text-heritage-dark-text truncate">{take.name}</p>
      <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
        {new Date(take.created_at).toLocaleDateString()}
      </p>
    </div>

    <audio controls src={take.audio_url} className="h-9 w-40 shrink-0" />

    {canRemove && (
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 p-1"
        title="Delete take"
      >
        <Trash2 size={15} />
      </button>
    )}
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

export const FamilySong: React.FC = () => {
  const { currentProfile } = useApp();
  const canAdd    = canAddContent(currentProfile?.role);
  const canRemove = isAdminRole(currentProfile?.role);

  const [sections, setSections] = useState<SongSection[]>([]);
  const [takes, setTakes] = useState<SongTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // add-section form
  const [showAddSection, setShowAddSection] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  // expanded sections
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // now-playing overlay
  const [nowPlaying, setNowPlaying] = useState<{ take: SongTake; sectionTitle: string } | null>(null);
  const playAudioRef = useRef<HTMLAudioElement | null>(null);

  // full-song playback queue
  const [playQueue, setPlayQueue] = useState<Array<{ take: SongTake; sectionTitle: string }>>([]);
  const [playIdx, setPlayIdx] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ sections: SongSection[]; takes: SongTake[] }>('/songs');
      setSections(res.sections);
      setTakes(res.takes);
    } catch (e: any) {
      setErr(e.message || 'Could not load family song.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddingSection(true);
    try {
      const sec = await api.post<SongSection>('/songs/sections', {
        title: newTitle.trim(),
        lyrics: newLyrics.trim() || undefined,
      });
      setSections((prev) => [...prev, sec]);
      setNewTitle(''); setNewLyrics(''); setShowAddSection(false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setAddingSection(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section and all its takes?')) return;
    await api.del(`/songs/sections/${id}`);
    setSections((prev) => prev.filter((s) => s.id !== id));
    setTakes((prev) => prev.filter((t) => t.section_id !== id));
  };

  const deleteTake = async (id: string) => {
    if (!confirm('Delete this recording?')) return;
    await api.del(`/songs/takes/${id}`);
    setTakes((prev) => prev.filter((t) => t.id !== id));
  };

  // ── full-song playback ──

  const buildQueue = () => {
    const q: Array<{ take: SongTake; sectionTitle: string }> = [];
    sections.forEach((sec) => {
      takes.filter((t) => t.section_id === sec.id).forEach((t) => {
        q.push({ take: t, sectionTitle: sec.title });
      });
    });
    return q;
  };

  const playNext = useCallback(
    (queue: Array<{ take: SongTake; sectionTitle: string }>, idx: number) => {
      if (idx >= queue.length) {
        setNowPlaying(null); setIsPlayingAll(false); return;
      }
      const entry = queue[idx];
      setNowPlaying(entry);
      const aud = new Audio(entry.take.audio_url);
      playAudioRef.current = aud;
      aud.onended = () => playNext(queue, idx + 1);
      aud.onerror = () => playNext(queue, idx + 1);
      aud.play().catch(() => playNext(queue, idx + 1));
      setPlayIdx(idx);
    },
    []
  );

  const playAllSong = () => {
    const q = buildQueue();
    if (!q.length) { alert('No takes recorded yet.'); return; }
    setPlayQueue(q);
    setIsPlayingAll(true);
    playNext(q, 0);
  };

  const stopAll = () => {
    playAudioRef.current?.pause();
    playAudioRef.current = null;
    setNowPlaying(null);
    setIsPlayingAll(false);
  };

  // ── download WAV ──

  const downloadWav = async () => {
    const allTakes = buildQueue().map((q) => q.take);
    if (!allTakes.length) { alert('No takes yet.'); return; }
    try {
      const ctx = new AudioContext();
      const buffers: AudioBuffer[] = [];
      for (const take of allTakes) {
        const res = await fetch(take.audio_url);
        const arr = await res.arrayBuffer();
        buffers.push(await ctx.decodeAudioData(arr));
      }

      const gap       = 0.4;
      const sr        = buffers[0].sampleRate;
      const ch        = buffers[0].numberOfChannels;
      const gapSamps  = Math.floor(gap * sr);
      const totalLen  = buffers.reduce((s, b) => s + b.length + gapSamps, 0) - gapSamps;
      const merged    = ctx.createBuffer(ch, totalLen, sr);
      let offset = 0;
      for (let i = 0; i < buffers.length; i++) {
        for (let c2 = 0; c2 < ch; c2++) merged.getChannelData(c2).set(buffers[i].getChannelData(c2), offset);
        offset += buffers[i].length + (i < buffers.length - 1 ? gapSamps : 0);
      }

      const ab   = new ArrayBuffer(44 + merged.length * ch * 2);
      const view = new DataView(ab);
      const ws   = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      ws(0,'RIFF'); view.setUint32(4,36+merged.length*ch*2,true); ws(8,'WAVE'); ws(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,ch,true);
      view.setUint32(24,sr,true); view.setUint32(28,sr*ch*2,true); view.setUint16(32,ch*2,true);
      view.setUint16(34,16,true); ws(36,'data'); view.setUint32(40,merged.length*ch*2,true);
      let off = 44;
      for (let i = 0; i < merged.length; i++) {
        for (let c2 = 0; c2 < ch; c2++) {
          const s = Math.max(-1, Math.min(1, merged.getChannelData(c2)[i]));
          view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
        }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }));
      a.download = 'our-family-song.wav'; a.click();
    } catch (e: any) {
      alert('Download failed: ' + e.message);
    }
  };

  // ── render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-heritage-green-600 dark:text-heritage-dark-muted gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading Family Songs…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="bg-white dark:bg-heritage-dark-card rounded-2xl border border-heritage-cream-200 dark:border-heritage-dark-border p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Music2 size={22} className="text-heritage-gold-600" />
            <div>
              <h2 className="text-lg font-bold font-serif text-heritage-green-900 dark:text-heritage-dark-text">Family Songs</h2>
              <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
                Each person records their part — recordings are shared across all devices.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-heritage-cream-300 dark:border-heritage-dark-border rounded-lg hover:bg-heritage-cream-50 dark:hover:bg-heritage-dark-hover text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={playAllSong}
              disabled={isPlayingAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-heritage-gold-500 hover:bg-heritage-gold-600 text-white rounded-lg disabled:opacity-60"
            >
              <Play size={13} /> Play Full Song
            </button>
            {isPlayingAll && (
              <button
                onClick={stopAll}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                <Square size={13} /> Stop
              </button>
            )}
            <button
              onClick={downloadWav}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-heritage-green-800 hover:bg-heritage-green-700 text-white rounded-lg"
            >
              <Download size={13} /> Download WAV
            </button>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
      </div>

      {/* sections */}
      {sections.length === 0 && !showAddSection && (
        <div className="text-center py-16 text-heritage-green-500 dark:text-heritage-dark-muted">
          <Music2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sections yet. Add the first one below.</p>
        </div>
      )}

      {sections.map((sec) => {
        const secTakes = takes.filter((t) => t.section_id === sec.id);
        const isOpen   = expanded[sec.id] !== false; // default open
        return (
          <div
            key={sec.id}
            className="bg-white dark:bg-heritage-dark-card rounded-2xl border border-heritage-cream-200 dark:border-heritage-dark-border overflow-hidden shadow-soft"
          >
            {/* section header */}
            <div className="bg-heritage-green-800 text-heritage-cream-100 px-5 py-3 flex items-center justify-between gap-2">
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [sec.id]: !isOpen }))}
                className="flex-1 flex items-center gap-2 text-left"
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="font-bold text-sm">{sec.title}</span>
                <span className="ml-1 text-xs text-heritage-cream-400">({secTakes.length} take{secTakes.length !== 1 ? 's' : ''})</span>
              </button>
              {canRemove && (
                <button onClick={() => deleteSection(sec.id)} className="opacity-60 hover:opacity-100 p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="p-4 space-y-3">
                {sec.lyrics && (
                  <p className="text-xs italic text-heritage-green-600 dark:text-heritage-dark-muted bg-heritage-cream-50 dark:bg-heritage-dark-hover rounded-lg px-3 py-2">
                    {sec.lyrics}
                  </p>
                )}

                {/* recorder */}
                <Recorder sectionId={sec.id} onSaved={load} />

                {/* takes */}
                {secTakes.length === 0 && (
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted text-center py-2">
                    No recordings yet — be the first!
                  </p>
                )}
                {secTakes.map((take) => (
                  <TakeCard
                    key={take.id}
                    take={take}
                    canRemove={canRemove}
                    onDelete={() => deleteTake(take.id)}
                    onPlay={() => setNowPlaying({ take, sectionTitle: sec.title })}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* add section */}
      {canAdd && (
        <div className="bg-white dark:bg-heritage-dark-card rounded-2xl border-2 border-dashed border-heritage-cream-300 dark:border-heritage-dark-border p-5 shadow-soft">
          {!showAddSection ? (
            <button
              onClick={() => setShowAddSection(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text"
            >
              <Plus size={16} /> Add a Section
            </button>
          ) : (
            <form onSubmit={addSection} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-heritage-green-800 dark:text-heritage-dark-text">New Section</h3>
                <button type="button" onClick={() => setShowAddSection(false)} className="text-heritage-green-500 hover:text-heritage-green-800 dark:hover:text-heritage-dark-text">
                  <X size={16} />
                </button>
              </div>
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Section name (e.g. Verse 1, Chorus…)"
                className="w-full px-3 py-2 text-sm border border-heritage-cream-300 dark:border-heritage-dark-border rounded-lg bg-heritage-cream-50 dark:bg-heritage-dark-hover dark:text-heritage-dark-text"
              />
              <textarea
                value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)}
                placeholder="Lyrics (optional — so people know what to sing)"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-heritage-cream-300 dark:border-heritage-dark-border rounded-lg bg-heritage-cream-50 dark:bg-heritage-dark-hover dark:text-heritage-dark-text resize-y"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingSection}
                  className="px-5 py-2 bg-heritage-green-800 hover:bg-heritage-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-1.5"
                >
                  {addingSection && <Loader2 size={13} className="animate-spin" />} Add Section
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* now-playing overlay (single tap from take card) */}
      {nowPlaying && !isPlayingAll && (
        <NowPlayingOverlay
          take={nowPlaying.take}
          sectionTitle={nowPlaying.sectionTitle}
          onClose={() => setNowPlaying(null)}
        />
      )}

      {/* now-playing overlay (full song) */}
      {nowPlaying && isPlayingAll && (
        <NowPlayingOverlay
          take={nowPlaying.take}
          sectionTitle={nowPlaying.sectionTitle}
          onClose={stopAll}
        />
      )}
    </div>
  );
};
