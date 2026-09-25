import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const features = new Hono();
features.use('*', requireAuth);

async function getProfile(client, userId) {
  const r = await client.query(
    `SELECT id, family_id, role, member_id, display_name FROM profiles WHERE id = $1`,
    [userId]
  );
  return r.rows[0] ?? null;
}

// ===========================================================================
// 1. Memories
// ===========================================================================
const memorySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  era: z.string().max(100).optional(),
  authorMemberId: z.string().uuid().optional(),
  coverPhotoUrl: z.string().max(1000).optional(),
  relatedMemberIds: z.array(z.string().uuid()).default([]),
});

features.get('/memories', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM memories WHERE family_id = $1 ORDER BY created_at DESC`,
      [profile.family_id]
    );
    return c.json({ memories: result.rows });
  });
});

features.post('/memories', async (c) => {
  const body = await c.req.json();
  const parsed = memorySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { title, body, era, authorMemberId, coverPhotoUrl, relatedMemberIds } = parsed.data;
    const result = await client.query(
      `INSERT INTO memories (family_id, title, body, era, author_member_id, cover_photo_url, related_member_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [profile.family_id, title, body, era ?? null, authorMemberId ?? null, coverPhotoUrl ?? null, relatedMemberIds]
    );
    return c.json({ memory: result.rows[0] }, 201);
  });
});

features.delete('/memories/:id', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `DELETE FROM memories WHERE id = $1 AND family_id = $2 RETURNING id`,
      [c.req.param('id'), profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// ===========================================================================
// 2. Events & RSVPs
// ===========================================================================
const eventSchema = z.object({
  title: z.string().min(1).max(200),
  eventType: z.enum(['reunion', 'birthday', 'memorial', 'meeting', 'other']).default('reunion'),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
});

features.get('/events', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const eventsRes = await client.query(
      `SELECT e.*, COALESCE(json_agg(r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS rsvps
         FROM events e
         LEFT JOIN event_rsvps r ON r.event_id = e.id
        WHERE e.family_id = $1
        GROUP BY e.id
        ORDER BY e.starts_at ASC`,
      [profile.family_id]
    );
    return c.json({ events: eventsRes.rows });
  });
});

features.post('/events', async (c) => {
  const body = await c.req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { title, eventType, description, location, startsAt, endsAt } = parsed.data;
    const result = await client.query(
      `INSERT INTO events (family_id, title, event_type, description, location, starts_at, ends_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [profile.family_id, title, eventType, description ?? null, location ?? null, startsAt, endsAt ?? null, user.id]
    );
    return c.json({ event: result.rows[0] }, 201);
  });
});

features.post('/events/:id/rsvp', async (c) => {
  const body = await c.req.json();
  const parsed = z.object({
    status: z.enum(['invited', 'going', 'maybe', 'declined']),
    memberId: z.string().uuid().optional(),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const eventId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const eventRes = await client.query(`SELECT id FROM events WHERE id = $1 AND family_id = $2`, [eventId, profile.family_id]);
    if (eventRes.rowCount === 0) return c.json({ error: 'Event not found' }, 404);

    const result = await client.query(
      `INSERT INTO event_rsvps (event_id, member_id, profile_id, status, responded_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, responded_at = now()
       RETURNING *`,
      [eventId, parsed.data.memberId ?? profile.member_id ?? null, user.id, parsed.data.status]
    );
    return c.json({ rsvp: result.rows[0] });
  });
});

features.delete('/events/:id', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    await client.query(`DELETE FROM event_rsvps WHERE event_id = $1`, [c.req.param('id')]);
    const result = await client.query(
      `DELETE FROM events WHERE id = $1 AND family_id = $2 RETURNING id`,
      [c.req.param('id'), profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// ===========================================================================
// 3. Announcements
// ===========================================================================
const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(['urgent', 'important', 'normal']).default('normal'),
  postedByMemberId: z.string().uuid().optional(),
});

features.get('/announcements', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM announcements WHERE family_id = $1 ORDER BY created_at DESC`,
      [profile.family_id]
    );
    return c.json({ announcements: result.rows });
  });
});

