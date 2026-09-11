// Supabase data-access layer.
//
// This module is the ONLY place that talks to Postgres directly. It maps
// between the camelCase shapes used throughout the app (see src/types) and
// the snake_case columns defined in supabase/schema.sql.
//
// Every function here assumes `isSupabaseConfigured` is true and `supabase`
// is non-null — callers (AppContext) are responsible for checking that and
// falling back to the localStorage path otherwise.

import { supabase } from './supabase';
import type {
  FamilyDataset, Family, Member, Relationship, Album, Photo, Memory,
  FamilyEvent, Announcement, ChronicleEra, Profile, InvitationCode, AuditLogEntry,
  Biography, LegacyContribution, LanguageEntry, RestorationCode, TriviaScore, GameScore,
} from '../types';

function must() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

// ---------------------------------------------------------------------------
// Row <-> model mapping
// ---------------------------------------------------------------------------

const mapFamily = (r: any): Family => ({
  id: r.id, name: r.name, motto: r.motto ?? undefined,
  originStory: r.origin_story ?? undefined, coverPhotoUrl: r.cover_photo_url ?? undefined,
  activeTreeTemplate: r.active_tree_template,
});

const mapMember = (r: any): Member => ({
  id: r.id, familyId: r.family_id, firstName: r.first_name, lastName: r.last_name,
  maidenName: r.maiden_name ?? undefined, gender: r.gender, generation: r.generation,
  avatarUrl: r.avatar_url ?? undefined, isLiving: r.is_living,
  dateOfBirth: r.date_of_birth ?? undefined, dateOfPassing: r.date_of_passing ?? undefined,
  birthPlace: r.birth_place ?? undefined, restingPlace: r.resting_place ?? undefined,
  occupation: r.occupation ?? undefined, bio: r.bio ?? undefined,
});

const mapRelationship = (r: any): Relationship => ({
  id: r.id, familyId: r.family_id, fromMemberId: r.from_member_id, toMemberId: r.to_member_id,
  relationshipType: r.relationship_type, startedAt: r.started_at ?? undefined, endedAt: r.ended_at ?? undefined,
});

const mapAlbum = (r: any): Album => ({
  id: r.id, familyId: r.family_id, title: r.title, category: r.category,
  description: r.description ?? undefined, coverPhotoUrl: r.cover_photo_url ?? undefined,
});

const mapPhoto = (r: any, tagsByPhoto: Map<string, string[]>): Photo => ({
  id: r.id, albumId: r.album_id, familyId: r.family_id, url: r.url,
  caption: r.caption ?? undefined, takenAt: r.taken_at ?? undefined,
  taggedMemberIds: tagsByPhoto.get(r.id) ?? [],
});

const mapMemory = (r: any): Memory => ({
  id: r.id, familyId: r.family_id, title: r.title, body: r.body, era: r.era ?? undefined,
  authorMemberId: r.author_member_id ?? undefined, coverPhotoUrl: r.cover_photo_url ?? undefined,
  relatedMemberIds: r.related_member_ids ?? [], createdAt: r.created_at,
});

const mapEvent = (r: any, rsvpsByEvent: Map<string, { memberId: string; status: string }[]>): FamilyEvent => ({
  id: r.id, familyId: r.family_id, title: r.title, eventType: r.event_type,
  description: r.description ?? undefined, location: r.location ?? undefined,
  startsAt: r.starts_at, endsAt: r.ends_at ?? undefined,
  rsvps: (rsvpsByEvent.get(r.id) ?? []) as FamilyEvent['rsvps'],
});

const mapAnnouncement = (r: any): Announcement => ({
  id: r.id, familyId: r.family_id, title: r.title, body: r.body, priority: r.priority,
  postedByMemberId: r.posted_by_member_id ?? undefined, createdAt: r.created_at,
});

const mapChronicleEra = (r: any): ChronicleEra => ({
  id: r.id, familyId: r.family_id, eraLabel: r.era_label, sortOrder: r.sort_order,
  headline: r.headline, narrative: r.narrative ?? undefined, photoUrl: r.photo_url ?? undefined,
});

