import type { Member, Relationship } from '../types';
import { getChildren, getSpouses } from './lineage';

export interface TreeUnit {
  id: string;
  members: Member[]; // 1 member, or a couple (member + spouse[s])
  children: TreeUnit[];
}

/**
 * Builds a forest of TreeUnits from the flat members/relationships lists.
 * Each unit groups a person with their spouse(s) so couples render as one
 * node; children hang beneath the unit that contains either blood parent.
 */
export function buildForest(members: Member[], relationships: Relationship[]): TreeUnit[] {
  if (members.length === 0) return [];
  const minGen = Math.min(...members.map(m => m.generation));
  const visited = new Set<string>();
  const byId = new Map(members.map(m => [m.id, m]));

  function buildUnit(memberId: string): TreeUnit | null {
    if (visited.has(memberId)) return null;
    const self = byId.get(memberId);
    if (!self) return null;

    const spouseIds = getSpouses(memberId, relationships).filter(id => !visited.has(id) && byId.has(id));
    visited.add(memberId);
    spouseIds.forEach(id => visited.add(id));

    const unitMembers = [self, ...spouseIds.map(id => byId.get(id)!)];

    const childIdSet = new Set<string>();
    unitMembers.forEach(m => getChildren(m.id, relationships).forEach(cid => childIdSet.add(cid)));

    const children = Array.from(childIdSet)
      .map(cid => buildUnit(cid))
      .filter((u): u is TreeUnit => Boolean(u))
      // keep birth order roughly stable via date of birth
      .sort((a, b) => {
        const da = a.members[0].dateOfBirth ?? '';
        const db = b.members[0].dateOfBirth ?? '';
        return da.localeCompare(db);
      });

    return { id: `unit-${memberId}`, members: unitMembers, children };
  }

  const roots: TreeUnit[] = [];
  members
    .filter(m => m.generation === minGen)
    .forEach(m => {
      const unit = buildUnit(m.id);
      if (unit) roots.push(unit);
    });

  // Catch any members never reached (orphans / disconnected records)
  members.forEach(m => {
    if (!visited.has(m.id)) {
      const unit = buildUnit(m.id);
      if (unit) roots.push(unit);
    }
  });

  return roots;
}