features.post('/announcements', async (c) => {
  const body = await c.req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { title, body, priority, postedByMemberId } = parsed.data;
    const result = await client.query(
      `INSERT INTO announcements (family_id, title, body, priority, posted_by_member_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [profile.family_id, title, body, priority, postedByMemberId ?? profile.member_id ?? null]
    );
    return c.json({ announcement: result.rows[0] }, 201);
  });
});

features.delete('/announcements/:id', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `DELETE FROM announcements WHERE id = $1 AND family_id = $2 RETURNING id`,
      [c.req.param('id'), profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// ===========================================================================
// 4. Chronicle Eras
// ===========================================================================
const chronicleSchema = z.object({
  eraLabel: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
  headline: z.string().min(1).max(300),
  narrative: z.string().max(5000).optional(),
  photoUrl: z.string().max(1000).optional(),
});

features.get('/chronicle', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM chronicle_eras WHERE family_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [profile.family_id]
    );
    return c.json({ eras: result.rows });
  });
});

features.post('/chronicle', async (c) => {
  const body = await c.req.json();
  const parsed = chronicleSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { eraLabel, sortOrder, headline, narrative, photoUrl } = parsed.data;
    const result = await client.query(
      `INSERT INTO chronicle_eras (family_id, era_label, sort_order, headline, narrative, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [profile.family_id, eraLabel, sortOrder, headline, narrative ?? null, photoUrl ?? null]
    );
    return c.json({ era: result.rows[0] }, 201);
  });
});

// ===========================================================================
// 5. Biographies
// ===========================================================================
const bioSchema = z.object({
  memberId: z.string().uuid(),
  professionalSummary: z.string().optional(),
  earlyLifeBackground: z.string().optional(),
  education: z.string().optional(),
  careerJourney: z.string().optional(),
  professionalAchievements: z.string().optional(),
  areasOfExpertise: z.array(z.string()).default([]),
  communityContributions: z.string().optional(),
  personalPhilosophy: z.string().optional(),
  legacy: z.string().optional(),
  personalLife: z.string().optional(),
});

features.get('/biographies', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM biographies WHERE family_id = $1`,
      [profile.family_id]
    );
    return c.json({ biographies: result.rows });
  });
});

features.post('/biographies', async (c) => {
  const body = await c.req.json();
  const parsed = bioSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const d = parsed.data;
    const result = await client.query(
      `INSERT INTO biographies (
         family_id, member_id, professional_summary, early_life_background, education,
         career_journey, professional_achievements, areas_of_expertise, community_contributions,
         personal_philosophy, legacy, personal_life, updated_by_profile_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (member_id) DO UPDATE SET
         professional_summary = EXCLUDED.professional_summary,
         early_life_background = EXCLUDED.early_life_background,
         education = EXCLUDED.education,
         career_journey = EXCLUDED.career_journey,
         professional_achievements = EXCLUDED.professional_achievements,
         areas_of_expertise = EXCLUDED.areas_of_expertise,
         community_contributions = EXCLUDED.community_contributions,
         personal_philosophy = EXCLUDED.personal_philosophy,
         legacy = EXCLUDED.legacy,
         personal_life = EXCLUDED.personal_life,
         updated_by_profile_id = EXCLUDED.updated_by_profile_id,
         updated_at = now()
       RETURNING *`,
      [
        profile.family_id, d.memberId, d.professionalSummary ?? null, d.earlyLifeBackground ?? null,
        d.education ?? null, d.careerJourney ?? null, d.professionalAchievements ?? null,
        d.areasOfExpertise, d.communityContributions ?? null, d.personalPhilosophy ?? null,
        d.legacy ?? null, d.personalLife ?? null, user.id
      ]
    );
    return c.json({ biography: result.rows[0] });
  });
});

// ===========================================================================
// 6. Legacy Contributions
// ===========================================================================
const legacySchema = z.object({
  memberId: z.string().uuid(),
  authorName: z.string().min(1).max(100).optional(),
  body: z.string().min(1).max(5000),
  taggedMemberIds: z.array(z.string().uuid()).default([]),
});

features.get('/legacy', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT lc.*, COALESCE(json_agg(lct.member_id ORDER BY lct.id) FILTER (WHERE lct.id IS NOT NULL), '[]') AS tagged_member_ids
         FROM legacy_contributions lc
         LEFT JOIN legacy_contribution_tags lct ON lct.contribution_id = lc.id
        WHERE lc.family_id = $1
        GROUP BY lc.id
        ORDER BY lc.created_at DESC`,
      [profile.family_id]
    );
    return c.json({ contributions: result.rows });
  });
});

