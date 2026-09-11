import type { FamilyDataset } from '../types';

/**
 * Turns the local part of an email address into a best-effort human name,
 * e.g. "john.kobia" -> "John Kobia". Used only as a last-resort fallback —
 * never shown when a real name is available.
 */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local
    .replace(/[._+-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
  return words.length ? words.join(' ') : email;
}

/**
 * Resolves the name that should be shown for a profile on the leaderboard
 * (and anywhere else attributing an action to a person) — preferring the
 * name of the family member that profile is linked to, then the profile's
 * own display name, and only falling back to an email-derived name or the
 * raw stored fallback if nothing better is available. This keeps the
 * leaderboard showing the name someone is known by in the family, not the
 * email address their account happens to be linked to.
 */
export function resolveDisplayName(
  data: Pick<FamilyDataset, 'profiles' | 'members'>,
  profileId: string | undefined,
  fallback: string
): string {
  const profile = profileId ? data.profiles.find(p => p.id === profileId) : undefined;
  if (profile?.memberId) {
    const member = data.members.find(m => m.id === profile.memberId);
    if (member) {
      const name = `${member.firstName} ${member.lastName}`.trim();
      if (name) return name;
    }
  }
  if (profile?.displayName && profile.displayName !== profile.email) {
    return profile.displayName;
  }
  if (profile?.email) {
    return nameFromEmail(profile.email);
  }
  return fallback;
}
