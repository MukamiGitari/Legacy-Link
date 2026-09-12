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
  /** Basic Profile — professional title, distinct from `occupation` (e.g. "Senior Partner" vs "Law"). */
  professionalTitle?: string;
  /** Basic Profile — current organization/employer. */
  currentOrganization?: string;
  /** Basic Profile — current location (distinct from `birthPlace`). */
  location?: string;
  /** Basic Profile — contact or website links, one per line. */
  contactLinks?: string;
  /** Whether this member has a pet. When true, `petName` can optionally be set. */
  hasPet?: boolean;
  /** Only used when `hasPet` is true — the pet's name. */
  petName?: string;
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
  category: 'weddings' | 'reunions' | 'childhood' | 'historical' | 'memorials' | 'holidays' | 'birthdays';
  description?: string;
  coverPhotoUrl?: string;
  /** The family member this album is about (e.g. "Grandma's 80th Birthday" → Grandma). Shown as a tag next to the album title. */
  featuredMemberId?: string;
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

/**
 * Which visual/editorial style a cookbook album is presented in. Only
 * 'traditional' ships today (a warm, heirloom-style book with food photos and
 * family-story sections), but this is kept as its own field — rather than
 * folded into title/description — so more album styles can be offered later
 * (e.g. a modern minimalist layout, a holiday-specific book) without a schema
 * change, the same way Album['category'] anticipates more photo categories.
 */
export type CookbookAlbumStyle = 'traditional';

export interface CookbookAlbum {
  id: string;
  familyId: string;
  title: string;
  style: CookbookAlbumStyle;
  description?: string;
  coverPhotoUrl?: string;
  /** The family member this cookbook is about/dedicated to (e.g. "Grandma's Recipe Box"). */
  featuredMemberId?: string;
}

/** The four sections a recipe can live under — rendered as masonry slides, in this order. */
export type RecipeCategory = 'breakfast' | 'main' | 'snacks' | 'desserts';

export interface Recipe {
  id: string;
  albumId: string;
  familyId: string;
  title: string;
  category: RecipeCategory;
  /** Shown as a star badge on the recipe card, independent of its section. */
  isVegetarian?: boolean;
  photoUrl?: string;
  ingredients: string[];
  instructions: string[];
  /** Free-text so it can read "45 min", "1 hr 30 min", "Overnight + 20 min bake", etc. */
  cookTime?: string;
  /** The heirloom "family-story" section — who made this, when, and why it matters. */
  familyStory?: string;
  contributedByMemberId?: string;
  createdAt: string;
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
 * A structured biography for a member, one row per member, partitioned into
 * the sections of the Legacy Link biography template (Basic Profile lives on
 * the Member record itself — see firstName/lastName/avatarUrl/professionalTitle/
 * currentOrganization/location/contactLinks — everything else lives here).
 * Editable by anyone who can add content (see canAddContent); the `legacy`
 * field is the member-owner's/editor's own words, distinct from the
 * crowd-sourced LegacyContribution entries relatives add underneath it.
 */
export interface Biography {
  id: string;
  familyId: string;
  memberId: string;
  /** 2. Professional Summary — who they are, what they do, what they're known for. */
  professionalSummary?: string;
  /** 3. Early Life & Background — family/community background, childhood influences, early interests. */
  earlyLifeBackground?: string;
  /** 4. Education — primary/secondary, college/university, degrees, certifications, special training. */
  education?: string;
  /** 5. Career Journey — first job, major positions, organizations, promotions/career changes, current position. */
  careerJourney?: string;
  /** 6. Professional Achievements — accomplishments, projects, awards, publications, innovations, contributions. */
  professionalAchievements?: string;
  /** 7. Areas of Expertise — e.g. Leadership, Technology, Law, Business, Education, Healthcare. */
  areasOfExpertise?: string[];
  /** 8. Community & Social Contributions — service, mentorship, charitable work, organizations supported. */
  communityContributions?: string;
  /** 9. Personal Philosophy / Values — principles, beliefs about their profession, leadership philosophy, life lessons. */
  personalPhilosophy?: string;
  /** 10. Legacy — what they want to be remembered for, knowledge to pass on, advice, their impact. */
  legacy?: string;
  /** 11. Personal Life — family, hobbies, interests, personal achievements they're comfortable making public. */
  personalLife?: string;
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
  cookbookAlbums: CookbookAlbum[];
  recipes: Recipe[];
  memories: Memory[];
  events: FamilyEvent[];
  announcements: Announcement[];
  chronicleEras: ChronicleEra[];
  biographies: Biography[];
  legacyContributions: LegacyContribution[];
  languageEntries: LanguageEntry[];
  triviaScores: TriviaScore[];
  gameScores: GameScore[];
  stories: Story[];
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

export type StoryStatus = 'active' | 'complete';

/**
 * One line a family member contributed to a collaborative "story builder" round.
 * Entries are written blind — a contributor only sees the immediately preceding
 * entry, not the whole story — so the finished piece reads like a family game,
 * not a jointly-edited document.
 */
export interface StoryEntry {
  id: string;
  storyId: string;
  memberProfileId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

/**
 * A collaborative story: a seed prompt, an ordered turn order of participating
 * profiles, and the entries contributed so far. Once every participant has
 * taken a turn the story is marked 'complete' and can be saved into the
 * family's Memories/Chronicle as a finished piece.
 */
export interface Story {
  id: string;
  familyId: string;
  title: string;
  seedPrompt: string;
  status: StoryStatus;
  turnOrder: string[]; // profile ids, in play order
  currentTurnIndex: number;
  entries: StoryEntry[];
  createdAt: string;
  completedAt?: string;
  savedAsMemoryId?: string;
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

/** Every game in the Games hub that can contribute points to the combined family leaderboard. */
export type GameKey = 'trivia' | 'guessWho' | 'birthdayBingo' | 'whoSaidIt' | 'sudoku' | 'flashcards' | 'scrabbleTiles';

/** One completed round of any non-trivia game, kept for the combined family leaderboard.
 *  Trivia keeps its own richer `TriviaScore` record (with category), but every round — trivia
 *  included — is also summed together here so the leaderboard can rank players across all games. */
export interface GameScore {
  id: string;
  familyId: string;
  profileId: string;
  playerName: string;
  gameKey: GameKey;
  points: number;
  createdAt: string;
}

export type TriviaCategory = 'our_family' | 'history' | 'geography';

/** One completed round of the Family Trivia game, kept for the leaderboard. */
export interface TriviaScore {
  id: string;
  familyId: string;
  profileId: string;
  playerName: string;
  category: TriviaCategory;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

/** Derived lineage helper used by tree visualizers and the person drawer. */
export interface Lineage {
  parents: Member[];
  spouse: Member[];
  children: Member[];
  siblings: Member[];
}
