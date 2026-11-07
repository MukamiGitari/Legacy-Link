import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Compass,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Utensils,
  BookOpen,
  Calendar,
  Users,
  Languages,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  askAssistant,
  commitAssistantProposal,
  getAssistantSuggestions,
  type AssistantChatMessage,
  type AssistantProposal,
  type AssistantProposalOp,
} from '../../lib/api';
import { isAdminRole } from '../../lib/permissions';

interface ChatPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onSelectMember?: (memberId: string) => void;
  onNavigate?: (page: any) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onToggle: controlledOnToggle,
  onSelectMember,
  onNavigate,
}) => {
  const { data, currentProfile, reloadDataset, pushToast } = useApp();
  const isAdmin = isAdminRole(currentProfile?.role);

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) controlledOnClose();
    else setInternalOpen(false);
  };

  const handleOpen = () => {
    if (controlledOnToggle) controlledOnToggle();
    else setInternalOpen(true);
  };

  const rawFamilyName = (data.family?.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
  const assistantName = `${rawFamilyName} Assistant`;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Tell me about Senior Chief Gerald M'Ikunyua's early life and legacy",
    "Who was our family founder and how did our roots begin?",
    "Share a wise proverb from the Heritage Vault and explain it",
    "What traditional recipes are in our cookbook?",
    "What eras are documented in our Family Chronicle?",
  ]);

  // Load conversation from session storage. Pending unaccepted proposals expire on reload.
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('legacy-link-assistant-chat');
      if (saved) {
        const parsed: AssistantChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If a proposal wasn't saved before page reload, mark it expired to avoid double submissions
          return parsed.map((m) => (m.saved ? m : { ...m, proposal: null }));
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        role: 'assistant',
        content: `Greetings! I am the **${assistantName}**.\n\nI can answer questions about your family tree, ancestors like Senior Chief Gerald Kithinji M'Ikunyua, traditional Meru proverbs, recipes, and recorded family memories.\n\nYou can also ask me to add relatives, in-laws, traditional recipes, proverbs, memories, or events directly to your family archive!`,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    getAssistantSuggestions()
      .then((sug) => {
        if (sug && sug.length > 0) setSuggestions(sug);
      })
      .catch(() => {});
  }, []);

  // Save conversation to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('legacy-link-assistant-chat', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // Check if the user is confirming a pending proposal (e.g. typing "add to archive", "yes", "save", "confirm")
    const isConfirmation = /^\s*(add to archive|add them|save|save it|save to archive|confirm|yes|proceed|do it|go ahead|approve|add to tree|save all|add)\b/i.test(text);
    const pendingProposalEntry = [...messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find(({ m }) => m.role === 'assistant' && m.proposal && !m.saved);

    if (isConfirmation && pendingProposalEntry) {
      const targetProposal = pendingProposalEntry.m.proposal!;
      setInput('');
      const userMsg: AssistantChatMessage = { role: 'user', content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);

      try {
        const res = await commitAssistantProposal({
          summary: targetProposal.summary,
          operations: targetProposal.operations,
        });

        if (!res.ok) {
          throw new Error(res.error || 'Failed to save to archive');
        }

        setMessages((prev) =>
          prev
            .map((item, i) =>
              i === pendingProposalEntry.i
                ? { ...item, saved: true, createdIds: res.created }
                : item
            )
            .concat({
              role: 'assistant',
              content: `✨ **Successfully saved to the archive!**\n\nI have added the approved family records to the family tree. You can explore the updated tree directly in the **Member Tree**!`,
              saved: true,
            })
        );
        reloadDataset();
        pushToast('Successfully saved items to the family archive!', 'success');
        return;
      } catch (err: any) {
        console.error('[Assistant Direct Commit Error]:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I could not complete saving the items: ${err?.message || 'Unknown error'}. Please try clicking the **Add to archive** button on the review card above.`,
          },
        ]);
        return;
      } finally {
        setLoading(false);
      }
    }

    setInput('');
    const userMsg: AssistantChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = updatedMessages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 3000) }));

      const res = await askAssistant(text, history);
      if (res.saved) {
        reloadDataset();
        pushToast('Successfully saved items to the family archive!', 'success');
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'I processed your request.',
          proposal: res.proposal || null,
          saved: Boolean(res.saved),
          createdIds: res.created || undefined,
        },
      ]);
    } catch (err: any) {
      console.error('[Assistant Chat Error]:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.message ||
            'I encountered a momentary connection issue. You can explore the **Family Tree**, **Cookbook**, or **Heritage Vault** directly while I reconnect!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    const initial: AssistantChatMessage[] = [
      {
        role: 'assistant',
        content: `Conversation reset. I am ready to explore the **${data.family.name}** heritage or record new family entries!`,
      },
    ];
    setMessages(initial);
    try {
      sessionStorage.removeItem('legacy-link-assistant-chat');
    } catch {
      // ignore
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Safe markdown formatting without dangerouslySetInnerHTML to prevent script injection
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-semibold text-heritage-bark-900 dark:text-heritage-gold-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic text-heritage-bark-700 dark:text-heritage-gold-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const renderFormatted = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className="font-serif font-bold text-base text-heritage-green-900 dark:text-heritage-gold-300 mt-2 mb-1"
              >
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const raw = trimmed.slice(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-heritage-gold-500 font-bold shrink-0">•</span>
                <span className="flex-1">{renderInline(raw)}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInline(line)}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Pill / Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-heritage-green-900 via-heritage-green-800 to-heritage-green-900 text-heritage-cream-100 shadow-2xl shadow-heritage-green-950/40 border border-heritage-gold-500/50 hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label={`Ask ${assistantName}`}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heritage-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-heritage-gold-500"></span>
          </span>
          <Sparkles size={17} className="text-heritage-gold-300 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-xs tracking-wide">{assistantName}</span>
        </button>
      )}

      {/* Slide-out Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-white dark:bg-heritage-dark-card border-l border-heritage-cream-300 dark:border-heritage-dark-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border bg-gradient-to-r from-heritage-green-900 to-heritage-green-800 text-heritage-cream-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-heritage-gold-500/20 border border-heritage-gold-400/40 flex items-center justify-center">
                <Sparkles size={18} className="text-heritage-gold-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base leading-tight">{assistantName}</h3>
                  <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-heritage-gold-500/20 text-heritage-gold-300 border border-heritage-gold-400/30">
                    Griot AI
                  </span>
                </div>
                <p className="text-[11px] text-heritage-gold-200/80 leading-tight">
                  {data.family.name} Archive Keeper
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-heritage-cream-300 hover:text-heritage-cream-100 hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleClose}
                title="Close assistant"
                className="p-1.5 rounded-lg text-heritage-cream-300 hover:text-heritage-cream-100 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-heritage-cream-100/40 dark:bg-heritage-dark-bg/50">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={idx} className="space-y-2">
                  <div className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-full bg-heritage-green-800 text-heritage-gold-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot size={15} />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 relative group ${
                        isAssistant
                          ? 'bg-white dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-bark-900 dark:text-heritage-dark-text shadow-sm'
                          : 'bg-heritage-green-900 text-heritage-cream-100 rounded-br-sm shadow-sm'
                      }`}
                    >
                      {isAssistant ? (
                        renderFormatted(m.content)
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      )}

                      {isAssistant && (
                        <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-heritage-cream-200 dark:border-heritage-dark-border/50 text-[11px] text-heritage-bark-400 dark:text-heritage-dark-muted">
                          <button
                            onClick={() => handleCopy(m.content, idx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-heritage-green-800 dark:hover:text-heritage-gold-300"
                            title="Copy text"
                          >
                            {copiedIndex === idx ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="w-7 h-7 rounded-full bg-heritage-gold-500/20 text-heritage-gold-600 dark:text-heritage-gold-400 border border-heritage-gold-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={15} />
                      </div>
                    )}
                  </div>

                  {/* Review Proposal Card */}
                  {isAssistant && m.proposal && (
                    <ProposalReviewCard
                      proposal={m.proposal}
                      saved={Boolean(m.saved)}
                      createdIds={m.createdIds}
                      onSaved={(createdIds) => {
                        setMessages((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, saved: true, createdIds } : item))
                        );
                        reloadDataset();
                        pushToast('Successfully saved items to the family archive!', 'success');
                      }}
                      onSelectMember={onSelectMember}
                      onNavigate={onNavigate}
                    />
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-heritage-green-800 text-heritage-gold-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} />
                </div>
                <div className="bg-white dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border rounded-2xl px-4 py-3 text-sm text-heritage-bark-600 dark:text-heritage-dark-muted flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-heritage-gold-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-heritage-gold-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-heritage-gold-500 animate-bounce" />
                  </span>
                  <span className="text-xs">Consulting family records & lineage archives…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-heritage-bark-400 dark:text-heritage-dark-muted mb-1.5 flex items-center gap-1">
              <Compass size={11} className="text-heritage-gold-500" /> Suggested Inquiries
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  disabled={loading}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-heritage-cream-200 dark:bg-heritage-dark-border/40 hover:bg-heritage-gold-500/10 text-heritage-bark-700 dark:text-heritage-dark-text border border-heritage-cream-300 dark:border-heritage-dark-border transition-colors truncate max-w-[280px]"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input bar */}
          <div className="p-4 border-t border-heritage-cream-300 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card">
            <div className="flex items-end gap-2 bg-heritage-cream-100 dark:bg-heritage-dark-bg border border-heritage-cream-300 dark:border-heritage-dark-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-heritage-gold-500/50">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Ask a question, or tell me who or what to add (e.g. parent in-laws, recipes, proverbs)…"
                className="flex-1 bg-transparent border-0 resize-none text-sm text-heritage-bark-900 dark:text-heritage-dark-text placeholder:text-heritage-bark-400 dark:placeholder:text-heritage-dark-muted focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-heritage-green-900 hover:bg-heritage-green-800 text-heritage-gold-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-center text-heritage-bark-400 dark:text-heritage-dark-muted mt-2">
              Responses are securely grounded in your private family dataset & Meru heritage records.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// ===========================================================================
