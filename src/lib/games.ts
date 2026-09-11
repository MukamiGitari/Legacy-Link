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

// ---------------------------------------------------------------------------
// Scrabble Tiles — unscramble a word drawn from the family dictionary (or, if
// that's thin, a relative's first name) using letter tiles scored like Scrabble.
// ---------------------------------------------------------------------------

// Standard English Scrabble letter values.
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

export function tileValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] ?? 1;
}

export interface ScrabbleTile {
  id: string;
  letter: string;
}

export interface ScrabbleWord {
  id: string;
  answer: string; // uppercase letters only, no spaces
  clue: string;
  source: 'dictionary' | 'name';
  tiles: ScrabbleTile[]; // shuffled, ready to place
  points: number; // sum of letter values, awarded on a correct solve
}

function toLetters(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, '');
}

export function buildScrabbleRound(data: FamilyDataset, count: number): ScrabbleWord[] {
  const fromDictionary = data.languageEntries
    .map(e => ({ letters: toLetters(e.term), clue: e.meaning, source: 'dictionary' as const }))
    .filter(w => w.letters.length >= 3 && w.letters.length <= 9);

  const fromNames = data.members
    .map(m => ({ letters: toLetters(m.firstName), clue: "A family member's first name", source: 'name' as const }))
    .filter(w => w.letters.length >= 3 && w.letters.length <= 9);

  const seen = new Set<string>();
  const pool = shuffle([...fromDictionary, ...fromNames]).filter(w => {
    if (seen.has(w.letters)) return false;
    seen.add(w.letters);
    return true;
  });

  return pool.slice(0, count).map((w, i) => {
    const letters = w.letters.split('');
    let scrambled = shuffle(letters);
    // Make sure the tiles don't already sit in solved order.
    if (scrambled.join('') === letters.join('') && letters.length > 1) {
      scrambled = [scrambled[1], scrambled[0], ...scrambled.slice(2)];
    }
    return {
      id: `scrabble-${i}-${w.letters}`,
      answer: w.letters,
      clue: w.clue,
      source: w.source,
      tiles: scrambled.map((letter, idx) => ({ id: `t${idx}-${letter}`, letter })),
      points: letters.reduce((sum, l) => sum + tileValue(l), 0),
    };
  });
}
