import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Sparkles, UserSearch } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildGuessWhoRound, type GuessWhoQuestion } from '../../lib/games';

const ROUND_SIZE = 8;

type Stage = 'menu' | 'playing' | 'result';

export const GuessWho: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data, recordGameScore } = useApp();
  const [stage, setStage] = useState<Stage>('menu');
  const [questions, setQuestions] = useState<GuessWhoQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const start = () => {
    const round = buildGuessWhoRound(data, ROUND_SIZE);
    setQuestions(round);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setStage('playing');
  };

  const current = questions[qIndex];

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correctIndex) setScore(s => s + 1);
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) {
      // `score` already reflects this question's answer (updated in answer()).
      recordGameScore('guessWho', score * 10);
      setStage('result');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
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
          <UserSearch size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-2">Guess Who</p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            You'll see a family member's photo — pick their name from a few choices.
          </p>
          {questions.length === 0 && buildGuessWhoRound(data, 1).length === 0 ? (
            <p className="text-sm text-heritage-bark-600 italic">
              Not enough members with photos yet to play this one — add some avatars or photos first.
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
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
            <span>Guess Who</span>
            <span>Question {qIndex + 1} of {questions.length} · Score {score}</span>
          </div>

          <div className="flex justify-center mb-5">
            <img
              src={current.photoUrl}
              alt="Guess who"
              className="w-32 h-32 rounded-full object-cover border-4 border-heritage-cream-300 dark:border-heritage-dark-border"
            />
          </div>

          <div className="space-y-2.5">
            {current.choices.map((choice, i) => {
              const isCorrect = i === current.correctIndex;
              const isSelected = i === selected;
              const revealed = selected !== null;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={revealed}
                  className={`w-full flex items-center justify-between gap-2 text-left text-sm px-4 py-3 rounded-lg border transition-colors ${
                    revealed && isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : revealed && isSelected && !isCorrect
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-800 dark:text-heritage-dark-text hover:border-heritage-gold-400'
                  }`}
                >
                  {choice}
                  {revealed && isCorrect && <CheckCircle2 size={16} />}
                  {revealed && isSelected && !isCorrect && <XCircle size={16} />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="flex justify-end mt-5">
              <button
                onClick={next}
                className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
              >
                {qIndex + 1 >= questions.length ? 'See results' : 'Next photo'}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'result' && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-8 max-w-lg mx-auto text-center">
          <Sparkles size={28} className="text-heritage-gold-500 mx-auto mb-3" />
          <p className="font-serif text-2xl text-heritage-green-900 dark:text-heritage-dark-text mb-1">
            {score} / {questions.length}
          </p>
          <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted mb-6">
            Round complete — how well do you really know your family?
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
