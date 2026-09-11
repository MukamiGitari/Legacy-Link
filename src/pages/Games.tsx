import React, { useMemo, useState } from 'react';
import { UserSearch, ListOrdered, Quote, PenLine, Layers, Grid3x3, Trophy, Crown, type LucideIcon } from 'lucide-react';
import { GuessWho } from '../components/games/GuessWho';
import { BirthdayBingo } from '../components/games/BirthdayBingo';
import { WhoSaidIt } from '../components/games/WhoSaidIt';
import { StoryBuilder } from '../components/games/StoryBuilder';
import { LanguageFlashcards } from '../components/games/LanguageFlashcards';
import { Sudoku } from '../components/games/Sudoku';
import { useApp } from '../context/AppContext';
import type { GameKey as ScoredGameKey } from '../types';

export type GameKey = 'guessWho' | 'birthdayBingo' | 'whoSaidIt' | 'storyBuilder' | 'flashcards' | 'sudoku';

const SCORED_GAME_LABEL: Record<ScoredGameKey, string> = {
  trivia: 'Trivia',
  guessWho: 'Guess Who',
  birthdayBingo: 'Birthday Bingo',
  whoSaidIt: 'Who Said It',
  sudoku: 'Sudoku',
  flashcards: 'Flashcards',
};

interface GameMeta {
  key: GameKey;
  label: string;
  icon: LucideIcon;
  description: string;
}

const GAMES: GameMeta[] = [
  {
    key: 'guessWho',
    label: 'Guess Who',
    icon: UserSearch,
    description: "See a family member's photo and pick their name from a few choices.",
  },
  {
    key: 'birthdayBingo',
    label: 'Birthday Bingo',
    icon: ListOrdered,
    description: 'Put a shuffled set of relatives in order — oldest to youngest.',
  },
  {
    key: 'whoSaidIt',
    label: 'Who Said It',
    icon: Quote,
    description: "Match a family saying to the relative who's known for it.",
  },
  {
    key: 'storyBuilder',
    label: 'Story Builder',
    icon: PenLine,
    description: 'Take turns adding a line to a story, blind, then reveal it together.',
  },
  {
    key: 'flashcards',
    label: 'Language Flashcards',
    icon: Layers,
    description: 'See the English meaning, then say or write the term in your language.',
  },
  {
    key: 'sudoku',
    label: 'Sudoku',
    icon: Grid3x3,
    description: 'A classic number puzzle — three difficulty levels, play solo any time.',
  },
];

export const Games: React.FC = () => {
  const { data } = useApp();
  const [active, setActive] = useState<GameKey | null>(null);

  const back = () => setActive(null);

  // Every round of every game (including trivia) lands in data.gameScores, so the
  // leaderboard sums points per player across ALL games to produce one overall winner.
  const leaderboard = useMemo(() => {
    const byProfile = new Map<string, {
      profileId: string;
      playerName: string;
      total: number;
      gamesPlayed: Set<ScoredGameKey>;
      byGame: Partial<Record<ScoredGameKey, number>>;
    }>();

    for (const s of data.gameScores) {
      if (!s.profileId) continue;
      const existing = byProfile.get(s.profileId) ?? {
        profileId: s.profileId,
        playerName: s.playerName,
        total: 0,
        gamesPlayed: new Set<ScoredGameKey>(),
        byGame: {},
      };
      existing.total += s.points;
      existing.gamesPlayed.add(s.gameKey);
      existing.byGame[s.gameKey] = (existing.byGame[s.gameKey] ?? 0) + s.points;
      byProfile.set(s.profileId, existing);
    }

    return Array.from(byProfile.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [data.gameScores]);

  const winner = leaderboard[0];

  if (active === 'guessWho') return <GuessWho onBack={back} />;
  if (active === 'birthdayBingo') return <BirthdayBingo onBack={back} />;
  if (active === 'whoSaidIt') return <WhoSaidIt onBack={back} />;
  if (active === 'storyBuilder') return <StoryBuilder onBack={back} />;
  if (active === 'flashcards') return <LanguageFlashcards onBack={back} />;
  if (active === 'sudoku') return <Sudoku onBack={back} />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted max-w-md">
        Family games, built from your own family's members, memories, and language dictionary.
        Play solo, or pass the device around at the next reunion.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(({ key, label, icon: Icon, description }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className="text-left rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5 hover:border-heritage-gold-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-heritage-gold-500" />
              <span className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">
                {label}
              </span>
            </div>
            <p className="text-sm text-heritage-green-600 dark:text-heritage-dark-muted leading-relaxed">
              {description}
            </p>
            <p className="text-xs text-heritage-gold-600 font-medium mt-3">Play →</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white dark:bg-heritage-dark-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-heritage-gold-500" />
          <span className="font-serif text-lg text-heritage-green-900 dark:text-heritage-dark-text">
            Family Leaderboard
          </span>
        </div>
        <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted mb-4">
          Every round of every game counts — points are summed across Trivia, Guess Who, Birthday
          Bingo, Who Said It, Sudoku, and Flashcards to crown one overall family champion.
        </p>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-heritage-green-400 dark:text-heritage-dark-muted italic">
            No rounds played yet — finish a game to appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, i) => (
              <div
                key={row.profileId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                  i === 0
                    ? 'border-heritage-gold-400 bg-heritage-gold-50 dark:bg-heritage-gold-900/20'
                    : 'border-heritage-cream-300 dark:border-heritage-dark-border'
                }`}
              >
                <span className="w-5 text-xs font-medium text-heritage-green-500 dark:text-heritage-dark-muted">
                  {i + 1}
                </span>
                {i === 0 ? (
                  <Crown size={16} className="text-heritage-gold-500 shrink-0" />
                ) : (
                  <span className="w-4" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heritage-green-900 dark:text-heritage-dark-text truncate">
                    {row.playerName}
                  </p>
                  <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
                    {Array.from(row.gamesPlayed).map(g => SCORED_GAME_LABEL[g]).join(' · ')}
                  </p>
                </div>
                <span className="text-sm font-serif font-semibold text-heritage-green-900 dark:text-heritage-dark-text">
                  {row.total} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {winner && (
          <p className="text-xs text-heritage-gold-700 dark:text-heritage-gold-400 mt-4 flex items-center gap-1.5">
            <Crown size={12} /> {winner.playerName} is the current family game champion with {winner.total} points.
          </p>
        )}
      </div>
    </div>
  );
};
