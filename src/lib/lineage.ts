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

export function getWifeLabel(index: number, member: Member, rel?: Relationship): string {
  const ordinal = getWifeOrdinal(index);
  const term = member.gender === 'male' ? 'husband' : 'wife';
  let label = `${ordinal} ${term}`;
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

export function getRoots(members: Member[], rels: Relationship[]): Member[] {
  const minGen = Math.min(...members.map(m => m.generation));
  return members.filter(m => m.generation === minGen);
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