const mapBiography = (r: any): Biography => ({
  id: r.id, familyId: r.family_id, memberId: r.member_id,
  atAGlance: r.at_a_glance ?? undefined,
  earlyLifeFamily: r.early_life_family ?? undefined,
  youngAdulthood: r.young_adulthood ?? undefined,
  marriageFamilyLife: r.marriage_family_life ?? undefined,
  workAchievementsPassions: r.work_achievements_passions ?? undefined,
  storiesMemoriesTitle: r.stories_memories_title ?? undefined,
  storiesMemories: r.stories_memories ?? undefined,
  laterYears: r.later_years ?? undefined,
  legacy: r.legacy ?? undefined,
  updatedAt: r.updated_at,
  updatedByProfileId: r.updated_by_profile_id ?? undefined,
});

const mapLegacyContribution = (r: any, tagsByContribution: Map<string, string[]>): LegacyContribution => ({
  id: r.id, familyId: r.family_id, memberId: r.member_id,
  authorProfileId: r.author_profile_id ?? undefined, authorName: r.author_name,
  body: r.body, taggedMemberIds: tagsByContribution.get(r.id) ?? [], createdAt: r.created_at,
});

const mapLanguageEntry = (r: any): LanguageEntry => ({
  id: r.id, familyId: r.family_id, entryType: r.entry_type, term: r.term, meaning: r.meaning,
  answer: r.answer ?? undefined, saidByMemberId: r.said_by_member_id ?? undefined,
  contributedByProfileId: r.contributed_by_profile_id ?? undefined,
  contributedByName: r.contributed_by_name, createdAt: r.created_at,
});

const mapTriviaScore = (r: any): TriviaScore => ({
  id: r.id, familyId: r.family_id, profileId: r.profile_id, playerName: r.player_name,
  category: r.category, score: r.score, totalQuestions: r.total_questions, createdAt: r.created_at,
});

const mapGameScore = (r: any): GameScore => ({
  id: r.id, familyId: r.family_id, profileId: r.profile_id, playerName: r.player_name,
  gameKey: r.game_key, points: r.points, createdAt: r.created_at,
});

const mapRestorationCode = (r: any): RestorationCode => ({
  id: r.id, familyId: r.family_id, profileId: r.profile_id, code: r.code,
  createdAt: r.created_at, redeemedAt: r.redeemed_at ?? undefined,
});

const mapProfile = (r: any): Profile => ({
  id: r.id, familyId: r.family_id, memberId: r.member_id ?? undefined,
  displayName: r.display_name, email: r.email ?? undefined, avatarUrl: r.avatar_url ?? undefined,
  role: r.role,
});

const mapInvitationCode = (r: any): InvitationCode => ({
  id: r.id, familyId: r.family_id, code: r.code, role: r.role,
  memberId: r.member_id ?? undefined, redeemedByProfileId: r.redeemed_by ?? undefined,
  createdAt: r.created_at,
});

