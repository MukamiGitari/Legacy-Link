export type Gender = 'male' | 'female' | 'other';

export type TreeTemplate =
  | 'classic'
  | 'timeline'
  | 'photo'
  | 'radial'
  | 'minimalist'
  | 'heritage';

export type Role = 'super_admin' | 'family_admin' | 'family_member' | 'guest';

export interface Member {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  generation: number;
  avatarUrl?: string;
  isLiving: boolean;
  dateOfBirth?: string;
  dateOfPassing?: string;
  birthPlace?: string;
  restingPlace?: string;
  occupation?: string;
  bio?: string;
}

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'adoptive_parent'
  | 'adoptive_child'
  | 'step_parent'
  | 'step_child';

export interface Relationship {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: RelationshipType;
  startedAt?: string;
  endedAt?: string;
}

export interface Album {
  id: string;
  familyId: string;
  title: string;
  category: 'weddings' | 'reunions' | 'childhood' | 'historical' | 'memorials' | 'holidays';
  description?: string;
  coverPhotoUrl?: string;
}

export interface Photo {
  id: string;
  albumId: string;
  familyId: string;
  url: string;
  caption?: string;
  takenAt?: string;
  taggedMemberIds: string[];
}

export interface Memory {
  id: string;
  familyId: string;
  title: string;
  body: string;
  era?: string;
  authorMemberId?: string;
  coverPhotoUrl?: string;
  relatedMemberIds: string[];
  createdAt: string;
}

export type EventType = 'reunion' | 'birthday' | 'memorial' | 'meeting' | 'other';
export type RsvpStatus = 'invited' | 'going' | 'maybe' | 'declined';

export interface FamilyEvent {
  id: string;
  familyId: string;
  title: string;
  eventType: EventType;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  rsvps: { memberId: string; status: RsvpStatus }[];
}

export type AnnouncementPriority = 'urgent' | 'important' | 'normal';

export interface Announcement {
  id: string;
  familyId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  postedByMemberId?: string;
  createdAt: string;
}

/**
 * A structured 8-section life biography for a member, one row per member.
 * Editable by anyone who can add content (see canAddContent); the `legacy`
 * field is the member-owner's/editor's own words, distinct from the
 * crowd-sourced LegacyContribution entries relatives add underneath it.
 */
export interface Biography {
  id: string;
  familyId: string;
  memberId: string;
  atAGlance?: string;
  earlyLifeFamily?: string;
  youngAdulthood?: string;
  marriageFamilyLife?: string;
  workAchievementsPassions?: string;
  storiesMemoriesTitle?: string;
  storiesMemories?: string;
  laterYears?: string;
  legacy?: string;
  updatedAt: string;
  updatedByProfileId?: string;
}

/**
 * A short memory or tribute any family member can add to someone's Legacy
 * section — "what descendants remember most about them" — optionally
 * tagging other relatives who were part of the story.
 */
export interface LegacyContribution {
  id: string;
  familyId: string;
  memberId: string; // whose Legacy section this is attached to
  authorProfileId?: string;
  authorName: string;
  body: string;
  taggedMemberIds: string[];
  createdAt: string;
}

export interface ChronicleEra {
  id: string;
  familyId: string;
  eraLabel: string;
  sortOrder: number;
  headline: string;
  narrative?: string;
  photoUrl?: string;
}

export interface Profile {
  id: string;
  familyId: string;
  memberId?: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: Role;
}

export interface InvitationCode {
  id: string;
  familyId: string;
  code: string;
  role: Exclude<Role, 'super_admin'>;
  memberId?: string;
  redeemedByProfileId?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  familyId: string;
  actorName: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  motto?: string;
  originStory?: string;
  coverPhotoUrl?: string;
  activeTreeTemplate: TreeTemplate;
}

export interface FamilyDataset {
  family: Family;
  members: Member[];
  relationships: Relationship[];
  albums: Album[];
  photos: Photo[];
  memories: Memory[];
  events: FamilyEvent[];
  announcements: Announcement[];
  chronicleEras: ChronicleEra[];
  biographies: Biography[];
  legacyContributions: LegacyContribution[];
  languageEntries: LanguageEntry[];
  profiles: Profile[];
  invitationCodes: InvitationCode[];
  restorationCodes: RestorationCode[];
  notifications: AppNotification[];
  auditLog: AuditLogEntry[];
}

export type LanguageEntryType = 'word' | 'phrase' | 'proverb' | 'riddle' | 'saying';

/**
 * One crowd-sourced entry in the family's language dictionary — a tribal-language word,
 * sentence, proverb, or riddle, contributed by any family member along with
 * its meaning (and, for riddles, the traditional answer). A 'saying' entry is
 * a personal catchphrase attributed to a specific family member (living or
 * passed on) rather than a piece of the wider tribal language — e.g. something
 * Grandpa always says at dinner — and can optionally be linked to that member.
 */
export interface LanguageEntry {
  id: string;
  familyId: string;
  entryType: LanguageEntryType;
  term: string;
  meaning: string;
  /** Only used for entryType 'riddle' — the traditional answer/reveal. */
  answer?: string;
  /** Only used for entryType 'saying' — which family member is known for saying this. */
  saidByMemberId?: string;
  contributedByProfileId?: string;
  contributedByName: string;
  createdAt: string;
}

export type NotificationKind = 'photo_tag' | 'legacy_tag' | 'memory_tag';

/** An in-app notification generated when a member is tagged somewhere, delivered to the
 *  login profile linked to that member (if any) via the notification bell in the Topbar. */
export interface AppNotification {
  id: string;
  familyId: string;
  profileId: string;
  kind: NotificationKind;
  message: string;
  relatedMemberId?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * A one-time password-restoration code an admin generates for a specific profile
 * so that person can regain access without knowing their old password.
 */
export interface RestorationCode {
  id: string;
  familyId: string;
  profileId: string;
  code: string;
  createdAt: string;
  redeemedAt?: string;
}

/** Derived lineage helper used by tree visualizers and the person drawer. */
export interface Lineage {
  parents: Member[];
  spouse: Member[];
  children: Member[];
  siblings: Member[];
}
