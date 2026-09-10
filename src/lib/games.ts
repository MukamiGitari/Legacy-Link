// Round/question generators for the family-data games (Guess Who, Birthday Bingo,
// Who Said It). Mirrors the shuffle/distractor approach in trivia.ts so all the
// game logic in the app follows one predictable pattern.

import type { FamilyDataset, LanguageEntry, Member } from '../types';
import { fullName } from './lineage';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors<T>(pool: T[], exclude: T, count: number): T[] {
  const candidates = shuffle(pool.filter(p => p !== exclude));
  return candidates.slice(0, count);
}

// ---------------------------------------------------------------------------
// Guess Who — shown a member's photo, pick their name from a few choices.
// ---------------------------------------------------------------------------

export interface GuessWhoQuestion {
  id: string;
  memberId: string;
  photoUrl: string;
  choices: string[];
  correctIndex: number;
}

export function buildGuessWhoRound(data: FamilyDataset, count: number): GuessWhoQuestion[] {
  const candidates = data.members.filter(m => m.avatarUrl);
  const names = candidates.map(fullName);

  const questions = shuffle(candidates).slice(0, count).map(mem => {
    const correct = fullName(mem);
    const distractors = pickDistractors(names, correct, 3);
    const choices = shuffle([correct, ...distractors]);
    return {
      id: `guesswho-${mem.id}`,
      memberId: mem.id,
      photoUrl: mem.avatarUrl!,
      choices,
      correctIndex: choices.indexOf(correct),
    };
  });

  return questions.filter(q => q.choices.length >= 2);
}

// ---------------------------------------------------------------------------
// Birthday Bingo — given a shuffled set of members, put them in birth order
// (oldest first).
// ---------------------------------------------------------------------------

export interface BirthdayBingoRound {
  members: Member[]; // shuffled — what the player sees and reorders
  correctOrder: string[]; // member ids, oldest first
}

export function buildBirthdayBingoRound(data: FamilyDataset, count: number): BirthdayBingoRound | null {
  const withBirths = data.members.filter(m => m.dateOfBirth);
  if (withBirths.length < 3) return null;

  const chosen = shuffle(withBirths).slice(0, Math.min(count, withBirths.length));
  const correctOrder = [...chosen]
    .sort((a, b) => new Date(a.dateOfBirth!).getTime() - new Date(b.dateOfBirth!).getTime())
    .map(m => m.id);

  return { members: shuffle(chosen), correctOrder };
}

// ---------------------------------------------------------------------------
// Who Said It — pulls "saying"-type language dictionary entries, which are
// already attributed to a member (saidByMemberId), and asks who's known for it.
// ---------------------------------------------------------------------------

export interface WhoSaidItQuestion {
  id: string;
  saying: string;
  meaning: string;
  choices: string[]; // member names
  correctIndex: number;
}

export function buildWhoSaidItRound(data: FamilyDataset, count: number): WhoSaidItQuestion[] {
  const sayings = data.languageEntries.filter(
    (e): e is LanguageEntry & { saidByMemberId: string } => e.entryType === 'saying' && !!e.saidByMemberId
  );
  const names = data.members.map(fullName);
  const memberName = (id: string) => {
    const mem = data.members.find(m => m.id === id);
    return mem ? fullName(mem) : null;
  };

  const questions = shuffle(sayings).slice(0, count).map(entry => {
    const correct = memberName(entry.saidByMemberId);
    if (!correct) return null;
    const distractors = pickDistractors(names, correct, 3);
    if (distractors.length < 2) return null;
    const choices = shuffle([correct, ...distractors]);
    return {
      id: `whosaidit-${entry.id}`,
      saying: entry.term,
      meaning: entry.meaning,
      choices,
      correctIndex: choices.indexOf(correct),
    };
  });

  return questions.filter((q): q is WhoSaidItQuestion => q !== null);
}

// ---------------------------------------------------------------------------
// Language Flashcards — every dictionary entry (word/phrase/proverb/riddle/saying)
// used as a term/meaning flashcard pair. Self-graded rather than multiple-choice,
// since the answer is meant to be spoken/written in the family's own language.
// ---------------------------------------------------------------------------

export interface LanguageFlashcard {
  id: string;
  term: string;
  meaning: string;
  entryType: LanguageEntry['entryType'];
}

export function buildLanguageFlashcardDeck(data: FamilyDataset, count: number): LanguageFlashcard[] {
  const deck = shuffle(data.languageEntries).slice(0, count).map(e => ({
    id: `flashcard-${e.id}`,
    term: e.term,
    meaning: e.meaning,
    entryType: e.entryType,
  }));
  return deck;
}
