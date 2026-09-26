import { Hono } from 'hono';
import { z } from 'zod';
import { withClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toPublicUrl } from '../services/r2.js';

const family = new Hono();
family.use('*', requireAuth);

async function loadProfile(client, userId) {
  const result = await client.query(
    `SELECT id, family_id, member_id, display_name, email, avatar_url, role FROM profiles WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

function mapMember(r, env) {
  return {
    id: r.id, familyId: r.family_id, firstName: r.first_name, lastName: r.last_name,
    maidenName: r.maiden_name ?? undefined, gender: r.gender, generation: r.generation,
    avatarUrl: toPublicUrl(env, r.avatar_url ?? undefined), isLiving: r.is_living,
    dateOfBirth: r.date_of_birth ?? undefined, dateOfPassing: r.date_of_passing ?? undefined,
    birthPlace: r.birth_place ?? undefined, restingPlace: r.resting_place ?? undefined,
    occupation: r.occupation ?? undefined, bio: r.bio ?? undefined,
    professionalTitle: r.professional_title ?? undefined, currentOrganization: r.current_organization ?? undefined,
    location: r.location ?? undefined, contactLinks: r.contact_links ?? undefined,
    hasPet: r.has_pet ?? undefined, petName: r.pet_name ?? undefined,
  };
}

function mapRelationship(r) {
  return {
    id: r.id, familyId: r.family_id, fromMemberId: r.from_member_id, toMemberId: r.to_member_id,
    relationshipType: r.relationship_type, startedAt: r.started_at ?? undefined, endedAt: r.ended_at ?? undefined,
  };
}

function mapProfile(r, env) {
  return {
    id: r.id, familyId: r.family_id, memberId: r.member_id ?? undefined,
    displayName: r.display_name, email: r.email ?? undefined,
    avatarUrl: toPublicUrl(env, r.avatar_url ?? undefined),
    role: r.role,
  };
}

function mapFamily(r, env) {
  return {
    id: r.id, name: r.name, motto: r.motto ?? undefined,
    originStory: r.origin_story ?? undefined,
    coverPhotoUrl: toPublicUrl(env, r.cover_photo_url ?? undefined),
    activeTreeTemplate: r.active_tree_template,
  };
}

function mapInvitationCode(r) {
  return {
    id: r.id, familyId: r.family_id, code: r.code, role: r.role,
    memberId: r.member_id ?? undefined, redeemedByProfileId: r.redeemed_by ?? undefined,
    createdAt: r.created_at,
  };
}

function mapAlbum(r, env) {
  return {
    id: r.id, familyId: r.family_id, title: r.title, category: r.category,
    description: r.description ?? undefined,
    coverPhotoUrl: toPublicUrl(env, r.cover_photo_url ?? undefined),
    featuredMemberId: r.featured_member_id ?? undefined,
  };
}

function mapPhoto(r, env) {
  const tagged = Array.isArray(r.tagged_member_ids)
    ? r.tagged_member_ids
    : (r.tagged_member_ids ? JSON.parse(r.tagged_member_ids) : []);
  return {
    id: r.id, albumId: r.album_id, familyId: r.family_id,
    url: toPublicUrl(env, r.url),
    caption: r.caption ?? undefined,
    takenAt: r.taken_at ? (typeof r.taken_at === 'string' ? r.taken_at.split('T')[0] : new Date(r.taken_at).toISOString().split('T')[0]) : undefined,
    taggedMemberIds: tagged,
  };
}

function mapCookbookAlbum(r, env) {
  return {
    id: r.id, familyId: r.family_id, title: r.title, style: r.style,
    description: r.description ?? undefined,
    coverPhotoUrl: toPublicUrl(env, r.cover_photo_url ?? undefined),
    featuredMemberId: r.featured_member_id ?? undefined,
  };
}

function mapRecipe(r, env) {
  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients
    : (r.ingredients ? JSON.parse(r.ingredients) : []);
  const instructions = Array.isArray(r.instructions)
    ? r.instructions
    : (r.instructions ? JSON.parse(r.instructions) : []);
  return {
    id: r.id, albumId: r.album_id, familyId: r.family_id, title: r.title, category: r.category,
    isVegetarian: r.is_vegetarian ?? false,
    photoUrl: toPublicUrl(env, r.photo_url ?? undefined),
    ingredients,
    instructions,
    cookTime: r.cook_time ?? undefined,
    familyStory: r.family_story ?? undefined,
    contributedByMemberId: r.contributed_by_member_id ?? undefined,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapMemory(r, env) {
  return {
    id: r.id, familyId: r.family_id, title: r.title, body: r.body,
    era: r.era ?? undefined, authorMemberId: r.author_member_id ?? undefined,
    coverPhotoUrl: toPublicUrl(env, r.cover_photo_url ?? undefined),
    relatedMemberIds: Array.isArray(r.related_member_ids) ? r.related_member_ids : [],
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapEvent(r) {
  const rsvps = Array.isArray(r.rsvps) ? r.rsvps : (typeof r.rsvps === 'string' ? JSON.parse(r.rsvps) : []);
  return {
    id: r.id, familyId: r.family_id, title: r.title, eventType: r.event_type,
    description: r.description ?? undefined, location: r.location ?? undefined,
    startsAt: typeof r.starts_at === 'string' ? r.starts_at : new Date(r.starts_at).toISOString(),
    endsAt: r.ends_at ? (typeof r.ends_at === 'string' ? r.ends_at : new Date(r.ends_at).toISOString()) : undefined,
    rsvps,
  };
}

function mapAnnouncement(r) {
  return {
    id: r.id, familyId: r.family_id, title: r.title, body: r.body, priority: r.priority,
    postedByMemberId: r.posted_by_member_id ?? undefined,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapChronicleEra(r) {
  return {
    id: r.id, familyId: r.family_id, eraLabel: r.era_label, sortOrder: r.sort_order,
    headline: r.headline, narrative: r.narrative ?? undefined, photoUrl: r.photo_url ?? undefined,
  };
}

function mapBiography(r) {
  return {
    id: r.id, familyId: r.family_id, memberId: r.member_id,
    professionalSummary: r.professional_summary ?? undefined,
    earlyLifeBackground: r.early_life_background ?? undefined,
    education: r.education ?? undefined,
    careerJourney: r.career_journey ?? undefined,
    professionalAchievements: r.professional_achievements ?? undefined,
    areasOfExpertise: Array.isArray(r.areas_of_expertise) ? r.areas_of_expertise : [],
    communityContributions: r.community_contributions ?? undefined,
    personalPhilosophy: r.personal_philosophy ?? undefined,
    legacy: r.legacy ?? undefined,
    personalLife: r.personal_life ?? undefined,
    updatedAt: typeof r.updated_at === 'string' ? r.updated_at : new Date(r.updated_at).toISOString(),
    updatedByProfileId: r.updated_by_profile_id ?? undefined,
  };
}

function mapLegacyContribution(r) {
  const tagged = Array.isArray(r.tagged_member_ids) ? r.tagged_member_ids : (typeof r.tagged_member_ids === 'string' ? JSON.parse(r.tagged_member_ids) : []);
  return {
    id: r.id, familyId: r.family_id, memberId: r.member_id,
    authorProfileId: r.author_profile_id ?? undefined, authorName: r.author_name,
    body: r.body, taggedMemberIds: tagged,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapLanguageEntry(r) {
  return {
    id: r.id, familyId: r.family_id, entryType: r.entry_type, term: r.term, meaning: r.meaning,
    answer: r.answer ?? undefined, saidByMemberId: r.said_by_member_id ?? undefined,
    audioUrl: r.audio_url ?? undefined,
    contributedByProfileId: r.contributed_by_profile_id ?? undefined,
    contributedByName: r.contributed_by_name,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapTriviaScore(r) {
  return {
    id: r.id, familyId: r.family_id, profileId: r.profile_id, playerName: r.player_name,
    category: r.category, score: r.score, totalQuestions: r.total_questions,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapGameScore(r) {
  return {
    id: r.id, familyId: r.family_id, profileId: r.profile_id, playerName: r.player_name,
    gameKey: r.game_key, points: r.points,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

function mapRestorationCode(r) {
  return {
    id: r.id, familyId: r.family_id, profileId: r.profile_id, code: r.code,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
    redeemedAt: r.redeemed_at ? (typeof r.redeemed_at === 'string' ? r.redeemed_at : new Date(r.redeemed_at).toISOString()) : undefined,
  };
}

function mapAuditLog(r) {
  return {
    id: r.id, familyId: r.family_id, actorName: r.actor_name || 'Unknown',
    action: r.action, entityType: r.entity_type,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

family.get('/dataset', async (c) => {
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);

    const familyRes = await client.query(`SELECT * FROM families WHERE id = $1`, [profile.family_id]);
    const membersRes = await client.query(`SELECT * FROM members WHERE family_id = $1`, [profile.family_id]);
    const relRes = await client.query(`SELECT * FROM relationships WHERE family_id = $1`, [profile.family_id]);
    const profilesRes = await client.query(`SELECT * FROM profiles WHERE family_id = $1`, [profile.family_id]);
    const invitesRes = await client.query(`SELECT * FROM invitation_codes WHERE family_id = $1`, [profile.family_id]);
    const albumsRes = await client.query(`SELECT * FROM albums WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const photosRes = await client.query(
      `SELECT p.*, COALESCE(
         json_agg(pt.member_id ORDER BY pt.id) FILTER (WHERE pt.id IS NOT NULL),
         '[]'
       ) AS tagged_member_ids
         FROM photos p
         LEFT JOIN photo_tags pt ON pt.photo_id = p.id
        WHERE p.family_id = $1
        GROUP BY p.id
        ORDER BY p.taken_at ASC NULLS LAST, p.created_at ASC`,
      [profile.family_id]
    );
    const cookbookAlbumsRes = await client.query(`SELECT * FROM cookbook_albums WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const recipesRes = await client.query(`SELECT * FROM recipes WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const memoriesRes = await client.query(`SELECT * FROM memories WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const eventsRes = await client.query(
      `SELECT e.*, COALESCE(
         json_agg(json_build_object('memberId', r.member_id, 'status', r.status)) FILTER (WHERE r.id IS NOT NULL),
         '[]'
       ) AS rsvps
         FROM events e
         LEFT JOIN event_rsvps r ON r.event_id = e.id
        WHERE e.family_id = $1
        GROUP BY e.id
        ORDER BY e.starts_at ASC`,
      [profile.family_id]
    );
    const announcementsRes = await client.query(`SELECT * FROM announcements WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const chronicleRes = await client.query(`SELECT * FROM chronicle_eras WHERE family_id = $1 ORDER BY sort_order ASC, created_at ASC`, [profile.family_id]);
    const biosRes = await client.query(`SELECT * FROM biographies WHERE family_id = $1`, [profile.family_id]);
    const legacyRes = await client.query(
      `SELECT lc.*, COALESCE(
         json_agg(lct.member_id ORDER BY lct.id) FILTER (WHERE lct.id IS NOT NULL),
         '[]'
       ) AS tagged_member_ids
         FROM legacy_contributions lc
         LEFT JOIN legacy_contribution_tags lct ON lct.contribution_id = lc.id
        WHERE lc.family_id = $1
        GROUP BY lc.id
        ORDER BY lc.created_at DESC`,
      [profile.family_id]
    );
    const languageRes = await client.query(`SELECT * FROM language_entries WHERE family_id = $1 ORDER BY created_at DESC`, [profile.family_id]);
    const triviaRes = await client.query(`SELECT * FROM trivia_scores WHERE family_id = $1 ORDER BY created_at DESC LIMIT 200`, [profile.family_id]);
    const gameScoresRes = await client.query(`SELECT * FROM game_scores WHERE family_id = $1 ORDER BY points DESC, created_at DESC LIMIT 500`, [profile.family_id]);
    const restorationRes = await client.query(`SELECT * FROM restoration_codes WHERE family_id = $1`, [profile.family_id]);
    const auditRes = await client.query(
      `SELECT a.*, p.display_name AS actor_name
         FROM audit_log a
         LEFT JOIN profiles p ON p.id = a.actor_id
        WHERE a.family_id = $1
        ORDER BY a.created_at DESC LIMIT 200`,
      [profile.family_id]
    );

    return c.json({
      family: mapFamily(familyRes.rows[0], c.env),
      members: membersRes.rows.map(r => mapMember(r, c.env)),
      relationships: relRes.rows.map(mapRelationship),
      profiles: profilesRes.rows.map(r => mapProfile(r, c.env)),
      invitationCodes: invitesRes.rows.map(mapInvitationCode),
      albums: albumsRes.rows.map(r => mapAlbum(r, c.env)),
      photos: photosRes.rows.map(r => mapPhoto(r, c.env)),
      cookbookAlbums: cookbookAlbumsRes.rows.map(r => mapCookbookAlbum(r, c.env)),
      recipes: recipesRes.rows.map(r => mapRecipe(r, c.env)),
      memories: memoriesRes.rows.map(r => mapMemory(r, c.env)),
      events: eventsRes.rows.map(mapEvent),
      announcements: announcementsRes.rows.map(mapAnnouncement),
      chronicleEras: chronicleRes.rows.map(mapChronicleEra),
      biographies: biosRes.rows.map(mapBiography),
      legacyContributions: legacyRes.rows.map(mapLegacyContribution),
      languageEntries: languageRes.rows.map(mapLanguageEntry),
      triviaScores: triviaRes.rows.map(mapTriviaScore),
      gameScores: gameScoresRes.rows.map(mapGameScore),
      restorationCodes: restorationRes.rows.map(mapRestorationCode),
      auditLog: auditRes.rows.map(mapAuditLog),
    });
  });
});

