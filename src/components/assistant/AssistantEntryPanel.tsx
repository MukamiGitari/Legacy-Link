import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { isAdminRole } from '../../lib/permissions';

/**
 * AI data-entry assistant.
 *
 * The model can only PROPOSE changes. They are shown here in plain language and
 * nothing is written until an admin presses "Save to tree" (POST /assistant/commit).
 * The button only appears when the server says the assistant is enabled for this account.
 */

type ChatMsg = { role: 'user' | 'assistant'; content: string };
type Data = Record<string, unknown>;
type Op =
  | { op: 'add_member'; ref: string; data: Data }
  | { op: 'update_member'; id: string; data: Data }
  | { op: 'add_relationship'; from: string; to: string; type: 'parent' | 'spouse'; started_at?: string | null };
interface Proposal { summary: string; operations: Op[] }

const FIELD_LABELS: Record<string, string> = {
  first_name: 'First name', last_name: 'Last name', maiden_name: 'Maiden name', gender: 'Gender',
  is_living: 'Living', date_of_birth: 'Born', date_of_passing: 'Died', birth_place: 'Birthplace',
  resting_place: 'Resting place', occupation: 'Occupation', bio: 'Bio', location: 'Lives in',
  generation: 'Generation',
};

const str = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v));
const fullName = (d: Data) => [str(d.first_name), str(d.last_name)].filter(Boolean).join(' ') || 'Unnamed person';
const showValue = (k: string, v: unknown) => (k === 'is_living' ? (v ? 'Yes' : 'No') : String(v ?? '—'));