features.post('/legacy', async (c) => {
  const body = await c.req.json();
  const parsed = legacySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { memberId, authorName, body, taggedMemberIds } = parsed.data;
    const author = authorName || profile.display_name || 'A family member';

    const result = await client.query(
      `INSERT INTO legacy_contributions (family_id, member_id, author_profile_id, author_name, body)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [profile.family_id, memberId, user.id, author, body]
    );
    const contribution = result.rows[0];

    if (taggedMemberIds.length > 0) {
      const tagValues = taggedMemberIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO legacy_contribution_tags (contribution_id, member_id) VALUES ${tagValues}`,
        [contribution.id, ...taggedMemberIds]
      );
    }

    return c.json({ contribution: { ...contribution, tagged_member_ids: taggedMemberIds } }, 201);
  });
});

features.delete('/legacy/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    await client.query(`DELETE FROM legacy_contribution_tags WHERE contribution_id = $1`, [id]);
    const result = await client.query(
      `DELETE FROM legacy_contributions WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// ===========================================================================
// 7. Language Entries (Dictionary / Sayings / Riddles)
// ===========================================================================
const languageSchema = z.object({
  entryType: z.enum(['word', 'phrase', 'proverb', 'riddle', 'saying']),
  term: z.string().min(1).max(200),
  meaning: z.string().min(1).max(2000),
  answer: z.string().max(1000).optional(),
  saidByMemberId: z.string().uuid().optional(),
  contributedByName: z.string().min(1).max(100).optional(),
});

features.get('/language', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM language_entries WHERE family_id = $1 ORDER BY created_at DESC`,
      [profile.family_id]
    );
    return c.json({ entries: result.rows });
  });
});

features.post('/language', async (c) => {
  const body = await c.req.json();
  const parsed = languageSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { entryType, term, meaning, answer, saidByMemberId, contributedByName } = parsed.data;
    const contributor = contributedByName || profile.display_name || 'A family member';
    const result = await client.query(
      `INSERT INTO language_entries (family_id, entry_type, term, meaning, answer, said_by_member_id, contributed_by_profile_id, contributed_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [profile.family_id, entryType, term, meaning, answer ?? null, saidByMemberId ?? null, user.id, contributor]
    );
    return c.json({ entry: result.rows[0] }, 201);
  });
});

features.put('/language/:id', async (c) => {
  const body = await c.req.json();
  const parsed = languageSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const id = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const d = parsed.data;
    const result = await client.query(
      `UPDATE language_entries SET
         term = COALESCE($1, term),
         meaning = COALESCE($2, meaning),
         answer = COALESCE($3, answer),
         said_by_member_id = COALESCE($4, said_by_member_id)
       WHERE id = $5 AND family_id = $6 RETURNING *`,
      [d.term ?? null, d.meaning ?? null, d.answer ?? null, d.saidByMemberId ?? null, id, profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ entry: result.rows[0] });
  });
});

features.delete('/language/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `DELETE FROM language_entries WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, profile.family_id]
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// ===========================================================================
// 8. Game & Trivia Scores
// ===========================================================================
const scoreSchema = z.object({
  playerName: z.string().min(1).max(100).optional(),
  gameKey: z.enum(['trivia', 'guessWho', 'birthdayBingo', 'whoSaidIt', 'sudoku', 'flashcards', 'scrabbleTiles']),
  points: z.number().int().min(0),
});

const triviaScoreSchema = z.object({
  playerName: z.string().min(1).max(100).optional(),
  category: z.enum(['our_family', 'history', 'geography']),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
});

features.get('/scores', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM game_scores WHERE family_id = $1 ORDER BY points DESC, created_at DESC LIMIT 500`,
      [profile.family_id]
    );
    return c.json({ scores: result.rows });
  });
});

features.post('/scores', async (c) => {
  const body = await c.req.json();
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { playerName, gameKey, points } = parsed.data;
    const name = playerName || profile.display_name || 'A family member';
    const result = await client.query(
      `INSERT INTO game_scores (family_id, profile_id, player_name, game_key, points)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [profile.family_id, user.id, name, gameKey, points]
    );
    return c.json({ score: result.rows[0] }, 201);
  });
});

