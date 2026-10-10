import type { Member, Relationship, Lineage } from '../types';

export function getParents(memberId: string, rels: Relationship[]): string[] {
  return rels
    .filter(r => r.relationshipType === 'parent' && r.toMemberId === memberId)
    .map(r => r.fromMemberId);
}

export function getChildren(memberId: string, rels: Relationship[]): string[] {
  return rels
    .filter(r => r.relationshipType === 'parent' && r.fromMemberId === memberId)
    .map(r => r.toMemberId);
}

export function getSpouses(memberId: string, rels: Relationship[]): string[] {
  return rels
    .filter(r => r.relationshipType === 'spouse' && r.fromMemberId === memberId)
    .map(r => r.toMemberId);
}

export function getSiblings(memberId: string, rels: Relationship[]): string[] {
  const parents = getParents(memberId, rels);
  const siblingSet = new Set<string>();
  parents.forEach(p => {
    getChildren(p, rels).forEach(c => {
      if (c !== memberId) siblingSet.add(c);
    });
  });
  return Array.from(siblingSet);
}

/**
 * Walks every ancestor of a member, all the way back to the root(s) —
 * however many centuries of parent links exist. Returns them ordered
 * oldest-first (root ancestor last-walked is placed first in the array).
 */
export function getAllAncestors(memberId: string, members: Member[], rels: Relationship[]): Member[] {
  const byId = (id: string) => members.find(m => m.id === id);
  const seen = new Set<string>();
  const result: Member[] = [];

  const walkUp = (id: string) => {
    getParents(id, rels).forEach(parentId => {
      if (seen.has(parentId)) return; // guard against accidental cycles / already-visited shared ancestors
      seen.add(parentId);
      const parent = byId(parentId);
      if (parent) result.push(parent);
      walkUp(parentId);
    });
  };

  walkUp(memberId);
  return result.sort((a, b) => a.generation - b.generation);
}

/**
 * Walks every descendant of a member — children, grandchildren, and so on —
 * with no depth limit.
 */
export function getAllDescendants(memberId: string, members: Member[], rels: Relationship[]): Member[] {
  const byId = (id: string) => members.find(m => m.id === id);
  const seen = new Set<string>();
  const result: Member[] = [];

  const walkDown = (id: string) => {
    getChildren(id, rels).forEach(childId => {
      if (seen.has(childId)) return;
      seen.add(childId);
      const child = byId(childId);
      if (child) result.push(child);
      walkDown(childId);
    });
  };

  walkDown(memberId);
  return result.sort((a, b) => a.generation - b.generation);
}

export function getGrandparents(memberId: string, rels: Relationship[]): string[] {
  const parents = getParents(memberId, rels);
  const set = new Set<string>();
  parents.forEach(p => getParents(p, rels).forEach(gp => set.add(gp)));
  return Array.from(set);
}

export function getGrandchildren(memberId: string, rels: Relationship[]): string[] {
  const children = getChildren(memberId, rels);
  const set = new Set<string>();
  children.forEach(c => getChildren(c, rels).forEach(gc => set.add(gc)));
  return Array.from(set);
}

/**
 * Great-grandchildren and beyond — every descendant not already covered by
 * getChildren/getGrandchildren, however many generations deep the tree goes.
 */
export function getOtherDescendants(memberId: string, members: Member[], rels: Relationship[]): Member[] {
  const all = getAllDescendants(memberId, members, rels);
  const children = new Set(getChildren(memberId, rels));
  const grandchildren = new Set(getGrandchildren(memberId, rels));
  return all.filter(m => !children.has(m.id) && !grandchildren.has(m.id));
}

export function getLineage(memberId: string, members: Member[], rels: Relationship[]): Lineage {
  const byId = (id: string) => members.find(m => m.id === id);
  const toMembers = (ids: string[]) => ids.map(byId).filter((m): m is Member => Boolean(m));

  return {
    parents: toMembers(getParents(memberId, rels)),
    spouse: toMembers(getSpouses(memberId, rels)),
    children: toMembers(getChildren(memberId, rels)),
    siblings: toMembers(getSiblings(memberId, rels)),
  };
}