const mapAuditLog = (r: any, actorNameById: Map<string, string>): AuditLogEntry => ({
  id: r.id, familyId: r.family_id, actorName: actorNameById.get(r.actor_id) ?? 'Unknown',
  action: r.action, entityType: r.entity_type, createdAt: r.created_at,
});

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Fetch everything needed to hydrate the app for one family. */
export async function fetchFamilyDataset(familyId: string): Promise<FamilyDataset> {
  const db = must();

  const [
    familyRes, membersRes, relRes, albumsRes, photosRes, tagsRes,
    memoriesRes, eventsRes, rsvpsRes, announceRes, eraRes,
    biosRes, legacyRes, legacyTagsRes, languageRes,
    profilesRes, invitesRes, auditRes, triviaRes, gameScoresRes,
  ] = await Promise.all([
    db.from('families').select('*').eq('id', familyId).single(),
    db.from('members').select('*').eq('family_id', familyId),
    db.from('relationships').select('*').eq('family_id', familyId),
    db.from('albums').select('*').eq('family_id', familyId),
    db.from('photos').select('*').eq('family_id', familyId),
    db.from('photo_tags').select('photo_id, member_id'),
    db.from('memories').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
    db.from('events').select('*').eq('family_id', familyId),
    db.from('event_rsvps').select('event_id, member_id, status'),
    db.from('announcements').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
    db.from('chronicle_eras').select('*').eq('family_id', familyId).order('sort_order', { ascending: true }),
    db.from('biographies').select('*').eq('family_id', familyId),
    db.from('legacy_contributions').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
    db.from('legacy_contribution_tags').select('contribution_id, member_id'),
    db.from('language_entries').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
    db.from('profiles').select('*').eq('family_id', familyId),
    db.from('invitation_codes').select('*').eq('family_id', familyId),
    db.from('audit_log').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(200),
    db.from('trivia_scores').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(200),
    db.from('game_scores').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(500),
  ]);

  const firstError = [
    familyRes, membersRes, relRes, albumsRes, photosRes, tagsRes,
    memoriesRes, eventsRes, rsvpsRes, announceRes, eraRes,
    biosRes, legacyRes, legacyTagsRes, languageRes,
    profilesRes, invitesRes, auditRes, triviaRes, gameScoresRes,
  ].find(r => r.error)?.error;
  if (firstError) throw firstError;

  const tagsByPhoto = new Map<string, string[]>();
  for (const t of tagsRes.data ?? []) {
    const list = tagsByPhoto.get(t.photo_id) ?? [];
    list.push(t.member_id);
    tagsByPhoto.set(t.photo_id, list);
  }

  const rsvpsByEvent = new Map<string, { memberId: string; status: string }[]>();
  for (const r of rsvpsRes.data ?? []) {
    if (!r.member_id) continue; // skip rsvps not tied to a family-tree member
    const list = rsvpsByEvent.get(r.event_id) ?? [];
    list.push({ memberId: r.member_id, status: r.status });
    rsvpsByEvent.set(r.event_id, list);
  }

  const tagsByContribution = new Map<string, string[]>();
  for (const t of legacyTagsRes.data ?? []) {
    const list = tagsByContribution.get(t.contribution_id) ?? [];
    list.push(t.member_id);
    tagsByContribution.set(t.contribution_id, list);
  }

  const profiles = (profilesRes.data ?? []).map(mapProfile);
  const actorNameById = new Map(profiles.map(p => [p.id, p.displayName]));

  return {
    family: mapFamily(familyRes.data),
    members: (membersRes.data ?? []).map(mapMember),
    relationships: (relRes.data ?? []).map(mapRelationship),
    albums: (albumsRes.data ?? []).map(mapAlbum),
    photos: (photosRes.data ?? []).map(r => mapPhoto(r, tagsByPhoto)),
    memories: (memoriesRes.data ?? []).map(mapMemory),
    events: (eventsRes.data ?? []).map(r => mapEvent(r, rsvpsByEvent)),
    announcements: (announceRes.data ?? []).map(mapAnnouncement),
    chronicleEras: (eraRes.data ?? []).map(mapChronicleEra),
    biographies: (biosRes.data ?? []).map(mapBiography),
    legacyContributions: (legacyRes.data ?? []).map(r => mapLegacyContribution(r, tagsByContribution)),
    languageEntries: (languageRes.data ?? []).map(mapLanguageEntry),
    triviaScores: (triviaRes.data ?? []).map(mapTriviaScore),
    gameScores: (gameScoresRes.data ?? []).map(mapGameScore),
    // Stories (collaborative story builder game) are local-only for now — not yet
    // backed by a Supabase table, so online-mode families start each session fresh.
    stories: [],
    profiles,
    invitationCodes: (invitesRes.data ?? []).map(mapInvitationCode),
    // Restoration codes and notifications are sensitive/per-user, so they aren't bulk-fetched
    // here with the rest of the family dataset — they're managed directly through the
    // insert/redeem functions below and kept in local state once created.
    restorationCodes: [],
    notifications: [],
    auditLog: (auditRes.data ?? []).map(r => mapAuditLog(r, actorNameById)),
  };
}

/** Look up the profile row (and therefore family_id) for a logged-in auth user. */
export async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  const db = must();
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function fetchInvitationByCode(code: string): Promise<InvitationCode | null> {
  const db = must();
  const { data, error } = await db
    .from('invitation_codes').select('*').eq('code', code.toUpperCase()).is('redeemed_by', null).maybeSingle();
  if (error) throw error;
  return data ? mapInvitationCode(data) : null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createFamily(id: string, name: string): Promise<Family> {
  const db = must();
  const { data, error } = await db.from('families').insert({ id, name }).select().single();
  if (error) throw error;
  return mapFamily(data);
}

export async function updateFamilyTemplate(familyId: string, template: string) {
  const { error } = await must().from('families').update({ active_tree_template: template }).eq('id', familyId);
  if (error) throw error;
}

export async function updateFamilyDetailsRow(
  familyId: string,
  patch: { name?: string; motto?: string; originStory?: string }
) {
  const { error } = await must().from('families').update({
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.motto !== undefined ? { motto: patch.motto || null } : {}),
    ...(patch.originStory !== undefined ? { origin_story: patch.originStory || null } : {}),
  }).eq('id', familyId);
  if (error) throw error;
}

