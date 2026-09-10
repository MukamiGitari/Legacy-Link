// Family Trivia question generation.
//
// "Our Family" questions are generated live from the family's own dataset
// (members, relationships) so every family sees a different quiz. "History"
// and "Geography" pull from small static banks of general-knowledge questions,
// since there's no per-family data to draw those from.

import type { FamilyDataset, Member, TriviaCategory } from '../types';
import { fullName, getParents, getChildren, getSpouses } from './lineage';

export interface TriviaQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

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

function makeMCQ(id: string, prompt: string, correct: string, distractorPool: string[]): TriviaQuestion | null {
  const distractors = pickDistractors(distractorPool, correct, 3);
  if (distractors.length < 2) return null; // not enough data to build plausible wrong answers
  const choices = shuffle([correct, ...distractors]);
  return { id, prompt, choices, correctIndex: choices.indexOf(correct) };
}

// ---------------------------------------------------------------------------
// "Our Family" — generated live from the family's own dataset
// ---------------------------------------------------------------------------

function buildOurFamilyQuestions(data: FamilyDataset): TriviaQuestion[] {
  const { members, relationships } = data;
  const questions: TriviaQuestion[] = [];

  const birthPlaces = Array.from(new Set(members.map(m => m.birthPlace).filter((v): v is string => !!v)));
  const occupations = Array.from(new Set(members.map(m => m.occupation).filter((v): v is string => !!v)));
  const names = members.map(fullName);

  members.forEach(mem => {
    const name = fullName(mem);

    if (mem.birthPlace) {
      const q = makeMCQ(`birthplace-${mem.id}`, `Where was ${name} born?`, mem.birthPlace, birthPlaces);
      if (q) questions.push(q);
    }

    if (mem.occupation) {
      const q = makeMCQ(`occupation-${mem.id}`, `What was ${name}'s occupation?`, mem.occupation, occupations);
      if (q) questions.push(q);
    }

    if (mem.dateOfBirth) {
      const year = new Date(mem.dateOfBirth).getFullYear().toString();
      const otherYears = members
        .filter(o => o.id !== mem.id && o.dateOfBirth)
        .map(o => new Date(o.dateOfBirth!).getFullYear().toString());
      const q = makeMCQ(`birthyear-${mem.id}`, `What year was ${name} born?`, year, otherYears);
      if (q) questions.push(q);
    }

    const parents = getParents(mem.id, relationships).map(id => members.find(m => m.id === id)).filter((m): m is Member => !!m);
    if (parents.length > 0) {
      const parentName = fullName(parents[0]);
      const q = makeMCQ(`parent-${mem.id}`, `Who is a parent of ${name}?`, parentName, names);
      if (q) questions.push(q);
    }

    const spouses = getSpouses(mem.id, relationships).map(id => members.find(m => m.id === id)).filter((m): m is Member => !!m);
    if (spouses.length > 0) {
      const spouseName = fullName(spouses[0]);
      const q = makeMCQ(`spouse-${mem.id}`, `Who is married to ${name}?`, spouseName, names);
      if (q) questions.push(q);
    }

    const children = getChildren(mem.id, relationships).map(id => members.find(m => m.id === id)).filter((m): m is Member => !!m);
    if (children.length > 0) {
      const childName = fullName(children[Math.floor(Math.random() * children.length)]);
      const q = makeMCQ(`child-${mem.id}`, `Who is a child of ${name}?`, childName, names);
      if (q) questions.push(q);
    }
  });

  return shuffle(questions);
}

// ---------------------------------------------------------------------------
// Static banks — general knowledge, not tied to any specific family
// ---------------------------------------------------------------------------

