import React, { useMemo, useState } from 'react';
import { Brain, Trophy, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildTriviaRound, CATEGORY_LABEL, type TriviaQuestion } from '../lib/trivia';
import { resolveDisplayName } from '../lib/names';
import type { TriviaCategory } from '../types';

const CATEGORY_DESCRIPTION: Record<TriviaCategory, string> = {
  our_family: "Questions generated from your own family tree — birthplaces, occupations, and who's related to whom.",
  history: 'General 20th-century history — the kind of trivia that spans generations.',
  geography: 'Places, landmarks, and geography from around the world and closer to home.',
};

const QUESTIONS_PER_ROUND = 8;

type Stage = 'menu' | 'playing' | 'result';

export const Trivia: React.FC = () => {
  const { data, currentProfile, recordTriviaScore } = useApp();

  const [stage, setStage] = useState<Stage>('menu');
  const [category, setCategory] = useState<TriviaCategory>('our_family');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [leaderboardFilter, setLeaderboardFilter] = useState<TriviaCategory | 'all'>('all');

  const startRound = (cat: TriviaCategory) => {
    const round = buildTriviaRound(data, cat, QUESTIONS_PER_ROUND);
    setCategory(cat);
    setQuestions(round);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setStage('playing');
  };

  const currentQuestion = questions[qIndex];

  const answer = (choiceIndex: number) => {
    if (selected !== null) return; // already answered this question
    setSelected(choiceIndex);
    if (choiceIndex === currentQuestion.correctIndex) setScore(s => s + 1);
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) {
      // `score` already reflects this question's answer (updated in answer()).
      recordTriviaScore(category, score, questions.length);
      setStage('result');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
    }
  };

  const leaderboard = useMemo(() => {
    const filtered = leaderboardFilter === 'all'
      ? data.triviaScores
      : data.triviaScores.filter(s => s.category === leaderboardFilter);

    // Best score per profile (so one person spamming rounds doesn't flood the board).
    const bestByProfile = new Map<string, typeof filtered[number]>();
    filtered.forEach(s => {
      const existing = bestByProfile.get(s.profileId);
      const ratio = s.score / s.totalQuestions;
      const existingRatio = existing ? existing.score / existing.totalQuestions : -1;
      if (!existing || ratio > existingRatio) bestByProfile.set(s.profileId, s);
    });

    return Array.from(bestByProfile.values())
      .sort((a, b) => (b.score / b.totalQuestions) - (a.score / a.totalQuestions))
      .slice(0, 10)
      // Show the name the account is linked to (family member or profile display
      // name) rather than a raw email that may have been stored on the score.
      .map(s => ({ ...s, displayName: resolveDisplayName(data, s.profileId, s.playerName) }));
  }, [data.triviaScores, leaderboardFilter, data.profiles, data.members]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
          Test what you know — about your own family tree, and about the wider world your family has lived through.
          Play a round, climb the leaderboard, and see who in the family knows their history best.
        </p>
      </div>

      {stage === 'menu' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(CATEGORY_LABEL) as TriviaCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => startRound(cat)}
                className="text-left rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 hover:border-heritage-gold-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-heritage-gold-500" />
                  <span className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">
                    {CATEGORY_LABEL[cat]}
                  </span>
                </div>
                <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted leading-relaxed">
                  {CATEGORY_DESCRIPTION[cat]}
                </p>
                <p className="text-xs text-heritage-gold-600 font-medium mt-3">Play {QUESTIONS_PER_ROUND} questions →</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-heritage-gold-500" />
                <span className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">Leaderboard</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLeaderboardFilter('all')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border ${leaderboardFilter === 'all' ? 'bg-heritage-green-800 text-white border-heritage-green-800' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'}`}
                >
                  All
                </button>
                {(Object.keys(CATEGORY_LABEL) as TriviaCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLeaderboardFilter(cat)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border ${leaderboardFilter === cat ? 'bg-heritage-green-800 text-white border-heritage-green-800' : 'border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted'}`}
                  >
                    {CATEGORY_LABEL[cat]}
                  </button>
                ))}
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-heritage-green-500 dark:text-heritage-dark-muted italic py-6 text-center">
                No scores yet in this category — be the first to play!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
                      entry.profileId === currentProfile?.id ? 'bg-heritage-gold-100 dark:bg-heritage-dark-hover' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 text-center text-sm font-semibold ${i < 3 ? 'text-heritage-gold-600' : 'text-heritage-green-500 dark:text-heritage-dark-muted'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">
                        {entry.displayName}
                      </span>
                      {leaderboardFilter === 'all' && (
                        <span className="text-[11px] text-heritage-green-500 dark:text-heritage-dark-muted shrink-0">
                          {CATEGORY_LABEL[entry.category]}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-heritage-green-800 dark:text-heritage-dark-text shrink-0">
                      {entry.score}/{entry.totalQuestions}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {stage === 'playing' && currentQuestion && (
        <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
            <span>{CATEGORY_LABEL[category]}</span>
            <span>Question {qIndex + 1} of {questions.length} · Score {score}</span>
          </div>

          <p className="font-serif text-xl text-heritage-green-900 dark:text-heritage-dark-text mb-5">
            {currentQuestion.prompt}
          </p>

          <div className="space-y-2.5">
            {currentQuestion.choices.map((choice, i) => {
              const isCorrect = i === currentQuestion.correctIndex;
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
                {qIndex + 1 >= questions.length ? 'See results' : 'Next question'}
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
            {CATEGORY_LABEL[category]} round complete — your score has been added to the leaderboard.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => startRound(category)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-heritage-cream-400 dark:border-heritage-dark-border text-heritage-green-700 dark:text-heritage-dark-muted"
            >
              <RotateCcw size={14} /> Play again
            </button>
            <button
              onClick={() => setStage('menu')}
              className="px-4 py-2 text-sm rounded-lg bg-heritage-green-800 hover:bg-heritage-green-700 text-white font-medium"
            >
              Back to categories
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
