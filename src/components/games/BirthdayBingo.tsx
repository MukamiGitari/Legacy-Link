import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Sparkles, ListOrdered, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildBirthdayBingoRound, type BirthdayBingoRound } from '../../lib/games';
import { fullName } from '../../lib/lineage';

const ROUND_SIZE = 6;

type Stage = 'menu' | 'playing' | 'result';

export const BirthdayBingo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data } = useApp();
  const [stage, setStage] = useState<Stage>('menu');
  const [round, setRound] = useState<BirthdayBingoRound | null>(null);
  const [picks, setPicks] = useState<string[]>([]); // member ids, in the order the player picked them
  const [checked, setChecked] = useState(false);

  const start = () => {
    const r = buildBirthdayBingoRound(data, ROUND_SIZE);
    setRound(r);
    setPicks([]);
    setChecked(false);
    setStage('playing');
  };

  const notEnoughData = buildBirthdayBingoRound(data, ROUND_SIZE) === null;

  const pick = (id: string) => {
    if (checked || picks.includes(id)) return;
    setPicks(prev => [...prev, id]);
  };

  const undoLast = () => {
    if (checked) return;
    setPicks(prev => prev.slice(0, -1));
  };

  const remaining = round ? round.members.filter(m => !picks.includes(m.id)) : [];
  const allPicked = round ? picks.length === round.members.length : false;

  const correctCount = round
    ? picks.filter((id, i) => id === round.correctOrder[i]).length
    : 0;

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
          <ListOrdered size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Birthday Bingo</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            Tap relatives in order from oldest to youngest. See how close you get.
          </p>
          {notEnoughData ? (
            <p className="text-sm text-heritage-bark-600 italic">
              Add birth dates for a few more members to unlock this game.
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

      {stage === 'playing' && round && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
            <span>Birthday Bingo</span>
            <span>Oldest → Youngest</span>
          </div>

          {/* Your ordered picks */}
          <div className="space-y-1.5 mb-5 min-h-[3rem]">
            {picks.length === 0 && (
              <p className="text-sm text-heritage-green-400 dark:text-heritage-dark-muted italic">
                Tap a name below to start — the first tap is your "oldest" guess.
              </p>
            )}
            {picks.map((id, i) => {
              const mem = round.members.find(m => m.id === id)!;
              const isCorrect = checked && round.correctOrder[i] === id;
              const isWrong = checked && round.correctOrder[i] !== id;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : isWrong
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-text'
                  }`}
                >
                  <span className="w-5 text-xs text-heritage-green-400">{i + 1}.</span>
                  {fullName(mem)}
                  {isCorrect && <CheckCircle2 size={14} className="ml-auto" />}
                  {isWrong && <XCircle size={14} className="ml-auto" />}
                </div>
              );
            })}
          </div>

          {!checked && picks.length > 0 && (
            <button
              onClick={undoLast}
              className="flex items-center gap-1 text-xs text-heritage-green-500 dark:text-heritage-dark-muted hover:text-heritage-green-800 mb-3"
            >
              <Undo2 size={12} /> Undo last pick
            </button>
          )}

          {/* Remaining choices */}
          {!checked && remaining.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-heritage-cream-300 dark:border-heritage-dark-border">
              {remaining.map(m => (
                <button
                  key={m.id}
                  onClick={() => pick(m.id)}
                  className="px-3 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-text hover:border-heritage-gold-400"
                >
                  {fullName(m)}
                </button>
              ))}
            </div>
          )}

          {!checked && allPicked && (
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setChecked(true)}
                className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
              >
                Check order
              </button>
            </div>
          )}

          {checked && (
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setStage('result')}
                className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
              >
                See results
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'result' && round && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Sparkles size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-1">
            {correctCount} / {round.members.length} in the right spot
          </p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            Correct order was: {round.correctOrder.map(id => fullName(round.members.find(m => m.id === id)!)).join(' → ')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={start}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RotateCcw size={14} /> Play again
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