const HISTORY_BANK: TriviaQuestion[] = [
  { id: 'h1', prompt: 'Which decade is often called the "Roaring" decade for its economic boom and cultural change?', choices: ['The 1920s', 'The 1950s', 'The 1970s', 'The 1990s'], correctIndex: 0 },
  { id: 'h2', prompt: 'The first successful powered airplane flight took place in which US state?', choices: ['California', 'North Carolina', 'Texas', 'Florida'], correctIndex: 1 },
  { id: 'h3', prompt: 'Which invention is most credited with connecting far-apart family members in the early 20th century?', choices: ['The telephone', 'The television', 'The internet', 'The fax machine'], correctIndex: 0 },
  { id: 'h4', prompt: 'In which decade did most of Africa gain independence from colonial rule?', choices: ['The 1940s', 'The 1960s', 'The 1980s', 'The 2000s'], correctIndex: 1 },
  { id: 'h5', prompt: 'Which global event most defined the 1940s?', choices: ['The Space Race', 'World War II', 'The Cold War', 'The Great Depression'], correctIndex: 1 },
  { id: 'h6', prompt: 'The Great Depression began in which year?', choices: ['1919', '1929', '1939', '1949'], correctIndex: 1 },
  { id: 'h7', prompt: 'Which mode of long-distance travel became widely affordable to families starting in the 1960s?', choices: ['Commercial air travel', 'Space travel', 'High-speed rail', 'Cruise ships'], correctIndex: 0 },
  { id: 'h8', prompt: 'Color television became common in most households during which decade?', choices: ['The 1950s', 'The 1960s', 'The 1980s', 'The 2000s'], correctIndex: 1 },
  { id: 'h9', prompt: 'Which technology most changed how families kept in touch across countries in the 2000s?', choices: ['Mobile phones and the internet', 'Radio', 'Telegrams', 'Postal mail'], correctIndex: 0 },
  { id: 'h10', prompt: 'The moon landing, a moment many grandparents remember watching live, happened in which year?', choices: ['1959', '1969', '1979', '1989'], correctIndex: 1 },
];

const GEOGRAPHY_BANK: TriviaQuestion[] = [
  { id: 'g1', prompt: 'Mount Kenya, the second-highest peak in Africa, is located in which country?', choices: ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia'], correctIndex: 0 },
  { id: 'g2', prompt: 'Which African country is home to the ancient city of Timbuktu?', choices: ['Mali', 'Nigeria', 'Ghana', 'Senegal'], correctIndex: 0 },
  { id: 'g3', prompt: 'What is the longest river in the world, which flows through several African countries?', choices: ['The Amazon', 'The Nile', 'The Congo', 'The Niger'], correctIndex: 1 },
  { id: 'g4', prompt: 'Which country has the largest population in Africa?', choices: ['Kenya', 'Nigeria', 'Egypt', 'South Africa'], correctIndex: 1 },
  { id: 'g5', prompt: "Victoria Falls, one of the world's largest waterfalls, sits on the border of Zambia and which other country?", choices: ['Zimbabwe', 'Botswana', 'Mozambique', 'Malawi'], correctIndex: 0 },
  { id: 'g6', prompt: 'Which is the largest continent by land area?', choices: ['Africa', 'Asia', 'North America', 'Europe'], correctIndex: 1 },
  { id: 'g7', prompt: 'The Great Rift Valley, which runs through Kenya, stretches across how many continents?', choices: ['One', 'Two', 'Three', 'Four'], correctIndex: 1 },
  { id: 'g8', prompt: 'Which ocean lies to the east of the African continent?', choices: ['The Atlantic Ocean', 'The Indian Ocean', 'The Pacific Ocean', 'The Arctic Ocean'], correctIndex: 1 },
  { id: 'g9', prompt: 'What is the capital city of Kenya?', choices: ['Mombasa', 'Nairobi', 'Kisumu', 'Nakuru'], correctIndex: 1 },
  { id: 'g10', prompt: 'Which desert is the largest in Africa?', choices: ['The Kalahari', 'The Namib', 'The Sahara', 'The Sahel'], correctIndex: 2 },
];

/** Builds a shuffled round of questions for the given category. */
export function buildTriviaRound(data: FamilyDataset, category: TriviaCategory, count = 8): TriviaQuestion[] {
  let pool: TriviaQuestion[];
  if (category === 'our_family') {
    pool = buildOurFamilyQuestions(data);
    // Not enough family data to build a full round — fill any remainder
    // with general-knowledge questions so the quiz never comes up short.
    if (pool.length < count) pool = [...pool, ...shuffle([...HISTORY_BANK, ...GEOGRAPHY_BANK])];
  } else if (category === 'history') {
    pool = shuffle(HISTORY_BANK);
  } else {
    pool = shuffle(GEOGRAPHY_BANK);
  }
  return pool.slice(0, count).map((q, i) => ({ ...q, id: `${category}-${i}-${q.id}` }));
}

export const CATEGORY_LABEL: Record<TriviaCategory, string> = {
  our_family: 'Our Family',
  history: 'History',
  geography: 'Geography',
};
