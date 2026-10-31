import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  ChevronDown,
  RotateCcw,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { askAssistant, getAssistantSuggestions, type AssistantChatMessage } from '../../lib/api';

interface ChatPanelProps {
  onSelectMember?: (memberId: string) => void;
  onNavigate?: (page: any) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSelectMember, onNavigate }) => {
  const { data, currentProfile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Tell me about Senior Chief Gerald M'Ikunyua's early life and legacy",
    "Who was our family founder and how did our roots begin?",
    "Share a wise proverb from the Heritage Vault and explain it",
    "What traditional Meru recipes are in our cookbook?",
    "What eras are documented in our Family Chronicle?",
  ]);

  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('legacy-link-assistant-chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        role: 'assistant',
        content: `Greetings! I am your **Legacy Link Family Assistant**.\n\nI can answer questions about your family tree, ancestors like Senior Chief Gerald Kithinji M'Ikunyua, traditional Meru proverbs, recipes, and recorded family memories.\n\nHow can I help you explore your heritage today?`,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load backend suggestions on mount
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
      // storage unavailable
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

    setInput('');
    const userMsg: AssistantChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Send conversation history (last 10 turns)
      const history = updatedMessages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await askAssistant(text, history);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'I could not find an answer in our recorded archives.',
        },
      ]);
    } catch (err: any) {
      console.error('[Assistant Chat Error]:', err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered a momentary connection issue. You can explore the **Family Tree**, **Heritage Vault**, or **Chronicle** directly while I reconnect!`,
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
        content: `Conversation reset. I am ready to answer any questions about the **${data.family.name}** heritage!`,
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

  // Helper to format simple markdown elements (bold, lists, linebreaks)
  const renderFormatted = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Heading 3
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-serif font-bold text-base text-heritage-green-900 dark:text-heritage-gold-300 mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }

          // Bullet point
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const raw = line.slice(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-heritage-gold-500 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(raw) }} />
              </div>
            );
          }

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
        })}
      </div>
    );
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <>
      {/* Floating Launcher Pill / Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-heritage-green-900 via-heritage-green-800 to-heritage-green-900 text-heritage-cream-100 shadow-xl shadow-heritage-green-950/25 border border-heritage-gold-500/40 hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label="Ask Family Heritage Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heritage-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-heritage-gold-500"></span>
          </span>
          <Sparkles size={17} className="text-heritage-gold-300 group-hover:rotate-12 transition-transform" />
          <span className="font-medium text-xs tracking-wide">Family Assistant</span>
        </button>
      )}

      {/* Slide-out Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] md:w-[480px] bg-white dark:bg-heritage-dark-card border-l border-heritage-cream-300 dark:border-heritage-dark-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-heritage-cream-300 dark:border-heritage-dark-border bg-gradient-to-r from-heritage-green-900 to-heritage-green-800 text-heritage-cream-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-heritage-gold-500/20 border border-heritage-gold-400/40 flex items-center justify-center">
                <Sparkles size={18} className="text-heritage-gold-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-semibold text-base leading-tight">Family Assistant</h3>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-heritage-gold-500/20 text-heritage-gold-300 border border-heritage-gold-400/30">
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
                onClick={() => setIsOpen(false)}
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
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-heritage-green-800 text-heritage-gold-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 relative group ${
                      isAssistant
                        ? 'bg-white dark:bg-heritage-dark-card border border-heritage-cream-300 dark:border-heritage-dark-border text-heritage-bark-900 dark:text-heritage-dark-text shadow-sm'
                        : 'bg-heritage-green-900 text-heritage-cream-100 rounded-br-sm shadow-sm'
                    }`}
                  >
                    {isAssistant ? renderFormatted(m.content) : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}

                    {isAssistant && (
                      <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-heritage-cream-200 dark:border-heritage-dark-border/50 text-[11px] text-heritage-bark-400 dark:text-heritage-dark-muted">
                        <button
                          onClick={() => handleCopy(m.content, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-heritage-green-800 dark:hover:text-heritage-gold-300"
                          title="Copy text"
                        >
                          {copiedIndex === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
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
                  <span className="text-xs">Consulting family archives…</span>
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
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-heritage-cream-200 dark:bg-heritage-dark-border/40 hover:bg-heritage-gold-500/10 text-heritage-bark-700 dark:text-heritage-dark-text border border-heritage-cream-300 dark:border-heritage-dark-border transition-colors truncate max-w-[260px]"
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
                placeholder="Ask about family members, recipes, proverbs, or history…"
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
              Responses are grounded in your private family dataset & Meru heritage records.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatPanel;