export const WIFE_COLORS = [
  { name: 'Rose', ring: '#e11d48', bg: '#ffe4e6', text: '#9f1239', border: '#f43f5e', line: '#f43f5e', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-200' },
  { name: 'Teal', ring: '#0d9488', bg: '#ccfbf1', text: '#115e59', border: '#14b8a6', line: '#14b8a6', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border-teal-200' },
  { name: 'Amber', ring: '#d97706', bg: '#fef3c7', text: '#92400e', border: '#f59e0b', line: '#f59e0b', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200' },
  { name: 'Indigo', ring: '#4f46e5', bg: '#e0e7ff', text: '#3730a3', border: '#6366f1', line: '#6366f1', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-200' },
  { name: 'Emerald', ring: '#059669', bg: '#d1fae5', text: '#065f46', border: '#10b981', line: '#10b981', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200' },
  { name: 'Purple', ring: '#9333ea', bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7', line: '#a855f7', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-200' },
];

export function getWifeOrdinal(index: number): string {
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  return ordinals[index] || `${index + 1}th`;
}

export function getWifeLabel(index: number, member: Member, rel?: Relationship, totalSpouses: number = 1): string {
  const term = member.gender === 'male' ? 'husband' : 'wife';
  let label = totalSpouses > 1 ? `${getWifeOrdinal(index)} ${term}` : (term.charAt(0).toUpperCase() + term.slice(1));
  if (!member.isLiving) {
    label += ' · late';
  } else if (rel?.endedAt) {
    label += ' · former';
  }
  return label;
}

export function getFullSiblings(memberId: string, rels: Relationship[]): string[] {
  const parents = getParents(memberId, rels);
  if (parents.length < 2) {
    const allSiblings = getSiblings(memberId, rels);
    return allSiblings.filter(sibId => {
      const sibParents = getParents(sibId, rels);
      return parents.every(p => sibParents.includes(p)) && sibParents.length === parents.length;
    });
  }
  const [p1, p2] = parents;
  const p1Children = new Set(getChildren(p1, rels));
  const p2Children = new Set(getChildren(p2, rels));
  return Array.from(p1Children).filter(cid => cid !== memberId && p2Children.has(cid));
}

export function getHalfSiblings(memberId: string, rels: Relationship[]): string[] {
  const allSiblings = new Set(getSiblings(memberId, rels));
  const fullSiblings = new Set(getFullSiblings(memberId, rels));
  return Array.from(allSiblings).filter(id => !fullSiblings.has(id));
}

/**
 * The people the tree starts from. Members flagged as founders win; if nobody is flagged
 * (older data) it falls back to the lowest generation number, as before. The flag matters
 * when in-laws are entered a generation "before" the founder — without it they'd become the roots.
 */
export function getFoundingAncestors(members: Member[]): Member[] {
  if (members.length === 0) return [];
  const flagged = members.filter(m => m.isFounder);
  if (flagged.length > 0) return flagged;
  const minGen = Math.min(...members.map(m => m.generation));
  return members.filter(m => m.generation === minGen);
}

export function getRoots(members: Member[], _rels: Relationship[]): Member[] {
  return getFoundingAncestors(members);
}

export function membersByGeneration(members: Member[]): Map<number, Member[]> {
  const map = new Map<number, Member[]>();
  members.forEach(m => {
    if (!map.has(m.generation)) map.set(m.generation, []);
    map.get(m.generation)!.push(m);
  });
  return map;
}

export function relationshipTerm(distance: number, direction: 'ancestor' | 'descendant'): string {
  if (distance <= 1) return direction === 'ancestor' ? 'Parent' : 'Child';
  const greats = distance - 2;
  const base = direction === 'ancestor' ? 'grandparent' : 'grandchild';
  const label = `${'great-'.repeat(greats)}${base}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function fullName(m: Member): string {
  return `${m.firstName} ${m.lastName}`;
}

export function lifespan(m: Member): string {
  const born = m.dateOfBirth ? new Date(m.dateOfBirth).getFullYear() : '?';
  if (!m.isLiving) {
    const died = m.dateOfPassing ? new Date(m.dateOfPassing).getFullYear() : '?';
    return `${born} – ${died}`;
  }
  return `b. ${born}`;
}

export interface DerivedInLaw {
  member: Member;
  role:
    | 'father_in_law'
    | 'mother_in_law'
    | 'parent_in_law'
    | 'brother_in_law'
    | 'sister_in_law'
    | 'sibling_in_law'
    | 'son_in_law'
    | 'daughter_in_law'
    | 'child_in_law'
    | 'co_in_law';
  label: string;
  connection: string;
  category: 'parents_in_law' | 'siblings_in_law' | 'children_in_law' | 'extended_in_law';
}

/**
 * Determines whether a member is in the core bloodline (i.e. one of the founding
 * root ancestors or a direct blood descendant of the founding ancestors).
 */
export function isBloodlineMember(memberId: string, members: Member[], rels: Relationship[]): boolean {
  if (members.length === 0) return false;
  const rootIds = new Set(getFoundingAncestors(members).map(r => r.id));
  if (rootIds.has(memberId)) return true;

  const visited = new Set<string>();
  const queue = [memberId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const parents = getParents(current, rels);
    for (const p of parents) {
      if (rootIds.has(p)) return true;
      queue.push(p);
    }
  }
  return false;
}

/**
 * Determines whether a member is married into the family (i.e. has a spouse in
 * the bloodline but is not a direct blood descendant themselves).
 */
export function isMarriedIn(memberId: string, members: Member[], rels: Relationship[]): boolean {
  const spouses = getSpouses(memberId, rels);
  if (spouses.length === 0) return false;
  const isBlood = isBloodlineMember(memberId, members, rels);
  if (isBlood) return false;
  return spouses.some(sId => isBloodlineMember(sId, members, rels));
}

/**
 * Returns a spouse's parents and siblings (in-laws from the bloodline perspective).
 */
export function getSpouseFamily(spouseId: string, members: Member[], rels: Relationship[]): { parents: Member[]; siblings: Member[] } {
  const byId = (id: string) => members.find(m => m.id === id);
  const parents = getParents(spouseId, rels).map(byId).filter((m): m is Member => Boolean(m));
  const siblings = getSiblings(spouseId, rels).map(byId).filter((m): m is Member => Boolean(m));
  return { parents, siblings };
}

/**
 * Computes all derived in-law relationships for a member based on existing links:
 * - Parents-in-law: Father-in-law, Mother-in-law (spouse's parents)
 * - Siblings-in-law: Brother-in-law, Sister-in-law (spouse's siblings OR sibling's spouses)
 * - Children-in-law: Son-in-law, Daughter-in-law (child's spouses)
 */
export function getDerivedInLawRelationships(memberId: string, members: Member[], rels: Relationship[]): DerivedInLaw[] {
  const byId = (id: string) => members.find(m => m.id === id);
  const results: DerivedInLaw[] = [];
  const seen = new Set<string>();

  const self = byId(memberId);
  if (!self) return [];

  const spouses = getSpouses(memberId, rels).map(byId).filter((m): m is Member => Boolean(m));
  const siblings = getSiblings(memberId, rels).map(byId).filter((m): m is Member => Boolean(m));
  const children = getChildren(memberId, rels).map(byId).filter((m): m is Member => Boolean(m));

  // 1. Parents-in-law (Spouse's parents)
  spouses.forEach(s => {
    const sParents = getParents(s.id, rels).map(byId).filter((m): m is Member => Boolean(m));
    sParents.forEach(p => {
      if (p.id === memberId || seen.has(p.id)) return;
      seen.add(p.id);
      const label = p.gender === 'male' ? 'Father-in-law' : p.gender === 'female' ? 'Mother-in-law' : 'Parent-in-law';
      results.push({
        member: p,
        role: p.gender === 'male' ? 'father_in_law' : p.gender === 'female' ? 'mother_in_law' : 'parent_in_law',
        label,
        connection: `${s.firstName}'s ${p.gender === 'male' ? 'father' : p.gender === 'female' ? 'mother' : 'parent'}`,
        category: 'parents_in_law',
      });
    });
  });

  // 2a. Siblings-in-law (Spouse's siblings)
  spouses.forEach(s => {
    const sSiblings = getSiblings(s.id, rels).map(byId).filter((m): m is Member => Boolean(m));
    sSiblings.forEach(sib => {
      if (sib.id === memberId || seen.has(sib.id)) return;
      seen.add(sib.id);
      const label = sib.gender === 'male' ? 'Brother-in-law' : sib.gender === 'female' ? 'Sister-in-law' : 'Sibling-in-law';
      results.push({
        member: sib,
        role: sib.gender === 'male' ? 'brother_in_law' : sib.gender === 'female' ? 'sister_in_law' : 'sibling_in_law',
        label,
        connection: `${s.firstName}'s ${sib.gender === 'male' ? 'brother' : sib.gender === 'female' ? 'sister' : 'sibling'}`,
        category: 'siblings_in_law',
      });
    });
  });

  // 2b. Siblings-in-law (Sibling's spouses)
  siblings.forEach(sib => {
    const sibSpouses = getSpouses(sib.id, rels).map(byId).filter((m): m is Member => Boolean(m));
    sibSpouses.forEach(sp => {
      if (sp.id === memberId || seen.has(sp.id)) return;
      seen.add(sp.id);
      const label = sp.gender === 'male' ? 'Brother-in-law' : sp.gender === 'female' ? 'Sister-in-law' : 'Sibling-in-law';
      results.push({
        member: sp,
        role: sp.gender === 'male' ? 'brother_in_law' : sp.gender === 'female' ? 'sister_in_law' : 'sibling_in_law',
        label,
        connection: `${sib.firstName}'s ${sp.gender === 'male' ? 'husband' : sp.gender === 'female' ? 'wife' : 'spouse'}`,
        category: 'siblings_in_law',
      });
    });
  });

  // 3. Children-in-law (Child's spouses)
  children.forEach(c => {
    const cSpouses = getSpouses(c.id, rels).map(byId).filter((m): m is Member => Boolean(m));
    cSpouses.forEach(csp => {
      if (csp.id === memberId || seen.has(csp.id)) return;
      seen.add(csp.id);
      const label = csp.gender === 'male' ? 'Son-in-law' : csp.gender === 'female' ? 'Daughter-in-law' : 'Child-in-law';
      results.push({
        member: csp,
        role: csp.gender === 'male' ? 'son_in_law' : csp.gender === 'female' ? 'daughter_in_law' : 'child_in_law',
        label,
        connection: `${c.firstName}'s ${csp.gender === 'male' ? 'husband' : csp.gender === 'female' ? 'wife' : 'spouse'}`,
        category: 'children_in_law',
      });
    });
  });

  return results;
}

