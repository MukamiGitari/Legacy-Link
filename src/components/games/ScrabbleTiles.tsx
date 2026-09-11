import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Grid2x2, Delete } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildScrabbleRound, tileValue, type ScrabbleTile, type ScrabbleWord } from '../../lib/games';

const ROUND_SIZE = 8;

type Stage = 'menu' | 'playing' | 'result';

export const ScrabbleTiles: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data, recordGameScore } = useApp();
  const [stage, setStage] = useState<Stage>('menu');
  const [round, setRound] = useState<ScrabbleWord[]>([]);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<ScrabbleTile[]>([]);
  const [remaining, setRemaining] = useState<ScrabbleTile[]>([]);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);

  const start = () => {
    const r = buildScrabbleRound(data, ROUND_SIZE);
    setRound(r);
    setIndex(0);
    setScore(0);
    setSolved(0);
    loadWord(r[0]);
    setStage('playing');
  };

  const loadWord = (word: ScrabbleWord | undefined) => {
    if (!word) return;
    setPlaced([]);
    setRemaining(word.tiles);
    setStatus('playing');
  };

  const notEnoughData = data.languageEntries.length === 0 && data.members.length === 0;
  const current = round[index];

  const placeTile = (tile: ScrabbleTile) => {
    if (status !== 'playing') return;
    setRemaining(r => r.filter(t => t.id !== tile.id));
    setPlaced(p => [...p, tile]);
  };

  const removeLast = () => {
    if (status !== 'playing' || placed.length === 0) return;
    const last = placed[placed.length - 1];
    setPlaced(p => p.slice(0, -1));
    setRemaining(r => [...r, last]);
  };

  const checkWord = () => {
    if (!current || placed.length !== current.answer.length) return;
    const guess = placed.map(t => t.letter).join('');
    if (guess === current.answer) {
      setStatus('correct');
      setScore(s => s + current.points);
      setSolved(s => s + 1);
    } else {
      setStatus('wrong');
    }
  };

  const next = () => {
    if (index + 1 >= round.length) {
      recordGameScore('scrabbleTiles', score);
      setStage('result');
    } else {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      loadWord(round[nextIndex]);
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
          <Grid2x2 size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Scrabble Tiles</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            Unscramble letter tiles pulled from your family's Heritage Vault words and relatives' names.
            Each solve scores like Scrabble — rarer letters are worth more.
          </p>
          {notEnoughData ? (
            <p className="text-sm text-heritage-bark-600 italic">
              Add a few entries to the Heritage Vault or some family members first to build a round.
            </p>
          ) : (
            <button
              onClick={start}
              className="px-5 py-2.5 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
            >
              Start round
            </button>
          )}
        </div>
      )}

      {stage === 'playing' && current && (
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
            <span>Scrabble Tiles</span>
            <span>Word {index + 1} of {round.length} · {score} pts</span>
          </div>

          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 text-center">
            <p className="text-[10px] uppercase tracking-wide text-heritage-gold-600 font-medium mb-1">
              {current.source === 'dictionary' ? 'Heritage Vault clue' : 'Family name clue'}
            </p>
            <p className="text-base text-heritage-green-800 dark:text-heritage-dark-text mb-5">{current.clue}</p>

            {/* Rack of placed tiles */}
            <div className="flex flex-wrap justify-center gap-2 min-h-[3rem] mb-4">
              {placed.length === 0 && (
                <span className="text-xs text-heritage-green-400 italic self-center">Tap tiles below to spell it out</span>
              )}
              {placed.map(t => (
                <span
                  key={t.id}
                  className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-heritage-gold-100 border border-heritage-gold-400 font-serif font-bold text-heritage-green-900 relative"
                >
                  {t.letter}
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-normal text-heritage-gold-700">{tileValue(t.letter)}</span>
                </span>
              ))}
            </div>

            {/* Available tiles */}
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {remaining.map(t => (
                <button
                  key={t.id}
                  onClick={() => placeTile(t)}
                  disabled={status !== 'playing'}
                  className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-white dark:bg-heritage-dark-hover border border-heritage-cream-400 dark:border-heritage-dark-border font-serif font-bold text-heritage-green-900 dark:text-heritage-dark-text relative hover:border-heritage-gold-400 disabled:opacity-50"
                >
                  {t.letter}
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-normal text-heritage-green-500">{tileValue(t.letter)}</span>
                </button>
              ))}
            </div>

            {status === 'playing' && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={removeLast}
                  disabled={placed.length === 0}
                  className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted disabled:opacity-40"
                >
                  <Delete size={12} /> Remove tile
                </button>
                <button
                  onClick={checkWord}
                  disabled={placed.length !== current.answer.length}
                  className="px-4 py-2 text-xs rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium disabled:opacity-40"
                >
                  Check word
                </button>
              </div>
            )}

            {status === 'correct' && (
              <div className="space-y-3">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  That's it — {current.answer} (+{current.points} pts)
                </p>
                <button
                  onClick={next}
                  className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
                >
                  {index + 1 >= round.length ? 'See results' : 'Next word'}
                </button>
              </div>
            )}

            {status === 'wrong' && (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Not quite — try rearranging.</p>
                <button
                  onClick={() => setStatus('playing')}
                  className="px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted text-center mt-3">
            Solved {solved} of {index + (status === 'correct' ? 1 : 0)} so far
          </p>
        </div>
      )}

      {stage === 'result' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Sparkles size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-1">
            {solved} / {round.length} words · {score} pts
          </p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">Round complete.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={start}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RotateCcw size={14} /> New round
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
