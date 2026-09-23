import { Hono } from 'hono';
import { z } from 'zod';
import { withClient } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const family = new Hono();
family.use('*', requireAuth);

async function loadProfile(client, userId) {
  const result = await client.query(
    `SELECT id, family_id, member_id, display_name, email, avatar_url, role FROM profiles WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

function mapMember(r) {
  return {
    id: r.id, familyId: r.family_id, firstName: r.first_name, lastName: r.last_name,
    maidenName: r.maiden_name ?? undefined, gender: r.gender, generation: r.generation,
    avatarUrl: r.avatar_url ?? undefined, isLiving: r.is_living,
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

function mapProfile(r) {
  return {
    id: r.id, familyId: r.family_id, memberId: r.member_id ?? undefined,
    displayName: r.display_name, email: r.email ?? undefined, avatarUrl: r.avatar_url ?? undefined,
    role: r.role,
  };
}

function mapFamily(r) {
  return {
    id: r.id, name: r.name, motto: r.motto ?? undefined,
    originStory: r.origin_story ?? undefined, coverPhotoUrl: r.cover_photo_url ?? undefined,
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

family.get('/dataset', async (c) => {
  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get('userId'));
    if (!profile) return c.json({ error: 'No family profile linked to this account' }, 403);

    const familyRes = await client.query(`SELECT * FROM families WHERE id = $1`, [profile.family_id]);
    const membersRes = await client.query(`SELECT * FROM members WHERE family_id = $1`, [profile.family_id]);
    const relRes = await client.query(`SELECT * FROM relationships WHERE family_id = $1`, [profile.family_id]);
    const profilesRes = await client.query(`SELECT * FROM profiles WHERE family_id = $1`, [profile.family_id]);
    const invitesRes = await client.query(`SELECT * FROM invitation_codes WHERE family_id = $1`, [profile.family_id]);

    return c.json({
      family: mapFamily(familyRes.rows[0]),
      members: membersRes.rows.map(mapMember),
      relationships: relRes.rows.map(mapRelationship),
      profiles: profilesRes.rows.map(mapProfile),
      invitationCodes: invitesRes.rows.map(mapInvitationCode),
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
    return c.json({ profile: mapProfile(profile) });
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