const familyDetailsSchema = z.object({ name: z.string().optional(), motto: z.string().optional(), originStory: z.string().optional() });
family.put('/details', async (c) => {
  const body = familyDetailsSchema.parse(await c.req.json());
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(
      `UPDATE families SET
         name = COALESCE($1, name),
         motto = COALESCE($2, motto),
         origin_story = COALESCE($3, origin_story),
         updated_at = now()
       WHERE id = $4`,
      [body.name ?? null, body.motto ?? null, body.originStory ?? null, profile.family_id]
    );
    return c.json({ ok: true });
  });
});

family.put('/template', async (c) => {
  const { template } = await c.req.json();
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(`UPDATE families SET active_tree_template = $1, updated_at = now() WHERE id = $2`, [template, profile.family_id]);
    return c.json({ ok: true });
  });
});

const memberSchema = z.object({
  id: z.string(), firstName: z.string(), lastName: z.string(),
  maidenName: z.string().nullish(), gender: z.enum(['male', 'female', 'other']).nullish(),
  generation: z.number().int(), avatarUrl: z.string().nullish(), isLiving: z.boolean(),
  dateOfBirth: z.string().nullish(), dateOfPassing: z.string().nullish(),
  birthPlace: z.string().nullish(), restingPlace: z.string().nullish(),
  occupation: z.string().nullish(), bio: z.string().nullish(),
  professionalTitle: z.string().nullish(), currentOrganization: z.string().nullish(),
  location: z.string().nullish(), contactLinks: z.string().nullish(),
  hasPet: z.boolean().nullish(), petName: z.string().nullish(),
});