export async function createProfile(p: {
  id: string; familyId: string; memberId?: string; displayName: string; email?: string; role: string;
}) {
  const { error } = await must().from('profiles').insert({
    id: p.id, family_id: p.familyId, member_id: p.memberId ?? null,
    display_name: p.displayName, email: p.email ?? null, role: p.role,
  });
  if (error) throw error;
}

export async function updateProfileRoleRow(id: string, role: string) {
  const { error } = await must().from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

/** Link (or unlink, with memberId = null) a login profile to a person in the tree.
 *  Used by Admin > User Management, both at invite time and to fix an existing profile later. */
export async function updateProfileMemberIdRow(id: string, memberId: string | null) {
  const { error } = await must().from('profiles').update({ member_id: memberId }).eq('id', id);
  if (error) throw error;
}

export async function insertMember(m: Member) {
  const { error } = await must().from('members').insert({
    id: m.id, family_id: m.familyId, first_name: m.firstName, last_name: m.lastName,
    maiden_name: m.maidenName ?? null, gender: m.gender, generation: m.generation,
    avatar_url: m.avatarUrl ?? null, is_living: m.isLiving,
    date_of_birth: m.dateOfBirth ?? null, date_of_passing: m.dateOfPassing ?? null,
    birth_place: m.birthPlace ?? null, resting_place: m.restingPlace ?? null,
    occupation: m.occupation ?? null, bio: m.bio ?? null,
  });
  if (error) throw error;
}

export async function updateMemberRow(id: string, patch: Partial<Member>) {
  const row: Record<string, unknown> = {};
  if (patch.firstName !== undefined) row.first_name = patch.firstName;
  if (patch.lastName !== undefined) row.last_name = patch.lastName;
  if (patch.maidenName !== undefined) row.maiden_name = patch.maidenName;
  if (patch.gender !== undefined) row.gender = patch.gender;
  if (patch.generation !== undefined) row.generation = patch.generation;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (patch.isLiving !== undefined) row.is_living = patch.isLiving;
  if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;
  if (patch.dateOfPassing !== undefined) row.date_of_passing = patch.dateOfPassing;
  if (patch.birthPlace !== undefined) row.birth_place = patch.birthPlace;
  if (patch.restingPlace !== undefined) row.resting_place = patch.restingPlace;
  if (patch.occupation !== undefined) row.occupation = patch.occupation;
  if (patch.bio !== undefined) row.bio = patch.bio;
  const { error } = await must().from('members').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteMemberRow(id: string) {
  const { error } = await must().from('members').delete().eq('id', id);
  if (error) throw error;
}

export async function insertRelationship(r: Relationship) {
  const { error } = await must().from('relationships').insert({
    id: r.id, family_id: r.familyId, from_member_id: r.fromMemberId, to_member_id: r.toMemberId,
    relationship_type: r.relationshipType, started_at: r.startedAt ?? null, ended_at: r.endedAt ?? null,
  });
  if (error) throw error;
}

export async function deleteRelationshipsForMemberRow(memberId: string) {
  const db = must();
  const { error } = await db
    .from('relationships').delete()
    .or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId}`);
  if (error) throw error;
}

export async function insertAlbum(a: Album) {
  const { error } = await must().from('albums').insert({
    id: a.id, family_id: a.familyId, title: a.title, category: a.category,
    description: a.description ?? null, cover_photo_url: a.coverPhotoUrl ?? null,
  });
  if (error) throw error;
}

export async function updateAlbumRow(id: string, patch: Partial<Pick<Album, 'title' | 'category' | 'description' | 'coverPhotoUrl'>>) {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.coverPhotoUrl !== undefined) row.cover_photo_url = patch.coverPhotoUrl ?? null;
  const { error } = await must().from('albums').update(row).eq('id', id);
  if (error) throw error;
}

const PHOTO_BUCKET = 'family-photos';

/** Uploads a photo file to Supabase Storage under `<familyId>/<albumId>/<uuid>.<ext>`
 *  and returns its public URL. Storage RLS (see supabase/003_photo_storage.sql)
 *  scopes writes to members of that family and blocks the Guest role. */
export async function uploadPhotoFile(familyId: string, albumId: string, file: File): Promise<string> {
  const db = must();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const fileName = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${familyId}/${albumId}/${fileName}.${ext}`;

  const { error: uploadError } = await db.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = db.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

/** Uploads a profile photo (for a member or a login profile) to the same
 *  public bucket, under `<familyId>/avatars/<entityId>-<random>.<ext>`.
 *  `upsert: true` so re-uploading a new photo just replaces the old file. */
export async function uploadAvatarFile(familyId: string, entityId: string, file: File): Promise<string> {
  const db = must();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 8);
  const path = `${familyId}/avatars/${entityId}-${suffix}.${ext}`;

  const { error: uploadError } = await db.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = db.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

export async function updateProfileAvatarRow(id: string, avatarUrl: string) {
  const { error } = await must().from('profiles').update({ avatar_url: avatarUrl }).eq('id', id);
  if (error) throw error;
}

export async function insertPhoto(p: Photo) {
  const db = must();
  const { error } = await db.from('photos').insert({
    id: p.id, album_id: p.albumId, family_id: p.familyId, url: p.url,
    caption: p.caption ?? null, taken_at: p.takenAt ?? null,
  });
  if (error) throw error;
  if (p.taggedMemberIds.length > 0) {
    const { error: tagErr } = await db
      .from('photo_tags')
      .insert(p.taggedMemberIds.map(memberId => ({ photo_id: p.id, member_id: memberId })));
    if (tagErr) throw tagErr;
  }
}

export async function insertMemory(m: Memory) {
  const { error } = await must().from('memories').insert({
    id: m.id, family_id: m.familyId, title: m.title, body: m.body, era: m.era ?? null,
    author_member_id: m.authorMemberId ?? null, cover_photo_url: m.coverPhotoUrl ?? null,
    related_member_ids: m.relatedMemberIds, created_at: m.createdAt,
  });
  if (error) throw error;
}

export async function insertEvent(e: FamilyEvent) {
  const { error } = await must().from('events').insert({
    id: e.id, family_id: e.familyId, title: e.title, event_type: e.eventType,
    description: e.description ?? null, location: e.location ?? null,
    starts_at: e.startsAt, ends_at: e.endsAt ?? null,
  });
  if (error) throw error;
}

export async function upsertRsvp(eventId: string, memberId: string, status: string) {
  const { error } = await must()
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, member_id: memberId, status, responded_at: new Date().toISOString() },
      { onConflict: 'event_id,member_id' }
    );
  if (error) throw error;
}

