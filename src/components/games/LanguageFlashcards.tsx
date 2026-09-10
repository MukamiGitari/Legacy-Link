import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Layers, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildLanguageFlashcardDeck, type LanguageFlashcard } from '../../lib/games';

const DECK_SIZE = 12;

type Stage = 'menu' | 'playing' | 'result';

const TYPE_LABEL: Record<LanguageFlashcard['entryType'], string> = {
  word: 'Word',
  phrase: 'Phrase',
  proverb: 'Proverb',
  riddle: 'Riddle',
  saying: 'Family Saying',
};

export const LanguageFlashcards: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data } = useApp();
  const [stage, setStage] = useState<Stage>('menu');
  const [deck, setDeck] = useState<LanguageFlashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gotIt, setGotIt] = useState(0);

  const start = () => {
    const d = buildLanguageFlashcardDeck(data, DECK_SIZE);
    setDeck(d);
    setIndex(0);
    setRevealed(false);
    setGotIt(0);
    setStage('playing');
  };

  const notEnoughData = data.languageEntries.length === 0;
  const current = deck[index];

  const mark = (correct: boolean) => {
    if (correct) setGotIt(g => g + 1);
    if (index + 1 >= deck.length) {
      setStage('result');
    } else {
      setIndex(i => i + 1);
      setRevealed(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-heritage-green-600 dark:text-heritage-dark-muted hover:text-heritage-green-900 dark:hover:text-heritage-dark-text"
      >
        <ArrowLeft size={14} /> Back to games
      </button>

      {stage === 'menu' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Layers size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Language Flashcards</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            You'll see the English meaning — say or write the term in your family's language, then flip to check.
          </p>
          {notEnoughData ? (
            <p className="text-sm text-heritage-bark-600 italic">
              Add a few entries to the Dictionary page first to build a deck.
            </p>
          ) : (
            <button
              onClick={start}
              className="px-5 py-2.5 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
            >
              Start deck
            </button>
          )}
        </div>
      )}

      {stage === 'playing' && current && (
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
            <span>Language Flashcards</span>
            <span>Card {index + 1} of {deck.length} · Got it {gotIt}</span>
          </div>

          <button
            onClick={() => setRevealed(r => !r)}
            className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 text-center min-h-[10rem] flex flex-col items-center justify-center gap-3"
          >
            <span className="text-[10px] uppercase tracking-wide text-heritage-gold-600 font-medium">
              {TYPE_LABEL[current.entryType]}
            </span>
            {!revealed ? (
              <>
                <p className="text-base text-heritage-green-800 dark:text-heritage-dark-text">{current.meaning}</p>
                <span className="flex items-center gap-1 text-xs text-heritage-green-400 mt-2">
                  <Eye size={12} /> Tap to reveal
                </span>
              </>
            ) : (
              <p className="font-serif text-2xl italic text-heritage-green-900 dark:text-heritage-dark-text">
                {current.term}
              </p>
            )}
          </button>

          {revealed && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => mark(false)}
                className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Missed it
              </button>
              <button
                onClick={() => mark(true)}
                className="px-4 py-2 text-sm rounded-lg border border-green-400 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'result' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Sparkles size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-1">
            {gotIt} / {deck.length}
          </p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">Deck complete.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={start}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RotateCcw size={14} /> New deck
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
            >
              Back to games
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