export const AssistantEntryPanel: React.FC = () => {
  const { data, isOnlineMode, isAuthenticated, currentProfile, reloadDataset, pushToast } = useApp();
  const mayTry = isOnlineMode && isAuthenticated && isAdminRole(currentProfile?.role);

  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ask the server whether the assistant is available for this account (hides the button otherwise).
  useEffect(() => {
    if (!mayTry) { setEnabled(false); return; }
    let cancelled = false;
    api.get<{ enabled: boolean }>('/assistant-entry/status')
      .then(r => { if (!cancelled) setEnabled(Boolean(r?.enabled)); })
      .catch(() => { if (!cancelled) setEnabled(false); });
    return () => { cancelled = true; };
  }, [mayTry, currentProfile?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); },
    [messages, proposal, busy, error, open]);

  const nameOf = useCallback((id: string, ops: Op[]): string => {
    const added = ops.find((o): o is Extract<Op, { op: 'add_member' }> => o.op === 'add_member' && o.ref === id);
    if (added) return `${fullName(added.data)} (new)`;
    const m = data.members.find(x => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : 'Someone not in the tree';
  }, [data.members]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || saving) return;
    const next: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setProposal(null); // a new message replaces any unsaved proposal
    setError(null);
    // The API needs the conversation to start with a user turn.
    let recent = next.slice(-20);
    while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
    try {
      const res = await api.post<{ reply: string; proposal: Proposal | null }>('/assistant-entry/chat', { messages: recent });
      setMessages(m => [...m, { role: 'assistant', content: res.reply || 'Here is what I would save:' }]);
      setProposal(res.proposal ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!proposal || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/assistant-entry/commit', proposal);
      setMessages(m => [...m, { role: 'assistant', content: `Saved to the tree: ${proposal.summary}` }]);
      setProposal(null);
      pushToast('Saved to the family tree.', 'success');
      await reloadDataset().catch(() =>
        pushToast('Saved, but the tree could not refresh. Reload the page to see the changes.', 'error'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Nothing was changed.');
    } finally {
      setSaving(false);
    }
  };

  const reject = () => {
    setProposal(null);
    setMessages(m => [...m, { role: 'assistant', content: "Okay, I haven't saved anything. What should I change?" }]);
  };

  if (!enabled) return null;

  const describe = (op: Op, ops: Op[]): { title: string; lines: string[] } => {
    if (op.op === 'add_member') {
      const d = op.data;
      const lines = Object.entries(d)
        .filter(([k, v]) => k !== 'first_name' && k !== 'last_name' && str(v) !== null)
        .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${showValue(k, v)}`);
      return { title: `Add ${fullName(d)}`, lines };
    }
    if (op.op === 'update_member') {
      const m = data.members.find(x => x.id === op.id);
      const lines = Object.entries(op.data).map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${showValue(k, v)}`);
      return { title: `Update ${m ? `${m.firstName} ${m.lastName}` : 'a person'}`, lines };
    }
    const a = nameOf(op.from, ops);
    const b = nameOf(op.to, ops);
    return op.type === 'parent'
      ? { title: `${a} is a parent of ${b}`, lines: [] }
      : { title: `${a} and ${b} are married`, lines: op.started_at ? [`Since ${op.started_at}`] : [] };
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open the family tree assistant"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-heritage-green-700 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-heritage-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-green-400"
        >
          <Sparkles size={16} /> Assistant
        </button>
      )}

      {open && (
        <aside
          role="dialog"
          aria-label="Family tree assistant"
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-heritage-green-200 bg-white shadow-2xl sm:w-[26rem] dark:border-heritage-dark-border dark:bg-heritage-dark-card dark:text-heritage-dark-text"
        >
          <header className="flex items-center justify-between border-b border-heritage-green-200 px-4 py-3 dark:border-heritage-dark-border">
            <div className="flex items-center gap-2 font-medium"><Sparkles size={16} /> Tree assistant</div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="opacity-60 hover:opacity-100"><X size={18} /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="rounded-xl bg-heritage-green-50 p-3 leading-snug dark:bg-black/20">
              Tell me about people in the family, for example <em>"My grandmother Wanjiru was born in Nyeri on 4 May 1938 and married Kamau in 1960."</em>{' '}
              I'll prepare entries for you to review. <strong>Nothing is saved until you approve it.</strong>
            </p>

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-snug ${
                  m.role === 'user'
                    ? 'bg-heritage-green-700 text-white'
                    : 'bg-heritage-green-50 text-heritage-green-900 dark:bg-black/20 dark:text-heritage-dark-text'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {busy && <div className="flex items-center gap-2 opacity-70"><Loader2 size={14} className="animate-spin" /> Thinking…</div>}

            {proposal && (
              <section aria-label="Proposed changes" className="rounded-xl border border-heritage-green-300 p-3 dark:border-heritage-dark-border">
                <h3 className="mb-2 font-medium">Review before saving</h3>
                <ul className="space-y-2">
                  {proposal.operations.map((op, i) => {
                    const d = describe(op, proposal.operations);
                    return (
                      <li key={i} className="rounded-lg bg-heritage-green-50 px-3 py-2 dark:bg-black/20">
                        <div className="font-medium">{d.title}</div>
                        {d.lines.map((l, j) => <div key={j} className="text-xs opacity-75">{l}</div>)}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex gap-2">
                  <button onClick={approve} disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-heritage-green-700 px-3 py-2 font-medium text-white hover:bg-heritage-green-800 disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save to tree
                  </button>
                  <button onClick={reject} disabled={saving}
                    className="rounded-lg border border-heritage-green-300 px-3 py-2 hover:bg-heritage-green-50 disabled:opacity-60 dark:border-heritage-dark-border dark:hover:bg-black/20">
                    Not yet
                  </button>
                </div>
                <p className="mt-2 text-xs opacity-60">Sending another message discards this proposal.</p>
              </section>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <footer className="border-t border-heritage-green-200 p-3 dark:border-heritage-dark-border">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                rows={2}
                maxLength={4000}
                placeholder="Describe a person or relationship…"
                aria-label="Message the assistant"
                className="flex-1 resize-none rounded-lg border border-heritage-green-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green-400 dark:border-heritage-dark-border"
              />
              <button onClick={() => void send()} disabled={busy || saving || !input.trim()} aria-label="Send"
                className="rounded-lg bg-heritage-green-700 p-2.5 text-white hover:bg-heritage-green-800 disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </footer>
        </aside>
      )}
    </>
  );
};
