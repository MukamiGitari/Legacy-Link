import type { Member, Relationship } from '../types';
import { getChildren, getSpouses, WIFE_COLORS, getWifeLabel, getSpouseFamily, isBloodlineMember } from './lineage';

export interface WifeLine {
  spouse: Member;
  relationship?: Relationship;
  order: number;
  label: string;
  color: typeof WIFE_COLORS[number];
  children: TreeUnit[];
  inLawFamily: {
    parents: Member[];
    siblings: Member[];
  };
}

export interface TreeUnit {
  id: string;
  head: Member;
  members: Member[]; // [head, ...spouses] in marriage order
  wives: WifeLine[];
  unassignedChildren: TreeUnit[];
  children: TreeUnit[];
}

/**
 * Builds a forest of TreeUnits (Houses) from the flat members/relationships lists.
 * Each unit groups a person with their spouse(s) in marriage order, assigning
 * each wife her own distinct color, title ("First wife", "Second wife"), and
 * grouping children strictly under their biological mother.
 */
export function buildForest(
  members: Member[],
  relationships: Relationship[],
  options?: { filter?: 'bloodline' | 'inlaws' }
): TreeUnit[] {
  if (members.length === 0) return [];
  const filter = options?.filter ?? 'bloodline';
  const minGen = Math.min(...members.map(m => m.generation));
  const visited = new Set<string>();
  const byId = new Map(members.map(m => [m.id, m]));

  const spouseRels = relationships.filter(r => r.relationshipType === 'spouse');
  const getSpouseRel = (m1: string, m2: string) =>
    spouseRels.find(r => (r.fromMemberId === m1 && r.toMemberId === m2) || (r.fromMemberId === m2 && r.toMemberId === m1));

  function buildUnit(memberId: string): TreeUnit | null {
    if (visited.has(memberId)) return null;
    const self = byId.get(memberId);
    if (!self) return null;

    const rawSpouseIds = getSpouses(memberId, relationships).filter(id => !visited.has(id) && byId.has(id));
    visited.add(memberId);
    rawSpouseIds.forEach(id => visited.add(id));

    // Sort spouses by marriage date (startedAt) ascending, then birth date
    const sortedSpouses = rawSpouseIds
      .map(id => ({ member: byId.get(id)!, rel: getSpouseRel(memberId, id) }))
      .sort((a, b) => {
        const da = a.rel?.startedAt ?? '';
        const db = b.rel?.startedAt ?? '';
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return (a.member.dateOfBirth ?? '').localeCompare(b.member.dateOfBirth ?? '');
      });

    const unitMembers = [self, ...sortedSpouses.map(s => s.member)];

    // Find all children for the unit members
    const allChildIdSet = new Set<string>();
    unitMembers.forEach(m => getChildren(m.id, relationships).forEach(cid => allChildIdSet.add(cid)));

    // Group children by wife/mother
    const assignedChildIds = new Set<string>();
    const wives: WifeLine[] = sortedSpouses.map((s, idx) => {
      const wifeChildIds = getChildren(s.member.id, relationships).filter(cid => allChildIdSet.has(cid));
      wifeChildIds.forEach(cid => assignedChildIds.add(cid));

      const children = wifeChildIds
        .map(cid => buildUnit(cid))
        .filter((u): u is TreeUnit => Boolean(u))
        .sort((a, b) => (a.head.dateOfBirth ?? '').localeCompare(b.head.dateOfBirth ?? ''));

      const inLawFamily = getSpouseFamily(s.member.id, members, relationships);

      return {
        spouse: s.member,
        relationship: s.rel,
        order: idx,
        label: getWifeLabel(idx, s.member, s.rel, sortedSpouses.length),
        color: WIFE_COLORS[idx % WIFE_COLORS.length],
        children,
        inLawFamily,
      };
    });

    // Unassigned children (mother not recorded among the spouses)
    const unassignedChildIds = Array.from(allChildIdSet).filter(cid => !assignedChildIds.has(cid));
    const unassignedChildren = unassignedChildIds
      .map(cid => buildUnit(cid))
      .filter((u): u is TreeUnit => Boolean(u))
      .sort((a, b) => (a.head.dateOfBirth ?? '').localeCompare(b.head.dateOfBirth ?? ''));

    const allChildren = [
      ...wives.flatMap(w => w.children),
      ...unassignedChildren,
    ];

    return {
      id: `unit-${memberId}`,
      head: self,
      members: unitMembers,
      wives,
      unassignedChildren,
      children: allChildren,
    };
  }

  const roots: TreeUnit[] = [];

  // Founding roots
  members
    .filter(m => {
      if (filter === 'bloodline') {
        return m.generation === minGen && isBloodlineMember(m.id, members, relationships);
      }
      return m.generation === minGen;
    })
    .forEach(m => {
      const unit = buildUnit(m.id);
      if (unit) roots.push(unit);
    });

  // When 'inlaws' is selected, also catch any disconnected member roots
  if (filter === 'inlaws') {
    members.forEach(m => {
      if (!visited.has(m.id)) {
        const unit = buildUnit(m.id);
        if (unit) roots.push(unit);
      }
    });
  }

  return roots;
}

