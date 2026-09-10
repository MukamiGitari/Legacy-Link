import React, { useState } from 'react';
import { ArrowLeft, PenLine, Sparkles, Save, Trash2, Users, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SEED_PROMPTS = [
  'The Christmas the power went out...',
  'How our grandparents really met...',
  'The family road trip nobody agreed on the route for...',
  'The recipe that always goes wrong the same way...',
  'The time someone showed up to the wrong event...',
  'What the family homestead sounded like on a Sunday morning...',
];

type Stage = 'setup' | 'turn' | 'writing' | 'reveal';

export const StoryBuilder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data, currentProfile, startStory, addStoryEntry, saveStoryAsMemory, abandonStory } = useApp();

  const [stage, setStage] = useState<Stage>('setup');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState(SEED_PROMPTS[0]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    currentProfile ? [currentProfile.id] : []
  );
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');

  const activeStories = data.stories.filter(s => s.status === 'active');
  const completedStories = data.stories.filter(s => s.status === 'complete');
  const activeStory = data.stories.find(s => s.id === activeStoryId) ?? null;

  const toggleProfile = (id: string) => {
    setSelectedProfiles(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const create = () => {
    if (selectedProfiles.length < 2 || !title.trim()) return;
    const story = startStory(title.trim(), prompt, selectedProfiles);
    setActiveStoryId(story.id);
    setStage('turn');
  };

  const resume = (storyId: string) => {
    setActiveStoryId(storyId);
    setStage('turn');
  };

  const currentTurnProfileId = activeStory?.turnOrder[activeStory.currentTurnIndex];
  const currentTurnProfile = data.profiles.find(p => p.id === currentTurnProfileId);
  const lastEntry = activeStory?.entries[activeStory.entries.length - 1];

  const submitTurn = () => {
    if (!activeStory || !draftText.trim()) return;
    addStoryEntry(activeStory.id, draftText.trim());
    setDraftText('');
    // Refresh: if story is now complete, jump to reveal, else back to "pass the device"
    const updated = data.stories.find(s => s.id === activeStory.id);
    if (updated && updated.status === 'complete') {
      setStage('reveal');
    } else {
      setStage('turn');
    }
  };

  const reset = () => {
    setActiveStoryId(null);
    setTitle('');
    setPrompt(SEED_PROMPTS[0]);
    setSelectedProfiles(currentProfile ? [currentProfile.id] : []);
    setStage('setup');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text"
      >
        <ArrowLeft size={14} /> Back to games
      </button>

      {stage === 'setup' && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 text-center">
            <PenLine size={28} className="text-heritage-gold-500 mx-auto mb-3" />
            <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Story Builder</p>
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted">
              Each player sees only the line before theirs, then adds one of their own. Pass the device around, then reveal the whole story together.
            </p>
          </div>

          {activeStories.length > 0 && (
            <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4">
              <p className="text-xs font-medium text-heritage-green-500 dark:text-heritage-dark-muted mb-2">In progress</p>
              <div className="space-y-2">
                {activeStories.map(s => (
                  <button
                    key={s.id}
                    onClick={() => resume(s.id)}
                    className="w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border hover:border-heritage-gold-400"
                  >
                    <span className="text-heritage-green-800 dark:text-heritage-dark-text">{s.title}</span>
                    <span className="text-xs text-heritage-green-400">
                      {s.currentTurnIndex}/{s.turnOrder.length} turns
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-heritage-green-600 dark:text-heritage-dark-muted">Story title</label>
              <input
                className="w-full mt-1 rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. The Reunion Story"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-heritage-green-600 dark:text-heritage-dark-muted">Seed prompt</label>
              <select
                className="w-full mt-1 rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              >
                {SEED_PROMPTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-heritage-green-600 dark:text-heritage-dark-muted mb-2">
                <Users size={12} /> Who's playing? (pick at least 2, in turn order)
              </label>
              <div className="flex flex-wrap gap-2">
                {data.profiles.map(p => {
                  const isSelected = selectedProfiles.includes(p.id);
                  const orderIdx = selectedProfiles.indexOf(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProfile(p.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-heritage-gold-500 bg-heritage-gold-50 dark:bg-heritage-gold-900/20 text-heritage-green-900 dark:text-heritage-dark-text'
                          : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'
                      }`}
                    >
                      {isSelected && <span className="text-xs text-heritage-gold-600">{orderIdx + 1}.</span>}
                      {p.displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={create}
              disabled={selectedProfiles.length < 2 || !title.trim()}
              className="w-full px-4 py-2.5 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
            >
              Start story
            </button>
          </div>

          {completedStories.length > 0 && (
            <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-4">
              <p className="text-xs font-medium text-heritage-green-500 dark:text-heritage-dark-muted mb-2">Finished stories</p>
              <div className="space-y-2">
                {completedStories.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveStoryId(s.id); setStage('reveal'); }}
                    className="w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border hover:border-heritage-gold-400"
                  >
                    <span className="text-heritage-green-800 dark:text-heritage-dark-text">{s.title}</span>
                    {s.savedAsMemoryId ? (
                      <span className="text-xs text-green-600">Saved</span>
                    ) : (
                      <ArrowRight size={14} className="text-heritage-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {stage === 'turn' && activeStory && (
        <div className="max-w-md mx-auto rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 text-center">
          <Users size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-1">Pass the device to</p>
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-6">
            {currentTurnProfile?.displayName ?? 'the next player'}
          </p>
          <p className="text-xs text-heritage-green-400 mb-6">
            Turn {activeStory.currentTurnIndex + 1} of {activeStory.turnOrder.length}
          </p>
          <button
            onClick={() => setStage('writing')}
            className="px-5 py-2.5 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
          >
            I'm {currentTurnProfile?.displayName ?? 'ready'} — show me the story so far
          </button>
        </div>
      )}

      {stage === 'writing' && activeStory && (
        <div className="max-w-lg mx-auto rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6">
          <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-3">
            {lastEntry ? 'The line before yours:' : 'The seed prompt:'}
          </p>
          <blockquote className="font-serif text-lg italic text-heritage-green-900 dark:text-heritage-dark-text border-l-2 border-heritage-gold-400 pl-4 mb-5">
            {lastEntry ? lastEntry.text : activeStory.seedPrompt}
          </blockquote>

          <label className="text-xs font-medium text-heritage-green-600 dark:text-heritage-dark-muted">
            Add your line
          </label>
          <textarea
            className="w-full mt-1 rounded-lg border border-heritage-cream-400 bg-white dark:bg-heritage-dark-hover dark:border-heritage-dark-border dark:text-heritage-dark-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-heritage-gold-400"
            rows={4}
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            placeholder="Continue the story..."
            autoFocus
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={submitTurn}
              disabled={!draftText.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 disabled:opacity-40 text-white font-medium"
            >
              Submit &amp; pass it on
            </button>
          </div>
        </div>
      )}

      {stage === 'reveal' && activeStory && (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 text-center">
            <Sparkles size={24} className="text-heritage-gold-500 mx-auto mb-2" />
            <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text">{activeStory.title}</p>
          </div>

          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 space-y-3">
            <p className="text-sm italic text-heritage-green-500 dark:text-heritage-dark-muted">{activeStory.seedPrompt}</p>
            {activeStory.entries.map(e => (
              <p key={e.id} className="text-sm text-heritage-green-800 dark:text-heritage-dark-text">
                <span className="text-xs text-heritage-gold-600 font-medium mr-1">{e.authorName}:</span>
                {e.text}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            {!activeStory.savedAsMemoryId ? (
              <button
                onClick={() => saveStoryAsMemory(activeStory.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
              >
                <Save size={14} /> Save to Memories
              </button>
            ) : (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <Save size={14} /> Saved to Memories
              </span>
            )}
            <button
              onClick={() => { abandonStory(activeStory.id); reset(); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <Trash2 size={14} /> Discard
            </button>
          </div>

          <div className="text-center">
            <button onClick={reset} className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted underline">
              Start another story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