// Inline Review Before Adding Card
// ===========================================================================

interface ProposalReviewCardProps {
  proposal: AssistantProposal;
  saved: boolean;
  createdIds?: Record<string, string>;
  onSaved: (createdIds: Record<string, string>) => void;
  onSelectMember?: (memberId: string) => void;
  onNavigate?: (page: any) => void;
}

const ProposalReviewCard: React.FC<ProposalReviewCardProps> = ({
  proposal,
  saved,
  createdIds,
  onSaved,
  onSelectMember,
  onNavigate,
}) => {
  const { data } = useApp();
  // Selected state for each operation index
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
    return new Set(proposal.operations.map((_, i) => i));
  });
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group operations
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    // Existing members
    data.members.forEach((m) => {
      map.set(m.id, `${m.firstName} ${m.lastName}`);
    });
    // Proposed members
    proposal.operations.forEach((op) => {
      if (op.op === 'add_member' && op.ref && op.data) {
        map.set(op.ref, `${op.data.first_name || ''} ${op.data.last_name || ''}`.trim() || 'New Member');
      }
    });
    return map;
  }, [data.members, proposal.operations]);

  // When a member is toggled off, automatically skip/uncheck any relationship that depends on that member's ref
  const toggleOp = (index: number) => {
    if (saved) return;
    const next = new Set(selectedIndices);
    const op = proposal.operations[index];

    if (next.has(index)) {
      next.delete(index);
      // If unticking an add_member, also untick any relationship linking to this member ref
      if (op.op === 'add_member' && op.ref) {
        proposal.operations.forEach((otherOp, otherIdx) => {
          if (otherOp.op === 'add_relationship') {
            if (otherOp.from === op.ref || otherOp.to === op.ref) {
              next.delete(otherIdx);
            }
          }
        });
      }
    } else {
      next.add(index);
      // If ticking a relationship, ensure its parent/spouse members are also checked if they are new refs
      if (op.op === 'add_relationship') {
        proposal.operations.forEach((otherOp, otherIdx) => {
          if (otherOp.op === 'add_member' && otherOp.ref) {
            if (op.from === otherOp.ref || op.to === otherOp.ref) {
              next.add(otherIdx);
            }
          }
        });
      }
    }
    setSelectedIndices(next);
  };

  // Determine which relationships are disabled because their referenced member was unticked
  const isOpDisabled = (index: number) => {
    if (saved) return false;
    const op = proposal.operations[index];
    if (op.op === 'add_relationship') {
      for (let i = 0; i < proposal.operations.length; i++) {
        const other = proposal.operations[i];
        if (other.op === 'add_member' && other.ref) {
          if ((op.from === other.ref || op.to === other.ref) && !selectedIndices.has(i)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleCommit = async () => {
    if (saved || committing) return;
    setError(null);

    // Filter operations that are selected and not disabled
    const approvedOps = proposal.operations.filter((_, i) => selectedIndices.has(i) && !isOpDisabled(i));
    if (approvedOps.length === 0) {
      setError('Please select at least one item to save.');
      return;
    }

    setCommitting(true);
    try {
      const res = await commitAssistantProposal({
        summary: proposal.summary,
        operations: approvedOps,
      });

      if (!res.ok) {
        throw new Error(res.error || 'Failed to save to archive');
      }

      onSaved(res.created || {});
    } catch (err: any) {
      console.error('[Commit Proposal Error]:', err);
      setError(err?.message || 'Could not save. Please review the entries and try again.');
    } finally {
      setCommitting(false);
    }
  };

  const activeCount = proposal.operations.filter((_, i) => selectedIndices.has(i) && !isOpDisabled(i)).length;

  return (
    <div className="ml-9 mt-1 rounded-xl border border-heritage-gold-500/40 bg-heritage-cream-100/90 dark:bg-heritage-dark-card/90 shadow-md p-4 text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-heritage-gold-500/20 pb-2">
        <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-heritage-green-950 dark:text-heritage-gold-200">
          <Sparkles size={15} className="text-heritage-gold-500" />
          <span>Review before adding</span>
        </div>
        {saved ? (
          <span className="flex items-center gap-1 font-semibold text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 size={12} /> Saved to archive
          </span>
        ) : (
          <span className="text-[11px] text-heritage-bark-500 dark:text-heritage-dark-muted">
            {activeCount} of {proposal.operations.length} selected
          </span>
        )}
      </div>

      <p className="text-heritage-bark-700 dark:text-heritage-dark-text italic font-medium">
        "{proposal.summary}"
      </p>

      {/* List of proposed operations */}
      <div className="space-y-2">
        {proposal.operations.map((op, idx) => {
          const checked = selectedIndices.has(idx) && !isOpDisabled(idx);
          const disabled = isOpDisabled(idx) || saved;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all ${
                saved
                  ? 'bg-white/60 dark:bg-heritage-dark-bg/40 border-heritage-cream-300 dark:border-heritage-dark-border opacity-90'
                  : disabled
                  ? 'bg-heritage-cream-200/50 dark:bg-heritage-dark-bg/30 border-heritage-cream-300/60 dark:border-heritage-dark-border/40 opacity-50'
                  : checked
                  ? 'bg-white dark:bg-heritage-dark-bg border-heritage-gold-400 dark:border-heritage-gold-600/60 shadow-xs'
                  : 'bg-heritage-cream-200/60 dark:bg-heritage-dark-bg/50 border-heritage-cream-300 dark:border-heritage-dark-border'
              }`}
            >
              {!saved && (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleOp(idx)}
                  className="mt-0.5 rounded border-heritage-gold-400 text-heritage-green-800 focus:ring-heritage-gold-400 cursor-pointer"
                />
              )}
              {saved && (
                <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                  <Check size={14} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* 1. Add Member */}
                {op.op === 'add_member' && op.data && (
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-heritage-green-950 dark:text-heritage-cream-100">
                        {op.data.first_name} {op.data.last_name}
                      </span>
                      {op.data.generation !== undefined && op.data.generation !== null && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-heritage-green-100 text-heritage-green-800 dark:bg-heritage-green-900/40 dark:text-heritage-green-300 border border-heritage-green-300 dark:border-heritage-green-700">
                          Gen {op.data.generation}
                        </span>
                      )}
                      <span className="text-[10px] text-heritage-bark-500 dark:text-heritage-dark-muted">
                        ({op.data.is_living ? 'Living' : 'Deceased'})
                      </span>
                    </div>

                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5 space-y-0.5">
                      {op.data.date_of_birth && <div>Born: {op.data.date_of_birth} {op.data.birth_place ? `in ${op.data.birth_place}` : ''}</div>}
                      {op.data.date_of_passing && <div>Died: {op.data.date_of_passing}</div>}
                      {op.data.occupation && <div>Occupation: {op.data.occupation}</div>}
                      {op.data.professional_title && <div>Title: {op.data.professional_title}</div>}
                      {op.data.named_after && <div>Named After: {op.data.named_after}</div>}
                    </div>

                    {/* View in Tree Link if saved */}
                    {saved && createdIds && op.ref && createdIds[op.ref] && onSelectMember && (
                      <button
                        onClick={() => {
                          onSelectMember(createdIds[op.ref!]);
                          if (onNavigate) onNavigate('tree');
                        }}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-heritage-green-800 dark:text-heritage-gold-300 hover:underline"
                      >
                        <Users size={12} /> View in Member Tree <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Update Member */}
                {op.op === 'update_member' && op.data && (
                  <div>
                    <div className="font-semibold text-heritage-green-950 dark:text-heritage-cream-100">
                      Update Member ({memberNameMap.get(op.id || '') || op.id})
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5">
                      {Object.entries(op.data).map(([k, v]) => `${k}: ${String(v)}`).join(' • ')}
                    </div>
                  </div>
                )}

                {/* 3. Add Relationship */}
                {op.op === 'add_relationship' && (
                  <div>
                    <div className="flex items-center gap-1 text-heritage-green-950 dark:text-heritage-cream-100 font-medium">
                      <span>Relationship:</span>
                      <strong className="capitalize">{op.type}</strong>
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5">
                      {op.type === 'parent' ? (
                        <>
                          <span className="font-medium">{memberNameMap.get(op.from || '') || op.from}</span>
                          {' is parent of '}
                          <span className="font-medium">{memberNameMap.get(op.to || '') || op.to}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{memberNameMap.get(op.from || '') || op.from}</span>
                          {' is spouse of '}
                          <span className="font-medium">{memberNameMap.get(op.to || '') || op.to}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Add Recipe */}
                {op.op === 'add_recipe' && op.data && (
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Utensils size={13} className="text-heritage-gold-600" />
                      <span className="font-bold text-heritage-green-950 dark:text-heritage-cream-100">
                        {op.data.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 capitalize">
                        {op.data.category || 'Traditional'}
                      </span>
                      {op.data.is_vegetarian && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Vegetarian
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5 space-y-0.5">
                      {op.data.cook_time && <div>Cook time: {op.data.cook_time}</div>}
                      {op.data.ingredients && op.data.ingredients.length > 0 && (
                        <div>{op.data.ingredients.length} ingredients: {op.data.ingredients.slice(0, 3).join(', ')}{op.data.ingredients.length > 3 ? '…' : ''}</div>
                      )}
                      {op.data.family_story && <div className="italic">"{op.data.family_story.slice(0, 90)}…"</div>}
                    </div>

                    {saved && onNavigate && (
                      <button
                        onClick={() => onNavigate('cookbook')}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-heritage-green-800 dark:text-heritage-gold-300 hover:underline"
                      >
                        <Utensils size={12} /> View in Cookbook <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}

                {/* 5. Add Memory */}
                {op.op === 'add_memory' && op.data && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-heritage-gold-600" />
                      <span className="font-bold text-heritage-green-950 dark:text-heritage-cream-100">
                        {op.data.title}
                      </span>
                      {op.data.era && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-heritage-cream-200 text-heritage-bark-700 dark:bg-heritage-dark-border dark:text-heritage-dark-text">
                          {op.data.era}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5 line-clamp-2">
                      {op.data.body}
                    </div>

                    {saved && onNavigate && (
                      <button
                        onClick={() => onNavigate('memories')}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-heritage-green-800 dark:text-heritage-gold-300 hover:underline"
                      >
                        <BookOpen size={12} /> View in Memories <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}

                {/* 6. Add Language Entry (Proverb / Saying) */}
                {op.op === 'add_language_entry' && op.data && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Languages size={13} className="text-heritage-gold-600" />
                      <span className="font-bold text-heritage-green-950 dark:text-heritage-cream-100">
                        "{op.data.term}"
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-heritage-gold-100 text-heritage-gold-800 dark:bg-heritage-gold-900/40 dark:text-heritage-gold-300 capitalize">
                        {op.data.entry_type || 'Wisdom'}
                      </span>
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5">
                      <strong>Meaning:</strong> {op.data.meaning}
                    </div>
                    {op.data.answer && (
                      <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted">
                        <strong>Answer:</strong> {op.data.answer}
                      </div>
                    )}

                    {saved && onNavigate && (
                      <button
                        onClick={() => onNavigate('dictionary')}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-heritage-green-800 dark:text-heritage-gold-300 hover:underline"
                      >
                        <Languages size={12} /> View in Heritage Vault <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}

                {/* 7. Add Event */}
                {op.op === 'add_event' && op.data && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-heritage-gold-600" />
                      <span className="font-bold text-heritage-green-950 dark:text-heritage-cream-100">
                        {op.data.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 capitalize">
                        {op.data.event_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-heritage-bark-600 dark:text-heritage-dark-muted mt-0.5 space-y-0.5">
                      <div>Date & Time: {op.data.starts_at}</div>
                      {op.data.location && <div>Location: {op.data.location}</div>}
                    </div>

                    {saved && onNavigate && (
                      <button
                        onClick={() => onNavigate('events')}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-heritage-green-800 dark:text-heritage-gold-300 hover:underline"
                      >
                        <Calendar size={12} /> View in Events <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error alert if commit fails */}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900 text-[11px]">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Commit button */}
      {!saved && (
        <div className="pt-2 border-t border-heritage-gold-500/20">
          <button
            onClick={handleCommit}
            disabled={committing || activeCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-heritage-green-950 via-heritage-green-900 to-heritage-green-950 hover:from-heritage-green-900 hover:to-heritage-green-800 text-heritage-gold-300 font-bold text-xs shadow-md border border-heritage-gold-500/40 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {committing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving to archive…</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Add {activeCount} {activeCount === 1 ? 'item' : 'items'} to archive</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
