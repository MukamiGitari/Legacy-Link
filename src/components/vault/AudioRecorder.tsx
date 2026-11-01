import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Trash2, Volume2, RotateCcw, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadFileToR2 } from '../../lib/api';
import { fullName } from '../../lib/lineage';

/**
 * Record, upload, preview, and tag who made one audio clip (a pronounced word, a
 * spoken proverb, a narrated memory, a chronicle era oral history...).
 *
 * `value` is the stored URL ('' / undefined = no audio).
 * `recordedByMemberId` / `recordedByName` tags the voice recording author.
 */

// Browsers differ: Chrome/Firefox record webm/ogg, Safari/iOS only records mp4.
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

// The upload API only accepts exact, parameter-free content types.
const TYPE_ALIASES: Record<string, string> = {
  'audio/x-m4a': 'audio/m4a',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/x-wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'audio/x-mpeg': 'audio/mpeg',
};

const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/aac': 'aac',
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function baseAudioType(type: string): string {
  const base = (type || '').split(';')[0].trim().toLowerCase();
  return TYPE_ALIASES[base] ?? base;
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return MIME_CANDIDATES.find(t => MediaRecorder.isTypeSupported(t));
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

interface Props {
  value?: string;
  onChange: (url: string) => void;
  /** Heading shown above the controls. */
  label?: string;
  /** Recording stops automatically after this many seconds. */
  maxSeconds?: number;
  /** Lets the parent disable "Save" while a recording/upload is in progress. */
  onBusyChange?: (busy: boolean) => void;
  /** Tagged family member who voiced this recording */
  recordedByMemberId?: string;
  onRecordedByMemberChange?: (memberId: string) => void;
  /** Tagged name (if not in tree or custom speaker) */
  recordedByName?: string;
  onRecordedByNameChange?: (name: string) => void;
  /** Whether to show the voice speaker tagging section (default: true) */
  showMemberTag?: boolean;
}

export const AudioRecorder: React.FC<Props> = ({
  value,
  onChange,
  label = 'Voice note / audio recording',
  maxSeconds = 300,
  onBusyChange,
  recordedByMemberId,
  onRecordedByMemberChange,
  recordedByName,
  onRecordedByNameChange,
  showMemberTag = true,
}) => {
  const { data, currentProfile, isOnlineMode, pushToast } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [working, setWorking] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);
  const mountedRef = useRef(true);

  // Auto-tag current user's member profile when recording/uploading if not already tagged
  const autoTagCurrentMember = () => {
    if (!recordedByMemberId && currentProfile?.memberId && onRecordedByMemberChange) {
      onRecordedByMemberChange(currentProfile.memberId);
      const m = data.members.find(x => x.id === currentProfile.memberId);
      if (m && onRecordedByNameChange && !recordedByName) {
        onRecordedByNameChange(fullName(m));
      }
    } else if (!recordedByName && currentProfile?.displayName && onRecordedByNameChange) {
      onRecordedByNameChange(currentProfile.displayName);
    }
  };

  const canRecord =
    typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const busy = isRecording || working;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  // Never leave the parent stuck in a "busy" state if we unmount mid-recording.
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;
  useEffect(() => () => onBusyChangeRef.current?.(false), []);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // If the component goes away mid-recording, drop the clip and free the mic.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      discardRef.current = true;
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
      releaseMic();
    };
  }, []);

  const store = async (file: File) => {
    autoTagCurrentMember();
    if (isOnlineMode) {
      setWorking(true);
      try {
        const res = await uploadFileToR2({ file });
        if (!mountedRef.current) return;
        onChange(res.url || res.key);
        pushToast('Audio saved.', 'success');
      } catch (err: any) {
        console.warn('Audio upload failed:', err);
        pushToast(
          `Couldn't upload the recording (${err?.message || 'unknown error'}). It was not saved — check your connection and try again.`,
          'error',
        );
      } finally {
        if (mountedRef.current) setWorking(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (mountedRef.current) onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    if (!canRecord) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        releaseMic();
        if (discardRef.current || !mountedRef.current) return;
        const type = baseAudioType(recorder.mimeType || mime || 'audio/webm');
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size === 0) {
          pushToast('Nothing was recorded — please try again.');
          return;
        }
        const ext = EXTENSIONS[type] ?? 'webm';
        void store(new File([blob], `recording-${Date.now()}.${ext}`, { type }));
      };

      recorder.start();
      startedAtRef.current = Date.now();
      setSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stopRecording();
      }, 500);
    } catch {
      releaseMic();
      pushToast('Microphone access was denied or is not available on this device.');
    }
  };

  const stopRecording = () => {
    clearTimer();
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setIsRecording(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!picked) return;
    if (!picked.type.startsWith('audio/')) {
      pushToast('Please choose an audio file.');
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      pushToast('That audio file is too large (50 MB maximum).');
      return;
    }
    const type = baseAudioType(picked.type);
    await store(new File([picked], picked.name, { type }));
  };

  const taggedMember = data.members.find(m => m.id === recordedByMemberId);

  return (
    <div className="rounded-xl border border-dashed border-heritage-cream-400 dark:border-heritage-dark-border bg-heritage-cream-50/80 dark:bg-heritage-dark-hover/40 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-heritage-green-800 dark:text-heritage-dark-text flex items-center gap-1.5">
          <Volume2 size={15} className="text-heritage-gold-600 dark:text-heritage-gold-400" /> {label}
        </span>
        {value && !busy && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            ✓ Audio attached
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {canRecord && (
          isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium animate-pulse transition-colors"
            >
              <Square size={14} /> Stop ({formatTime(seconds)} / {formatTime(maxSeconds)})
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={working}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {value ? <RotateCcw size={14} /> : <Mic size={14} />}
              {value ? 'Re-record' : 'Record with microphone'}
            </button>
          )
        )}

        <label
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card text-heritage-green-800 dark:text-heritage-dark-text transition-colors ${
            busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-heritage-cream-100 dark:hover:bg-heritage-dark-hover'
          }`}
        >
          <Upload size={14} /> Upload audio file
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" disabled={busy} />
        </label>

        {value && !busy && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              if (onRecordedByMemberChange) onRecordedByMemberChange('');
              if (onRecordedByNameChange) onRecordedByNameChange('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} /> Remove audio
          </button>
        )}

        {working && (
          <span className="text-xs text-heritage-gold-600 dark:text-heritage-gold-400 animate-pulse">Saving audio…</span>
        )}
      </div>

      {!canRecord && (
        <p className="text-xs text-heritage-green-600 dark:text-heritage-dark-muted">
          Recording isn't available here (it needs a microphone and a secure https connection), but you can still upload an audio file.
        </p>
      )}

      {value && (
        <audio controls src={value} className="w-full h-9 rounded-lg shadow-xs" />
      )}

      {/* Voice Attribution / Tagging Section */}
      {showMemberTag && (onRecordedByMemberChange || onRecordedByNameChange) && (
        <div className="pt-2.5 mt-2 border-t border-heritage-cream-200 dark:border-heritage-dark-border/60 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-heritage-green-900 dark:text-heritage-dark-text flex items-center gap-1.5">
              <UserCheck size={14} className="text-heritage-bark-500 dark:text-heritage-gold-400" />
              Tag who recorded / voiced this:
            </span>
            {taggedMember && (
              <span className="text-[11px] font-medium text-heritage-green-700 dark:text-heritage-dark-muted bg-heritage-cream-100 dark:bg-heritage-dark-card px-2 py-0.5 rounded-full border border-heritage-cream-300 dark:border-heritage-dark-border">
                🎙️ Voiced by: {fullName(taggedMember)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onRecordedByMemberChange && (
              <select
                value={recordedByMemberId || ''}
                onChange={(e) => {
                  const mid = e.target.value;
                  onRecordedByMemberChange(mid);
                  if (mid && mid !== 'custom') {
                    const m = data.members.find(x => x.id === mid);
                    if (m && onRecordedByNameChange) onRecordedByNameChange(fullName(m));
                  }
                }}
                className="text-xs rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card px-2.5 py-1.5 text-heritage-green-900 dark:text-heritage-dark-text focus:outline-none focus:ring-1 focus:ring-heritage-gold-500 max-w-[240px] flex-1 min-w-[160px]"
              >
                <option value="">-- Choose Family Member --</option>
                {data.members.map(m => (
                  <option key={m.id} value={m.id}>
                    {fullName(m)} {m.generation ? `(Gen ${m.generation})` : ''}
                  </option>
                ))}
                <option value="custom">Other / Enter Name Below</option>
              </select>
            )}

            {onRecordedByNameChange && (
              <input
                type="text"
                value={recordedByName || ''}
                onChange={(e) => onRecordedByNameChange(e.target.value)}
                placeholder="Speaker name (e.g. Aunt Sarah, Elder Mwenda)"
                className="text-xs rounded-lg border border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card px-2.5 py-1.5 text-heritage-green-900 dark:text-heritage-dark-text focus:outline-none focus:ring-1 focus:ring-heritage-gold-500 flex-1 min-w-[160px]"
              />
            )}
          </div>

          {taggedMember && (
            <div className="flex items-center gap-2 pt-1 text-xs text-heritage-green-800 dark:text-heritage-dark-text">
              <img
                src={taggedMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-heritage-gold-400"
              />
              <span>
                Recording attribution: <strong className="font-semibold text-heritage-bark-700 dark:text-heritage-gold-400">{fullName(taggedMember)}</strong>
                {taggedMember.occupation ? ` • ${taggedMember.occupation}` : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