export async function insertAnnouncement(a: Announcement) {
  const { error } = await must().from('announcements').insert({
    id: a.id, family_id: a.familyId, title: a.title, body: a.body, priority: a.priority,
    posted_by_member_id: a.postedByMemberId ?? null, created_at: a.createdAt,
  });
  if (error) throw error;
}

export async function insertChronicleEra(c: ChronicleEra) {
  const { error } = await must().from('chronicle_eras').insert({
    id: c.id, family_id: c.familyId, era_label: c.eraLabel, sort_order: c.sortOrder,
    headline: c.headline, narrative: c.narrative ?? null, photo_url: c.photoUrl ?? null,
  });
  if (error) throw error;
}

/** Biographies are one-per-member, so writes upsert on (family_id, member_id). */
export async function upsertBiographyRow(b: Biography) {
  const { error } = await must().from('biographies').upsert({
    id: b.id, family_id: b.familyId, member_id: b.memberId,
    at_a_glance: b.atAGlance ?? null,
    early_life_family: b.earlyLifeFamily ?? null,
    young_adulthood: b.youngAdulthood ?? null,
    marriage_family_life: b.marriageFamilyLife ?? null,
    work_achievements_passions: b.workAchievementsPassions ?? null,
    stories_memories_title: b.storiesMemoriesTitle ?? null,
    stories_memories: b.storiesMemories ?? null,
    later_years: b.laterYears ?? null,
    legacy: b.legacy ?? null,
    updated_at: b.updatedAt,
    updated_by_profile_id: b.updatedByProfileId ?? null,
  }, { onConflict: 'member_id' });
  if (error) throw error;
}

export async function insertLegacyContribution(c: LegacyContribution) {
  const db = must();
  const { error } = await db.from('legacy_contributions').insert({
    id: c.id, family_id: c.familyId, member_id: c.memberId,
    author_profile_id: c.authorProfileId ?? null, author_name: c.authorName,
    body: c.body, created_at: c.createdAt,
  });
  if (error) throw error;
  if (c.taggedMemberIds.length > 0) {
    const { error: tagErr } = await db
      .from('legacy_contribution_tags')
      .insert(c.taggedMemberIds.map(memberId => ({ contribution_id: c.id, member_id: memberId })));
    if (tagErr) throw tagErr;
  }
}

