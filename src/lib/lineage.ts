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

/** Root ancestors = members in generation 1 (or with no parents recorded). */
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

/**
 * Converts a number of generations removed into the term people actually use
 * ("Grandparent", "Great-great-grandchild"), instead of a generic
 * "ancestor" / "descendant" + generation count.
 *   1 -> Parent / Child
 *   2 -> Grandparent / Grandchild
 *   3 -> Great-grandparent / Great-grandchild
 *   4 -> Great-great-grandparent / Great-great-grandchild, and so on.
 */
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
