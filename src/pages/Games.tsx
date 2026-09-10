import React, { useState } from 'react';
import { UserSearch, ListOrdered, Quote, PenLine, Layers, type LucideIcon } from 'lucide-react';
import { GuessWho } from '../components/games/GuessWho';
import { BirthdayBingo } from '../components/games/BirthdayBingo';
import { WhoSaidIt } from '../components/games/WhoSaidIt';
import { StoryBuilder } from '../components/games/StoryBuilder';
import { LanguageFlashcards } from '../components/games/LanguageFlashcards';

export type GameKey = 'guessWho' | 'birthdayBingo' | 'whoSaidIt' | 'storyBuilder' | 'flashcards';

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
];

export const Games: React.FC = () => {
  const [active, setActive] = useState<GameKey | null>(null);

  const back = () => setActive(null);

  if (active === 'guessWho') return <GuessWho onBack={back} />;
  if (active === 'birthdayBingo') return <BirthdayBingo onBack={back} />;
  if (active === 'whoSaidIt') return <WhoSaidIt onBack={back} />;
  if (active === 'storyBuilder') return <StoryBuilder onBack={back} />;
  if (active === 'flashcards') return <LanguageFlashcards onBack={back} />;

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
    </div>
  );
};