family.post('/members', async (c) => {
  const m = memberSchema.parse(await c.req.json());
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(
      `INSERT INTO members (
         id, family_id, first_name, last_name, maiden_name, gender, generation,
         avatar_url, is_living, date_of_birth, date_of_passing, birth_place, resting_place,
         occupation, bio, professional_title, current_organization, location, contact_links,
         has_pet, pet_name
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        m.id, profile.family_id, m.firstName, m.lastName,
        m.maidenName ?? null, m.gender ?? null, m.generation,
        m.avatarUrl ?? null, m.isLiving,
        m.dateOfBirth ?? null, m.dateOfPassing ?? null,
        m.birthPlace ?? null, m.restingPlace ?? null,
        m.occupation ?? null, m.bio ?? null,
        m.professionalTitle ?? null, m.currentOrganization ?? null,
        m.location ?? null, m.contactLinks ?? null,
        m.hasPet ?? false, m.hasPet ? (m.petName ?? null) : null,
      ]
    );
    return c.json({ ok: true, id: m.id }, 201);
  });
});

const memberPatchSchema = memberSchema.omit({ id: true }).partial();
family.put('/members/:id', async (c) => {
  const patch = memberPatchSchema.parse(await c.req.json());
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);

    const fieldMap = {
      firstName: 'first_name', lastName: 'last_name', maidenName: 'maiden_name', gender: 'gender',
      generation: 'generation', avatarUrl: 'avatar_url', isLiving: 'is_living', dateOfBirth: 'date_of_birth',
      dateOfPassing: 'date_of_passing', birthPlace: 'birth_place', restingPlace: 'resting_place',
      occupation: 'occupation', bio: 'bio', professionalTitle: 'professional_title',
      currentOrganization: 'current_organization', location: 'location', contactLinks: 'contact_links',
      hasPet: 'has_pet', petName: 'pet_name',
    };
    const sets = [];
    const values = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      if (patch[key] !== undefined) {
        sets.push(`${col} = $${i++}`);
        values.push(patch[key]);
      }
    }
    if (sets.length === 0) return c.json({ ok: true });
    sets.push(`updated_at = now()`);
    values.push(id, profile.family_id);
    const sql = `UPDATE members SET ${sets.join(', ')} WHERE id = $${i++} AND family_id = $${i}`;
    await client.query(sql, values);
    return c.json({ ok: true });
  });
});

family.delete('/members/:id', async (c) => {
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(`DELETE FROM members WHERE id = $1 AND family_id = $2`, [id, profile.family_id]);
    return c.json({ ok: true, deleted: id });
  });
});

const relationshipSchema = z.object({
  id: z.string(), fromMemberId: z.string(), toMemberId: z.string(),
  relationshipType: z.enum(['parent', 'child', 'spouse', 'sibling', 'adoptive_parent', 'adoptive_child', 'step_parent', 'step_child']),
  startedAt: z.string().nullish(),
});

family.post('/relationships', async (c) => {
  const r = relationshipSchema.parse(await c.req.json());
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(
      `INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, started_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (from_member_id, to_member_id, relationship_type) DO NOTHING`,
      [r.id, profile.family_id, r.fromMemberId, r.toMemberId, r.relationshipType, r.startedAt ?? null]
    );
    return c.json({ ok: true, id: r.id }, 201);
  });
});

family.delete('/relationships/member/:memberId', async (c) => {
  const memberId = c.req.param('memberId');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(
      `DELETE FROM relationships WHERE family_id = $1 AND (from_member_id = $2 OR to_member_id = $2)`,
      [profile.family_id, memberId]
    );
    return c.json({ ok: true });
  });
});

family.get('/profiles/me', async (c) => {
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    return c.json({ profile: mapProfile(profile, c.env) });
  });
});

family.put('/profiles/:id/role', async (c) => {
  const { role } = await c.req.json();
  const targetId = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile || (profile.role !== 'family_admin' && profile.role !== 'super_admin')) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    await client.query(`UPDATE profiles SET role = $1 WHERE id = $2 AND family_id = $3`, [role, targetId, profile.family_id]);
    return c.json({ ok: true });
  });
});

family.put('/profiles/:id/member', async (c) => {
  const { memberId } = await c.req.json();
  const targetId = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile || (profile.role !== 'family_admin' && profile.role !== 'super_admin')) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    await client.query(`UPDATE profiles SET member_id = $1 WHERE id = $2 AND family_id = $3`, [memberId ?? null, targetId, profile.family_id]);
    return c.json({ ok: true });
  });
});

family.put('/profiles/:id/avatar', async (c) => {
  const { avatarUrl } = await c.req.json();
  const targetId = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(`UPDATE profiles SET avatar_url = $1 WHERE id = $2 AND family_id = $3`, [avatarUrl, targetId, profile.family_id]);
    return c.json({ ok: true });
  });
});

family.put('/profiles/:id/display-name', async (c) => {
  const { displayName } = await c.req.json();
  const targetId = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);
    await client.query(`UPDATE profiles SET display_name = $1 WHERE id = $2 AND family_id = $3`, [displayName, targetId, profile.family_id]);
    return c.json({ ok: true });
  });
});

family.post('/invitations', async (c) => {
  const { role, memberId } = await c.req.json();
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile || (profile.role !== 'family_admin' && profile.role !== 'super_admin')) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await client.query(
      `INSERT INTO invitation_codes (family_id, code, role, member_id, created_by) VALUES ($1,$2,$3,$4,$5)`,
      [profile.family_id, code, role, memberId ?? null, profile.id]
    );
    return c.json({ ok: true, code }, 201);
  });
});

export default family;