features.post('/scores/trivia', async (c) => {
  const body = await c.req.json();
  const parsed = triviaScoreSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { playerName, category, score, totalQuestions } = parsed.data;
    const name = playerName || profile.display_name || 'A family member';
    const result = await client.query(
      `INSERT INTO trivia_scores (family_id, profile_id, player_name, category, score, total_questions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [profile.family_id, user.id, name, category, score, totalQuestions]
    );
    return c.json({ score: result.rows[0] }, 201);
  });
});

// ===========================================================================
// 9. Restoration Codes
// ===========================================================================
features.post('/restoration', async (c) => {
  const body = await c.req.json();
  const parsed = z.object({ profileId: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id || (profile.role !== 'family_admin' && profile.role !== 'super_admin')) {
      return c.json({ error: 'Only family admins can issue restoration codes' }, 403);
    }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const result = await client.query(
      `INSERT INTO restoration_codes (family_id, profile_id, code) VALUES ($1, $2, $3) RETURNING *`,
      [profile.family_id, parsed.data.profileId, code]
    );
    return c.json({ restorationCode: result.rows[0], code }, 201);
  });
});

features.post('/restoration/redeem', async (c) => {
  const body = await c.req.json();
  const parsed = z.object({
    email: z.string().email(),
    code: z.string().min(1),
    newPassword: z.string().min(6),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const { email, code, newPassword } = parsed.data;

  return withClient(c.env, async (client) => {
    const profRes = await client.query(`SELECT id, family_id FROM profiles WHERE email = $1`, [email.toLowerCase()]);
    if (profRes.rowCount === 0) return c.json({ error: "That email doesn't match an account" }, 404);
    const targetProfile = profRes.rows[0];

    const codeRes = await client.query(
      `SELECT id FROM restoration_codes WHERE profile_id = $1 AND code = $2 AND redeemed_at IS NULL`,
      [targetProfile.id, code.toUpperCase()]
    );
    if (codeRes.rowCount === 0) {
      return c.json({ error: 'That restoration code is invalid, expired, or already used.' }, 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, targetProfile.id]);
    await client.query(`UPDATE restoration_codes SET redeemed_at = now() WHERE id = $1`, [codeRes.rows[0].id]);

    return c.json({ ok: true });
  });
});

// ===========================================================================
// 10. Audit Log
// ===========================================================================
features.post('/audit', async (c) => {
  const body = await c.req.json();
  const parsed = z.object({
    action: z.string().min(1).max(200),
    entityType: z.string().min(1).max(100),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const { action, entityType } = parsed.data;

    const result = await client.query(
      `INSERT INTO audit_log (family_id, actor_id, action, entity_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [profile.family_id, user.id, action, entityType]
    );
    return c.json({ entry: result.rows[0] }, 201);
  });
});

export default features;
