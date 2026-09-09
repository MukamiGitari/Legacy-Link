import type { Role } from '../types';

// Accept `Role | undefined` since currentProfile can briefly be unresolved
// (e.g. before the session/profile has loaded) — treat that as no permissions.

/** Family Admins and Super Admins can manage the Admin Suite, delete records, and manage roles. */
export const isAdminRole = (role: Role | undefined): boolean =>
  role === 'family_admin' || role === 'super_admin';

/** Everyone except Guests can add content (members, photos, memories, events, announcements, chronicle eras). */
export const canAddContent = (role: Role | undefined): boolean => role != null && role !== 'guest';

/** Only admins can permanently remove records — mirrors the *_delete RLS policies in schema.sql. */
export const canDelete = (role: Role | undefined): boolean => isAdminRole(role);

/** A legacy memory can be removed by the admin team or by whoever originally posted it. */
export const canRemoveLegacyContribution = (
  role: Role | undefined,
  currentProfileId: string | undefined,
  authorProfileId: string | undefined
): boolean => isAdminRole(role) || (!!currentProfileId && currentProfileId === authorProfileId);