export async function deleteLegacyContributionRow(id: string) {
  const { error } = await must().from('legacy_contributions').delete().eq('id', id);
  if (error) throw error;
}

export async function insertInvitationCode(inv: InvitationCode) {
  const { error } = await must().from('invitation_codes').insert({
    id: inv.id, family_id: inv.familyId, code: inv.code, role: inv.role,
    member_id: inv.memberId ?? null, created_at: inv.createdAt,
  });
  if (error) throw error;
}

export async function redeemInvitationCode(id: string, redeemedByProfileId: string) {
  const { error } = await must()
    .from('invitation_codes')
    .update({ redeemed_by: redeemedByProfileId, redeemed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function insertLanguageEntry(e: LanguageEntry) {
  const { error } = await must().from('language_entries').insert({
    id: e.id, family_id: e.familyId, entry_type: e.entryType, term: e.term, meaning: e.meaning,
    answer: e.answer ?? null, said_by_member_id: e.saidByMemberId ?? null,
    contributed_by_profile_id: e.contributedByProfileId ?? null,
    contributed_by_name: e.contributedByName, created_at: e.createdAt,
  });
  if (error) throw error;
}

export async function deleteLanguageEntryRow(id: string) {
  const { error } = await must().from('language_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function updateLanguageEntryRow(id: string, patch: Partial<Pick<LanguageEntry, 'term' | 'meaning' | 'answer' | 'saidByMemberId'>>) {
  const row: Record<string, unknown> = {};
  if (patch.term !== undefined) row.term = patch.term;
  if (patch.meaning !== undefined) row.meaning = patch.meaning;
  if (patch.answer !== undefined) row.answer = patch.answer ?? null;
  if (patch.saidByMemberId !== undefined) row.said_by_member_id = patch.saidByMemberId ?? null;
  const { error } = await must().from('language_entries').update(row).eq('id', id);
  if (error) throw error;
}

export async function insertRestorationCode(r: RestorationCode) {
  const { error } = await must().from('restoration_codes').insert({
    id: r.id, family_id: r.familyId, profile_id: r.profileId, code: r.code, created_at: r.createdAt,
  });
  if (error) throw error;
}

export async function redeemRestorationCodeRow(id: string) {
  const { error } = await must()
    .from('restoration_codes')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Redeem an admin-issued restoration code and set a new password, via the
 * `redeem-restoration-code` Edge Function. This runs server-side with the
 * service role key because a logged-out, locked-out user has no session/RLS
 * access to look up their own profile or restoration code directly — the
 * restoration code itself is the one-time secret that authorizes the change,
 * the same way an emailed password-reset link would.
 */
export async function redeemRestorationCodeViaEdgeFunction(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await must().functions.invoke('redeem-restoration-code', {
    body: { email, code, newPassword },
  });
  if (error) {
    // Edge Functions surface non-2xx responses as an error here; try to pull
    // the JSON body's `error` message through, otherwise fall back.
    const message = (error as { context?: { json?: () => Promise<{ error?: string }> } })?.context?.json
      ? (await (error as { context: { json: () => Promise<{ error?: string }> } }).context.json())?.error
      : undefined;
    return { ok: false, error: message ?? 'Something went wrong. Please try again or contact your family admin.' };
  }
  if (data?.ok) return { ok: true };
  return { ok: false, error: data?.error ?? 'Could not reset your password.' };
}

export async function insertTriviaScore(s: TriviaScore) {
  const { error } = await must().from('trivia_scores').insert({
    id: s.id, family_id: s.familyId, profile_id: s.profileId, player_name: s.playerName,
    category: s.category, score: s.score, total_questions: s.totalQuestions, created_at: s.createdAt,
  });
  if (error) throw error;
}

export async function insertGameScore(s: GameScore) {
  const { error } = await must().from('game_scores').insert({
    id: s.id, family_id: s.familyId, profile_id: s.profileId, player_name: s.playerName,
    game_key: s.gameKey, points: s.points, created_at: s.createdAt,
  });
  if (error) throw error;
}

export async function insertAuditLog(entry: { familyId: string; actorId: string; action: string; entityType: string }) {
  const { error } = await must().from('audit_log').insert({
    family_id: entry.familyId, actor_id: entry.actorId, action: entry.action, entity_type: entry.entityType,
  });
  if (error) throw error;
}
