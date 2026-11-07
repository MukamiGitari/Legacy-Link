import { Hono } from 'hono';
import { z } from 'zod';
import { withClient, getOrCreateProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const assistant = new Hono();
assistant.use('*', requireAuth);

const ADMIN_ROLES = new Set(['super_admin', 'family_admin']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class UserError extends Error {}

async function getProfile(client, userId) {
  return await getOrCreateProfile(client, userId);
}

function approvedFamilyIds(env) {
  return String(env.APPROVED_FAMILY_IDS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isFamilyApproved(env, familyId) {
  return Boolean(familyId) && approvedFamilyIds(env).includes(String(familyId).toLowerCase());
}

function toAnthropicMessages(history, message) {
  const turns = history.filter((h) => h.role === 'user' || h.role === 'assistant');
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return [...turns.map((h) => ({ role: h.role, content: h.content })), { role: 'user', content: message }];
}

// ===========================================================================
// Schemas for Data Entry across all services
// ===========================================================================

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => !isNaN(Date.parse(s)), 'Invalid date format (expected YYYY-MM-DD)');

const isoDateTime = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), 'Invalid datetime format');

// 1. Members (supports negative generations down to -10 e.g. ancestors before Gen 1)
const memberData = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  maiden_name: z.string().max(100).nullish(),
  gender: z.enum(['male', 'female', 'other']).nullish(),
  is_living: z.boolean().default(true),
  date_of_birth: isoDate.nullish(),
  date_of_passing: isoDate.nullish(),
  birth_place: z.string().max(200).nullish(),
  resting_place: z.string().max(200).nullish(),
  occupation: z.string().max(200).nullish(),
  professional_title: z.string().max(200).nullish(),
  named_after: z.string().max(200).nullish(),
  bio: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
  generation: z.number().int().min(-10).max(50).nullish(),
});

const patchableMember = memberData.partial();

// 2. Recipes
const recipeData = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['breakfast', 'main', 'snacks', 'desserts']).default('main'),
  is_vegetarian: z.boolean().default(false),
  ingredients: z.array(z.string().max(300)).default([]),
  instructions: z.array(z.string().max(2000)).default([]),
  cook_time: z.string().max(200).nullish(),
  family_story: z.string().max(5000).nullish(),
});

const patchableRecipe = recipeData.partial();

// 3. Memories / Stories
const memoryData = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  era: z.string().max(100).nullish(),
  author_name: z.string().max(100).nullish(),
  author_member_id: z.string().uuid().nullish(),
  related_member_ids: z.array(z.string().uuid()).default([]),
});

// 4. Language Entries (Proverbs, Sayings, Terms)
const languageData = z.object({
  entry_type: z.enum(['word', 'phrase', 'proverb', 'riddle', 'saying']).default('proverb'),
  term: z.string().min(1).max(200),
  meaning: z.string().min(1).max(2000),
  answer: z.string().max(2000).nullish(),
});

// 5. Events / Calendar
const eventData = z.object({
  title: z.string().min(1).max(200),
  event_type: z.enum(['reunion', 'birthday', 'memorial', 'meeting', 'other']).default('reunion'),
  description: z.string().max(2000).nullish(),
  location: z.string().max(300).nullish(),
  starts_at: isoDateTime,
  ends_at: isoDateTime.nullish(),
});

// Operations union
const opSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add_member'), ref: z.string().max(40), data: memberData }),
  z.object({ op: z.literal('update_member'), id: z.string().uuid(), data: patchableMember }),
  z.object({
    op: z.literal('add_relationship'),
    from: z.string(),
    to: z.string(),
    type: z.enum(['parent', 'spouse']),
    started_at: isoDate.nullish(),
  }),
  z.object({ op: z.literal('add_recipe'), ref: z.string().max(40).optional(), data: recipeData }),
  z.object({ op: z.literal('update_recipe'), id: z.string().uuid(), data: patchableRecipe }),
  z.object({ op: z.literal('add_memory'), ref: z.string().max(40).optional(), data: memoryData }),
  z.object({ op: z.literal('add_language_entry'), ref: z.string().max(40).optional(), data: languageData }),
  z.object({ op: z.literal('add_event'), ref: z.string().max(40).optional(), data: eventData }),
]);

const proposalSchema = z.object({
  summary: z.string().max(500),
  operations: z.array(opSchema).min(1).max(50),
});

// Chat schema
const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(25000),
      })
    )
    .max(30)
    .optional()
    .default([]),
});

// Tools for Anthropic
const TOOLS = [
  {
    name: 'search_members',
    description: 'Search existing family members by first, last, or maiden name. Returns up to 10 matches.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Name to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'search_recipes',
    description: 'Search existing recipes in the family cookbook by title. Returns up to 10 matches.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Recipe title to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'search_language',
    description: 'Search existing proverbs, sayings, or language terms in the Heritage Vault. Returns up to 10 matches.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Term or proverb to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'propose_changes',
    description:
      'Propose records to add or update across the tree, cookbook, memories, heritage vault, or events. Nothing is saved until the user approves.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One-line summary of the proposed additions or updates' },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              op: {
                type: 'string',
                enum: [
                  'add_member',
                  'update_member',
                  'add_relationship',
                  'add_recipe',
                  'update_recipe',
                  'add_memory',
                  'add_language_entry',
                  'add_event',
                ],
              },
              ref: { type: 'string', description: 'Temporary ID like p1, r1, m1, etc. so relationships can point to it' },
              id: { type: 'string', description: 'Existing UUID for update operations' },
              data: { type: 'object', description: 'Record fields' },
              from: { type: 'string', description: 'add_relationship: member UUID or temp ref' },
              to: { type: 'string', description: 'add_relationship: member UUID or temp ref' },
              type: { type: 'string', enum: ['parent', 'spouse'] },
              started_at: { type: 'string', description: 'Optional YYYY-MM-DD' },
            },
            required: ['op'],
          },
        },
      },
      required: ['summary', 'operations'],
    },
  },
];

/**
 * Assemble relevant family knowledge base context from Postgres.
 */
async function getFamilyContext(client, familyId) {
  const [
    familyRes,
    membersRes,
    biographiesRes,
    languageRes,
    recipesRes,
    chronicleRes,
    memoriesRes,
  ] = await Promise.all([
    client.query(`SELECT id, name, motto, origin_story FROM families WHERE id = $1`, [familyId]),
    client.query(
      `SELECT id, first_name, last_name, gender, generation, is_living, date_of_birth, date_of_passing,
              birth_place, resting_place, occupation, professional_title, bio, is_founder, named_after
       FROM members WHERE family_id = $1 ORDER BY generation ASC, first_name ASC LIMIT 100`,
      [familyId]
    ),
    client.query(
      `SELECT b.professional_summary, b.early_life_background, b.education, b.career_journey,
              b.public_service_chieftainship, b.agricultural_pioneering, m.first_name, m.last_name
       FROM biographies b
       JOIN members m ON m.id = b.member_id
       WHERE b.family_id = $1 LIMIT 5`,
      [familyId]
    ),
    client.query(
      `SELECT term, meaning, answer, entry_type FROM language_entries WHERE family_id = $1 LIMIT 40`,
      [familyId]
    ),
    client.query(
      `SELECT title, category, cook_time, ingredients, instructions, family_story FROM recipes WHERE family_id = $1 LIMIT 20`,
      [familyId]
    ),
    client.query(
      `SELECT era_label, headline, narrative FROM chronicle_eras WHERE family_id = $1 ORDER BY sort_order ASC LIMIT 15`,
      [familyId]
    ),
    client.query(
      `SELECT title, body, era FROM memories WHERE family_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [familyId]
    ),
  ]);

  return {
    family: familyRes.rows[0] || { name: 'Our Family', motto: '', origin_story: '' },
    members: membersRes.rows,
    biographies: biographiesRes.rows,
    language: languageRes.rows,
    recipes: recipesRes.rows,
    chronicle: chronicleRes.rows,
    memories: memoriesRes.rows,
  };
}

/**
 * Intelligent in-process Natural Language Parser for adding in-laws, parents, and members.
 * Handles single-turn and multi-turn conversations seamlessly.
 */
async function parseNaturalLanguageEntry(message, history, context, client, familyId) {
  const text = message.trim();
  const lower = text.toLowerCase();

  // Find recent user message and full transcript for multi-turn context
  const turns = Array.isArray(history) ? history : [];
  const prevUserMsg = [...turns].reverse().find((h) => h.role === 'user' && h.content !== message)?.content || '';
  const allHistory = turns.map((h) => h.content || '').join(' ');

  // Helper to find member from context across current text, previous message, or full history
  const findMember = (query) => {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    return (
      context.members.find((m) => {
        const fn = (m.first_name || '').toLowerCase();
        const ln = (m.last_name || '').toLowerCase();
        const full = `${fn} ${ln}`;
        return q === full || q === fn || q.includes(full) || (fn.length >= 3 && q.includes(fn));
      }) || null
    );
  };

  const findMemberInHistory = () => {
    return findMember(lower) || findMember(prevUserMsg.toLowerCase()) || findMember(allHistory.toLowerCase());
  };

  // Case -1: Affirmative confirmation phrases ("add to archive", "yes", "save", "confirm", "proceed")
  if (/^\s*(add to archive|save|save it|save to archive|confirm|yes|proceed|go ahead|do it|add them|approve)\b/i.test(text.trim())) {
    return {
      reply: `Please click the **Add to archive** button on the review card above to save the proposed family records! You can also uncheck any item you'd like to skip before clicking.`,
      proposal: null,
    };
  }

  // Case 0: Inquiring about adding someone's parents or relatives without providing their names yet:
  // e.g. "can i add mercy mwongera parents" or "they are related to mercy mwongera" or "they are mercy mwongera's parents"
  if (
    (/\b(can i add|how (do|can) i add|want to add|like to add|add them to|they are|related to|parents? (to|of))\b/i.test(lower) &&
      !/\b(father|mother|sister|brother|born|died)\b/i.test(lower)) ||
    (/\bparents?\b/i.test(lower) && !/\b(father|mother)\b/i.test(lower))
  ) {
    const child = findMemberInHistory();
    const childName = child ? `${child.first_name} ${child.last_name}` : 'your relative';
    return {
      reply: `Yes, absolutely! I can help you record relatives connected to **${childName}**.\n\nPlease share their names and roles (for example: *"Father Gilbert Mwongera, Mother Isabela Kinya, Sister Cicilia Mwongera"*), along with any known birth years or locations, and I will prepare them to be added directly to the family tree!`,
      proposal: null,
    };
  }

  // Case 1: Statement with relatives (father, mother, sister, brother, sibling)
  // e.g. "Father Gilbert Mwongera, Mother Isabela Kinya. SISTER Cicilia Mwongera"
  // e.g. "father is Gilbert Mwongera, and mother is Isabella Kinya"
  const hasRelativePattern = /\b(father|mother|sister|brother|sibling)\b/i.test(lower);
  if (hasRelativePattern) {
    // Lookahead stops at comma, period, semicolon, 'and', role keywords, or string end
    const delim = '(?=(?:[,.;]|\\band\\b|\\bfather\\b|\\bmother\\b|\\bsister\\b|\\bbrother\\b|\\bsibling\\b|\\bparents?\\b|\\bare\\b|$))';
    const fatherMatch = text.match(new RegExp(`\\bfather\\s*(?:\\bis\\b|\\bname\\s+is\\b|:)?\\s*([A-Za-z'\\s\\-]+?)${delim}`, 'i'));
    const motherMatch = text.match(new RegExp(`\\bmother\\s*(?:\\bis\\b|\\bname\\s+is\\b|:)?\\s*([A-Za-z'\\s\\-]+?)${delim}`, 'i'));

    // Extract all siblings (sisters, brothers)
    const sibRegex = new RegExp(`\\b(sister|brother|sibling)\\s*(?:\\bis\\b|\\bname\\s+is\\b|:)?\\s*([A-Za-z'\\s\\-]+?)${delim}`, 'gi');
    const siblingMatches = [...text.matchAll(sibRegex)];

    let rawFather = fatherMatch ? fatherMatch[1].trim() : null;
    if (!rawFather) {
      const revFather = text.match(/([A-Za-z'\s\-]+?)\s+(?:is|was)\s+(?:the\s+)?father/i);
      if (revFather) rawFather = revFather[1].trim();
    }

    let rawMother = motherMatch ? motherMatch[1].trim() : null;
    if (!rawMother) {
      const revMother = text.match(/([A-Za-z'\s\-]+?)\s+(?:is|was)\s+(?:the\s+)?mother/i);
      if (revMother) rawMother = revMother[1].trim();
    }

    if (rawFather || rawMother || siblingMatches.length > 0) {
      // Determine the child/anchor
      let child = null;
      const childTargetMatch = text.match(/\b(?:parents?|relatives?)\s+(?:to|of)\s+([A-Za-z'\s\-]+)/i);
      if (childTargetMatch) {
        child = findMember(childTargetMatch[1]) || findMemberInHistory();
      } else {
        child = findMemberInHistory();
      }

      const ops = [];
      let pIdx = 1;
      let fatherRef = null;
      let motherRef = null;

      const childGen = child?.generation ?? 2;
      const parentGen = childGen - 1;
      const sibGen = childGen;

      if (rawFather && rawFather.length >= 2) {
        fatherRef = `p${pIdx++}`;
        const parts = rawFather.split(/\s+/).filter(Boolean);
        const fn = parts[0];
        const ln = parts.slice(1).join(' ') || (child ? child.last_name : 'Elder');
        ops.push({
          op: 'add_member',
          ref: fatherRef,
          data: {
            first_name: fn,
            last_name: ln,
            gender: 'male',
            generation: parentGen,
            is_living: true,
            bio: child ? `Father of ${child.first_name} ${child.last_name}.` : '',
          },
        });
      }

      if (rawMother && rawMother.length >= 2) {
        motherRef = `p${pIdx++}`;
        const parts = rawMother.split(/\s+/).filter(Boolean);
        const fn = parts[0];
        const ln = parts.slice(1).join(' ') || (child ? child.last_name : 'Elder');
        ops.push({
          op: 'add_member',
          ref: motherRef,
          data: {
            first_name: fn,
            last_name: ln,
            gender: 'female',
            generation: parentGen,
            is_living: true,
            bio: child ? `Mother of ${child.first_name} ${child.last_name}.` : '',
          },
        });
      }

      // Link father and mother as spouse
      if (fatherRef && motherRef) {
        ops.push({
          op: 'add_relationship',
          from: fatherRef,
          to: motherRef,
          type: 'spouse',
        });
      }

      // Link parents to child
      if (child && child.id) {
        if (fatherRef) ops.push({ op: 'add_relationship', from: fatherRef, to: child.id, type: 'parent' });
        if (motherRef) ops.push({ op: 'add_relationship', from: motherRef, to: child.id, type: 'parent' });
      }

      // Process siblings (sisters, brothers)
      const siblingDescs = [];
      for (const sib of siblingMatches) {
        const sibType = (sib[1] || 'sibling').toLowerCase();
        const rawSib = (sib[2] || '').trim();
        if (rawSib.length >= 2) {
          const sibRef = `p${pIdx++}`;
          const parts = rawSib.split(/\s+/).filter(Boolean);
          const fn = parts[0];
          const ln = parts.slice(1).join(' ') || (child ? child.last_name : 'Mwongera');
          const gender = sibType === 'sister' ? 'female' : sibType === 'brother' ? 'male' : null;
          const roleLabel = sibType === 'sister' ? 'Sister' : sibType === 'brother' ? 'Brother' : 'Sibling';
          siblingDescs.push(`${rawSib} (${roleLabel})`);

          ops.push({
            op: 'add_member',
            ref: sibRef,
            data: {
              first_name: fn,
              last_name: ln,
              gender,
              generation: sibGen,
              is_living: true,
              bio: child ? `${roleLabel} of ${child.first_name} ${child.last_name}.` : '',
            },
          });

          // Link parents to sibling
          if (fatherRef) ops.push({ op: 'add_relationship', from: fatherRef, to: sibRef, type: 'parent' });
          if (motherRef) ops.push({ op: 'add_relationship', from: motherRef, to: sibRef, type: 'parent' });
        }
      }

      if (ops.length > 0) {
        const childDesc = child ? ` connected to ${child.first_name} ${child.last_name}` : '';
        const fatherDesc = rawFather ? `${rawFather} (Father)` : '';
        const motherDesc = rawMother ? `${rawMother} (Mother)` : '';
        const allDescriptions = [fatherDesc, motherDesc, ...siblingDescs].filter(Boolean);
        const formattedPeople =
          allDescriptions.length === 1
            ? allDescriptions[0]
            : allDescriptions.slice(0, -1).join(', ') + ' and ' + allDescriptions[allDescriptions.length - 1];

        return {
          reply: `I have prepared ${formattedPeople}${childDesc}. Please review the proposed records below and click **Add to archive** (or reply 'Add to archive') to save them to the family tree!`,
          proposal: {
            summary: `Add ${formattedPeople}${childDesc}`,
            operations: ops,
          },
        };
      }
    }
  }

  // Case 2: In-law matching
  const inlawMatch = lower.match(/\b(father-in-law|mother-in-law|parent-in-law|parent in-?laws?|in-?laws?)\b/i);
  if (inlawMatch) {
    const inlawType = inlawMatch[1].toLowerCase();
    const isFather = inlawType.includes('father');
    const isMother = inlawType.includes('mother');

    // Find anchor member in context
    let anchor = findMember(lower) || findMember(prevUserMsg.toLowerCase());

    let remaining = text
      .replace(/\b(add|insert|record|please|to|for|our|my)\b/gi, '')
      .replace(new RegExp(`\\b${anchor ? anchor.first_name : ''}('s)?\\b`, 'gi'), '')
      .replace(/\b(father-in-law|mother-in-law|parent-in-law|parent in-?laws?|in-?laws?)\b/gi, '')
      .replace(/[:,]/g, ' ')
      .trim();

    let dob = null;
    let birthPlace = null;
    const bioNotes = [];

    const dateMatch = remaining.match(/\b(19\d{2}|20\d{2})(-\d{2}-\d{2})?\b/);
    if (dateMatch) {
      if (dateMatch[2]) {
        dob = `${dateMatch[1]}${dateMatch[2]}`;
      } else {
        bioNotes.push(`Born c. ${dateMatch[1]}`);
      }
      remaining = remaining.replace(dateMatch[0], '').replace(/\bborn\b/gi, '').trim();
    }

    const placeMatch = remaining.match(/\bin ([a-zA-Z\s]+)/i);
    if (placeMatch) {
      birthPlace = placeMatch[1].trim();
      remaining = remaining.replace(placeMatch[0], '').trim();
    }

    // Look up anchor's spouse
    let spouse = null;
    if (anchor) {
      const spouseRes = await client.query(
        `SELECT m.id, m.first_name, m.last_name, m.generation
         FROM relationships r
         JOIN members m ON m.id = r.to_member_id
         WHERE r.from_member_id = $1 AND r.relationship_type = 'spouse' AND r.family_id = $2
         LIMIT 1`,
        [anchor.id, familyId]
      );
      if (spouseRes.rowCount > 0) {
        spouse = spouseRes.rows[0];
      }
    }

    const rawNames = remaining
      .split(/\band\b|&/i)
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter((s) => s.length >= 2);

    const ops = [];
    let pIdx = 1;

    for (const rawName of rawNames) {
      const parts = rawName.split(' ');
      const firstName = parts[0] || 'In-law';
      const lastName = parts.slice(1).join(' ') || (anchor ? anchor.last_name : 'Elder');
      const ref = `p${pIdx++}`;

      const gender = isFather
        ? 'male'
        : isMother
        ? 'female'
        : pIdx === 2 && rawNames.length === 2
        ? 'male'
        : pIdx === 3 && rawNames.length === 2
        ? 'female'
        : null;

      const gen = spouse?.generation ?? (anchor?.generation ?? 2);
      const inlawGen = gen - 1;

      ops.push({
        op: 'add_member',
        ref,
        data: {
          first_name: firstName,
          last_name: lastName,
          gender,
          generation: inlawGen,
          birth_place: birthPlace,
          date_of_birth: dob,
          is_living: true,
          bio: [
            anchor ? `Parent-in-law of ${anchor.first_name} ${anchor.last_name}` : 'Family in-law',
            spouse ? `(Parent of ${spouse.first_name} ${spouse.last_name})` : '',
            ...bioNotes,
          ]
            .filter(Boolean)
            .join(' '),
        },
      });

      if (spouse) {
        ops.push({
          op: 'add_relationship',
          from: ref,
          to: spouse.id,
          type: 'parent',
        });
      }
    }

    if (ops.filter((o) => o.op === 'add_member').length === 2) {
      ops.push({
        op: 'add_relationship',
        from: 'p1',
        to: 'p2',
        type: 'spouse',
      });
    }

    if (ops.length > 0) {
      const memberOps = ops.filter((o) => o.op === 'add_member');
      const namesStr = memberOps.map((m) => `${m.data.first_name} ${m.data.last_name}`).join(' and ');
      const anchorStr = anchor ? ` for ${anchor.first_name} ${anchor.last_name}` : '';
      const spouseNote = spouse
        ? ` (connected as parent of spouse ${spouse.first_name})`
        : anchor
        ? ` (when you add ${anchor.first_name}'s spouse, they will link automatically)`
        : '';

      return {
        reply: `I have prepared ${namesStr}${anchorStr}${spouseNote}. Please review the proposed records below and click **Add to archive** to save!`,
        proposal: {
          summary: `Add in-laws: ${namesStr}${anchorStr}`,
          operations: ops,
        },
      };
    }
  }

  // Case 3: Generic direct relative (spouse, child, parent)
  const relMatch = lower.match(/\b(wife|husband|spouse|son|daughter|child|father|mother|parent)\b/i);
  if (relMatch) {
    const relWord = relMatch[1].toLowerCase();
    const anchor = findMember(lower) || findMember(prevUserMsg.toLowerCase());

    if (anchor) {
      const remaining = text
        .replace(/\b(add|insert|record|please|to|for|our|my)\b/gi, '')
        .replace(new RegExp(`\\b${anchor.first_name}('s)?\\b`, 'gi'), '')
        .replace(new RegExp(`\\b${relWord}\\b`, 'gi'), '')
        .trim();

      const parts = remaining.split(' ').filter(Boolean);
      if (parts.length >= 1) {
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || anchor.last_name;
        const ref = 'p1';

        const isSpouse = ['wife', 'husband', 'spouse'].includes(relWord);
        const isChild = ['son', 'daughter', 'child'].includes(relWord);
        const isParent = ['father', 'mother', 'parent'].includes(relWord);

        const gender = ['wife', 'daughter', 'mother'].includes(relWord)
          ? 'female'
          : ['husband', 'son', 'father'].includes(relWord)
          ? 'male'
          : null;

        const gen = isParent ? anchor.generation - 1 : isChild ? anchor.generation + 1 : anchor.generation;

        const ops = [
          {
            op: 'add_member',
            ref,
            data: {
              first_name: firstName,
              last_name: lastName,
              gender,
              generation: gen,
              is_living: true,
            },
          },
        ];

        if (isSpouse) {
          ops.push({ op: 'add_relationship', from: anchor.id, to: ref, type: 'spouse' });
        } else if (isChild) {
          ops.push({ op: 'add_relationship', from: anchor.id, to: ref, type: 'parent' });
        } else if (isParent) {
          ops.push({ op: 'add_relationship', from: ref, to: anchor.id, type: 'parent' });
        }

        return {
          reply: `I have prepared ${firstName} ${lastName} as ${relWord} of ${anchor.first_name}. Please review below and confirm!`,
          proposal: {
            summary: `Add ${firstName} ${lastName} (${relWord} of ${anchor.first_name})`,
            operations: ops,
          },
        };
      }
    }
  }

  return null;
}

/**
 * Intelligent Heritage Knowledge Synthesizer (Fallback engine).
 */
function synthesizeResponse(query, context, callerName, history = []) {
  const q = query.toLowerCase();
  const { family, members, biographies, language, recipes, chronicle } = context;

  // 0. Detect clear intent to add/create data
  const isAddIntent = /\b(add|insert|create|record|new person|in-?laws?|father-in-law|mother-in-law|parent-in-law|parents?)\b/i.test(q);
  if (isAddIntent) {
    return (
      `To add a relative or in-law to the family tree, tell me their name and who they are related to (e.g. *"Father is Gilbert Mwongera, mother is Isabella Kinya, parents to Mercy"*).\n\n` +
      `You can also click the **+ Add Member** button in the top navigation bar anytime!`
    );
  }

  // 1. Founders / Patriarchs
  if (
    q.includes('gerald') ||
    q.includes('ikunyua') ||
    q.includes('senior chief') ||
    q.includes('founder') ||
    q.includes('patriarch')
  ) {
    const geraldBio = biographies.find(
      (b) =>
        b.first_name?.toLowerCase().includes('gerald') ||
        b.last_name?.toLowerCase().includes('ikunyua')
    );
    const geraldMember = members.find(
      (m) =>
        m.first_name?.toLowerCase().includes('gerald') ||
        m.is_founder === true
    );

    if (geraldBio || geraldMember) {
      let response = `**Senior Chief Gerald Kithinji M'Ikunyua** is the revered founding patriarch of the ${family.name || "M'Ikunyua"} lineage.\n\n`;
      if (geraldBio?.professional_summary) {
        response += `${geraldBio.professional_summary}\n\n`;
      }
      if (geraldBio?.early_life_background) {
        response += `**Early Life & Origins:** ${geraldBio.early_life_background}\n\n`;
      }
      if (geraldBio?.public_service_chieftainship) {
        response += `**Public Service & Leadership:** ${geraldBio.public_service_chieftainship}\n\n`;
      }
      if (geraldBio?.agricultural_pioneering) {
        response += `**Agricultural & Community Impact:** ${geraldBio.agricultural_pioneering}\n\n`;
      }
      response += `Gerald's vision of unity, education, and heritage lives on directly in our family archive!`;
      return response;
    }
  }

  // 2. Lily Ncurubi / Matriarch
  if (q.includes('lily') || q.includes('ncurubi') || q.includes('matriarch')) {
    const lilyBio = biographies.find((b) => b.first_name?.toLowerCase().includes('lily'));
    const lilyMember = members.find((m) => m.first_name?.toLowerCase().includes('lily'));
    if (lilyBio || lilyMember) {
      let response = `**Lily Ncurubi** is a cherished cornerstone of our family.\n\n`;
      if (lilyBio?.professional_summary) {
        response += `${lilyBio.professional_summary}\n\n`;
      } else if (lilyMember?.bio) {
        response += `${lilyMember.bio}\n\n`;
      }
      return response;
    }
  }

  // 3. Meru Language, Proverbs, Sayings & Words
  if (
    q.includes('proverb') ||
    q.includes('saying') ||
    q.includes('vault') ||
    /\b(word|words)\b/i.test(q) ||
    q.includes('meru') ||
    q.includes('kimeru') ||
    q.includes('elder')
  ) {
    if (language && language.length > 0) {
      const matchedWord = language.find(
        (l) => q.includes(l.term.toLowerCase()) || (l.answer && q.includes(l.answer.toLowerCase()))
      );
      if (matchedWord) {
        return `**"${matchedWord.term}"**\n\n*Meaning / English:* ${matchedWord.meaning}\n${matchedWord.answer ? `*Answer / Response:* ${matchedWord.answer}\n` : ''}*Category:* ${matchedWord.entry_type || 'Heritage Vault'}\n\nThis wisdom reflects the rich cultural traditions preserved in our vault.`;
      }

      const proverbs = language.filter(
        (l) => l.entry_type === 'proverb' || l.entry_type === 'saying'
      );
      const sample = proverbs.slice(0, 3);
      let response = `Here are some treasured pearls of wisdom from our **Heritage Vault**:\n\n`;
      sample.forEach((item, idx) => {
        response += `${idx + 1}. **"${item.term}"**\n   *Meaning:* ${item.meaning}\n\n`;
      });
      response += `You can explore and listen to pronunciation recordings in the **Heritage Vault** section!`;
      return response;
    }
  }

  // 4. Recipes & Traditional Food
  if (
    q.includes('recipe') ||
    q.includes('cook') ||
    q.includes('food') ||
    q.includes('dish') ||
    q.includes('mukimo') ||
    q.includes('irio') ||
    q.includes('meal')
  ) {
    if (recipes && recipes.length > 0) {
      const matched = recipes.find((r) => q.includes(r.title.toLowerCase()));
      if (matched) {
        const ing = Array.isArray(matched.ingredients) ? matched.ingredients.join(', ') : matched.ingredients;
        let response = `### 🍲 ${matched.title}\n\n`;
        if (matched.family_story) response += `*Family Tradition:* ${matched.family_story}\n\n`;
        if (matched.cook_time) response += `⏱️ *Cook Time:* ${matched.cook_time}\n\n`;
        if (ing) response += `**Key Ingredients:**\n${ing}\n\n`;
        response += `You can view full step-by-step preparation instructions in the **Family Cookbook**!`;
        return response;
      }

      let response = `Our **Family Cookbook** features authentic heritage recipes passed down through generations:\n\n`;
      recipes.slice(0, 4).forEach((r) => {
        response += `- **${r.title}** (${r.category || 'Traditional'}) — ${r.family_story ? r.family_story.slice(0, 100) + '…' : 'Heritage classic'}\n`;
      });
      response += `\nWould you like the ingredients or cooking story for any of these?`;
      return response;
    }
  }

  // 5. Chronicle & Family Eras (word boundary prevents matching "generation")
  if (
    q.includes('chronicle') ||
    /\b(era|eras|history|timeline|colonial|mau mau)\b/i.test(q)
  ) {
    if (chronicle && chronicle.length > 0) {
      let response = `Our family journey through time is recorded across several milestone eras in the **Family History Chronicle**:\n\n`;
      chronicle.slice(0, 4).forEach((e) => {
        response += `**${e.era_label}: ${e.headline}**\n${e.narrative ? e.narrative.slice(0, 160) + '…\n\n' : '\n'}`;
      });
      response += `You can walk through the full historical chronicle in the **Chronicle** tab.`;
      return response;
    }
  }

  // 6. Specific member search
  for (const m of members) {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    if (q.includes(fullName) || (m.first_name && q.includes(m.first_name.toLowerCase()) && m.first_name.length > 3)) {
      let response = `### 👤 ${m.first_name} ${m.last_name}\n\n`;
      if (m.professional_title) response += `**Title:** ${m.professional_title}\n`;
      if (m.generation !== undefined && m.generation !== null) response += `**Generation:** Generation ${m.generation}\n`;
      if (m.date_of_birth) response += `**Born:** ${m.date_of_birth}${m.birth_place ? ` in ${m.birth_place}` : ''}\n`;
      if (!m.is_living && m.date_of_passing) response += `**Resting Place:** ${m.resting_place || 'Resting in peace'} (${m.date_of_passing})\n`;
      if (m.named_after) response += `**Named After:** ${m.named_after}\n`;
      if (m.occupation) response += `**Occupation / Calling:** ${m.occupation}\n`;
      if (m.bio) response += `\n${m.bio}\n`;
      response += `\nYou can view their complete profile, relationships, and tagged photos in the **Member Directory**.`;
      return response;
    }
  }

  // 7. Conversational response (avoids repeating initial welcome if already chatting)
  if (history && history.length > 0) {
    return (
      `I'm here to help with the **${family.name}** archives. If you would like to add relatives or in-laws, simply tell me their names and how they connect (for example: *"Father is Gilbert Mwongera, mother is Isabella Kinya, parents to Mercy"*).`
    );
  }

  const rawFamName = (family.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
  const asstTitle = `${rawFamName} Assistant`;

  return (
    `Greetings, ${callerName || 'family member'}! I am your **${asstTitle}**.\n\n` +
    `I hold knowledge of the **${family.name}** ancestry, spanning our ${members.length} documented family members, biographical milestones, traditional proverbs, recipes, and historical chronicle.\n\n` +
    `Here are some things you can ask me:\n` +
    `• *"Tell me about Senior Chief Gerald Kithinji M'Ikunyua's early life."*\n` +
    `• *"What traditional recipes are in our cookbook?"*\n` +
    `• *"Share a proverb or saying from our Heritage Vault."*\n` +
    `• *"Add Kamau's father-in-law John Mwangi"* or *"Add a new family recipe"*\n\n` +
    `What aspect of our family story would you like to explore today?`
  );
}

// ===========================================================================
// Routes
// ===========================================================================

/**
 * GET /api/assistant/status
 */
assistant.get('/status', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) {
      return c.json({ ok: false, error: 'No family linked' }, 403);
    }

    const isApproved = isFamilyApproved(c.env, profile.family_id);
    const canPropose = isApproved && profile.role !== 'guest';

    return c.json({
      ok: true,
      familyId: profile.family_id,
      isApproved,
      isAdmin: ADMIN_ROLES.has(profile.role),
      canPropose,
      enabled: canPropose,
      hasWorkersAi: Boolean(c.env.AI),
      hasExternalAi: Boolean(c.env.ANTHROPIC_API_KEY || c.env.OPENAI_API_KEY || c.env.GEMINI_API_KEY),
    });
  });
});

/**
 * GET /api/assistant/suggestions
 */
assistant.get('/suggestions', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) {
      return c.json({ suggestions: [] });
    }

    const suggestions = [
      "Tell me about Senior Chief Gerald M'Ikunyua's early life and legacy",
      "Who was our family founder and how did our roots begin?",
      "Share a wise proverb from the Heritage Vault and explain it",
      "What traditional recipes are in our cookbook?",
      "Add a family member, parent-in-law, or ancestor",
      "Add a traditional family recipe to our cookbook",
      "Record a family memory or proverb in our vault",
    ];

    return c.json({ suggestions });
  });
});

/**
 * POST /api/assistant/chat
 * Unified chat endpoint. Supports all family members adding in-laws, members, recipes, proverbs, events.
 */
assistant.post('/chat', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message || 'Invalid chat payload' }, 400);
  }

  const user = c.get('user');
  const { message, history } = parsed.data;

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) {
      return c.json({ error: 'No family linked to your account' }, 403);
    }

    if (!isFamilyApproved(c.env, profile.family_id)) {
      return c.json(
        { error: 'The AI Family Assistant is not enabled for this family space. Contact an administrator.' },
        403
      );
    }

    const canPropose = profile.role !== 'guest';
    const famId = profile.family_id;

    // 1. Gather family context
    const context = await getFamilyContext(client, famId);

    // 2. Intelligent in-process Parser (runs first for high accuracy on family additions & multi-turn dialog)
    if (canPropose) {
      try {
        const parsedProposal = await parseNaturalLanguageEntry(message, history, context, client, famId);
        if (parsedProposal) {
          return c.json({
            reply: parsedProposal.reply,
            proposal: parsedProposal.proposal,
            source: 'synthesizer',
          });
        }
      } catch (parserErr) {
        console.warn('[assistant] Natural language parse error:', parserErr);
      }
    }

    const membersSummary = context.members
      .slice(0, 35)
      .map(
        (m) =>
          `- ${m.first_name} ${m.last_name} (Gen ${m.generation ?? '?'}${m.is_founder ? ', Founder' : ''}${
            m.professional_title ? `, ${m.professional_title}` : ''
          }${m.named_after ? `, Named After: ${m.named_after}` : ''})`
      )
      .join('\n');

    const proverbsSummary = context.language
      .slice(0, 12)
      .map((l) => `- "${l.term}": ${l.meaning}`)
      .join('\n');

    const recipesSummary = context.recipes
      .slice(0, 8)
      .map((r) => `- ${r.title} (${r.category})`)
      .join('\n');

    const rawFamName = (context.family?.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
    const asstTitle = `${rawFamName} Assistant`;

    // 3. Anthropic Tool-Calling (if key is configured)
    if (canPropose && c.env.ANTHROPIC_API_KEY) {
      const entrySystemPrompt = `You are the "${asstTitle}" (Family Griot and Heritage Keeper) for the ${context.family.name || 'Family'}.
You assist family members in exploring archive knowledge AND safely entering new family records into the tree, cookbook, memories, heritage vault, and events.

GROUNDING KNOWLEDGE BASE:
Family Name: ${context.family.name}
Family Motto: ${context.family.motto || 'Preserving our roots for future generations'}
Origin: ${context.family.origin_story || 'Meru, Kenya'}

Recent Family Members:
${membersSummary}

Heritage Vault Proverbs & Sayings:
${proverbsSummary}

Family Recipes:
${recipesSummary}

RULES FOR DATA ENTRY:
1. When the user provides new facts or requests to add/update people, in-laws, relationships, recipes, memories, proverbs, or events:
   - For people: ALWAYS call search_members first to check if they or their relatives already exist.
   - For multiple relatives: Always extract ALL people mentioned in the user's message (father, mother, sister, brother, child, spouse). Never omit any person!
   - For in-laws: A parent-in-law (father-in-law or mother-in-law) is the parent of someone's spouse. Search for the member's spouse, add the in-law as a member, and add a 'parent' relationship from the in-law to the spouse.
   - For siblings: Add the sibling as a member, and connect the parents to the sibling with 'parent' relationships.
   - For parents: Add both father and mother, link them as 'spouse', and link both as 'parent' to the children.
   - For recipes: call search_recipes to avoid duplicates.
   - For proverbs/sayings: call search_language to check if already recorded.
   - If something is unclear, ask a brief clarifying question instead of guessing.
   - Dates: only fill date_of_birth, date_of_passing, or starts_at when you have the appropriate full format (YYYY-MM-DD or ISO timestamp). If only a year is known, leave date null and add to bio (e.g. "Born c. 1945").
   - Generations: Older ancestors can have negative generations (e.g. Gen 0, Gen -1, Gen -2). If parent is Gen -1, child is Gen 0.
   - Parent relationships: from = parent, to = child. Spouse relationships: give one entry; the server stores both directions.
   - When you have enough information, call propose_changes.
   - In your text, warmly explain what you have prepared for review and tell the user they can click "Add to archive" or reply "Add to archive" to save them.
2. When the user confirms with "add to archive", "yes", "save", or "confirm":
   - Warmly tell them they can click the "Add to archive" button on the proposal card to save the items, and do not reset the conversation or ask who to add.
3. When the user asks a question:
   - Answer directly and warmly from the knowledge base without calling propose_changes.`;

      try {
        const convo = toAnthropicMessages(history, message);

        for (let turn = 0; turn < 6; turn++) {
          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': c.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: c.env.ASSISTANT_MODEL || 'claude-sonnet-5-5',
              max_tokens: 1500,
              system: entrySystemPrompt,
              tools: TOOLS,
              messages: convo,
            }),
          });

          if (!anthropicRes.ok) {
            console.error('[assistant] Anthropic API error', anthropicRes.status);
            break;
          }

          const out = await anthropicRes.json();
          convo.push({ role: 'assistant', content: out.content });

          const calls = (out.content || []).filter((b) => b.type === 'tool_use');
          const text = (out.content || [])
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('\n');

          if (!calls.length) {
            return c.json({ reply: text, proposal: null, source: 'anthropic' });
          }

          const results = [];
          for (const call of calls) {
            if (call.name === 'propose_changes') {
              const parsed = proposalSchema.safeParse(call.input);
              if (!parsed.success) {
                results.push({
                  type: 'tool_result',
                  tool_use_id: call.id,
                  is_error: true,
                  content: parsed.error.issues[0]?.message || 'Invalid proposal format',
                });
                continue;
              }
              return c.json({
                reply: text || parsed.data.summary,
                proposal: parsed.data,
                source: 'anthropic',
              });
            }

            if (call.name === 'search_members') {
              const q = `%${String(call.input.query || '').slice(0, 80)}%`;
              const r = await client.query(
                `SELECT id, first_name, last_name, maiden_name, generation, date_of_birth, is_living, birth_place
                 FROM members
                 WHERE family_id = $1 AND (first_name ILIKE $2 OR last_name ILIKE $2 OR maiden_name ILIKE $2
                       OR (first_name || ' ' || last_name) ILIKE $2)
                 ORDER BY last_name, first_name LIMIT 10`,
                [famId, q]
              );
              results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(r.rows) });
            } else if (call.name === 'search_recipes') {
              const q = `%${String(call.input.query || '').slice(0, 80)}%`;
              const r = await client.query(
                `SELECT id, title, category, cook_time, ingredients
                 FROM recipes
                 WHERE family_id = $1 AND title ILIKE $2
                 ORDER BY title LIMIT 10`,
                [famId, q]
              );
              results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(r.rows) });
            } else if (call.name === 'search_language') {
              const q = `%${String(call.input.query || '').slice(0, 80)}%`;
              const r = await client.query(
                `SELECT id, entry_type, term, meaning, answer
                 FROM language_entries
                 WHERE family_id = $1 AND (term ILIKE $2 OR meaning ILIKE $2)
                 ORDER BY term LIMIT 10`,
                [famId, q]
              );
              results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(r.rows) });
            }
          }
          convo.push({ role: 'user', content: results });
        }
      } catch (err) {
        console.warn('[assistant] Tool calling failed, transitioning:', err);
      }
    }

    // 4. Workers AI (Q&A and conversational knowledge)
    const qaSystemPrompt = `You are the "${asstTitle}" (Family Griot and Heritage Keeper) for the ${context.family.name || 'Family'}.
You are warm, wise, culturally proud, respectful, and deeply knowledgeable about the family's lineage, heritage, elders, recipes, and traditions.

GROUNDING KNOWLEDGE BASE:
Family Name: ${context.family.name}
Family Motto: ${context.family.motto || 'Preserving our roots for future generations'}
Origin: ${context.family.origin_story || 'Meru, Kenya'}

Key Family Members:
${membersSummary}

Heritage Vault Proverbs & Sayings:
${proverbsSummary}

Family Recipes:
${recipesSummary}

INSTRUCTIONS:
1. Ground answers accurately in the provided family knowledge.
2. If asked about in-laws, explain that a father-in-law or mother-in-law is the parent of someone's spouse.
3. Be respectful and culturally proud.`;

    if (c.env.AI) {
      try {
        const messages = [
          { role: 'system', content: qaSystemPrompt },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ];

        const aiRes = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages,
          max_tokens: 800,
        });

        const reply =
          typeof aiRes === 'string'
            ? aiRes
            : aiRes?.response || aiRes?.text || aiRes?.result?.response;

        if (reply && reply.trim()) {
          return c.json({ reply: reply.trim(), proposal: null, source: 'workers-ai' });
        }
      } catch (aiErr) {
        console.warn('[Assistant] Cloudflare Workers AI call failed:', aiErr);
      }
    }

    // 5. Synthesizer fallback
    const reply = synthesizeResponse(message, context, profile.display_name, history);
    return c.json({ reply, proposal: null, source: 'synthesizer' });
  });
});

// ===========================================================================
// POST /api/assistant/commit
// Saves approved proposals to Postgres across tree, recipes, memories, language, events.
// Transactional, with audit logging.
// ===========================================================================

assistant.post('/commit', async (c) => {
  const parsedBody = proposalSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsedBody.success) {
    return c.json({ error: parsedBody.error.issues[0]?.message || 'Invalid proposal payload' }, 400);
  }
  const proposal = parsedBody.data;

  return withClient(c.env, async (client) => {
    const user = c.get('user');
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id || profile.role === 'guest') {
      return c.json({ error: 'Guests cannot make changes to the family archive' }, 403);
    }
    if (!isFamilyApproved(c.env, profile.family_id)) {
      return c.json({ error: 'Assistant data entry is not enabled for this family' }, 403);
    }

    const fam = profile.family_id;

    try {
      await client.query('BEGIN');

      // 1. Resolve temp refs -> UUIDs
      const refToId = new Map();
      const newGen = new Map();

      for (const op of proposal.operations) {
        if (op.op === 'add_member' && op.ref) {
          refToId.set(op.ref, crypto.randomUUID());
        } else if (op.op === 'add_recipe' && op.ref) {
          refToId.set(op.ref, crypto.randomUUID());
        } else if (op.op === 'add_memory' && op.ref) {
          refToId.set(op.ref, crypto.randomUUID());
        } else if (op.op === 'add_language_entry' && op.ref) {
          refToId.set(op.ref, crypto.randomUUID());
        } else if (op.op === 'add_event' && op.ref) {
          refToId.set(op.ref, crypto.randomUUID());
        }
      }

      const resolve = (x) => refToId.get(x) ?? x;

      // 2. Validate all existing IDs belong to this family
      const existingMemberIds = new Set();
      for (const op of proposal.operations) {
        if (op.op === 'update_member') existingMemberIds.add(op.id);
        if (op.op === 'add_relationship') {
          for (const x of [op.from, op.to]) {
            if (!refToId.has(x)) existingMemberIds.add(x);
          }
        }
      }

      for (const id of existingMemberIds) {
        if (!UUID_RE.test(id)) throw new UserError('The proposal refers to an invalid member identifier');
      }

      const gens = new Map();
      if (existingMemberIds.size) {
        const r = await client.query(
          `SELECT id, generation FROM members WHERE family_id = $1 AND id = ANY($2::uuid[])`,
          [fam, [...existingMemberIds]]
        );
        if (r.rowCount !== existingMemberIds.size) {
          throw new UserError('A referenced person does not exist in your family');
        }
        r.rows.forEach((m) => gens.set(m.id, m.generation));
      }

      // 3. Validate relationships: no self-links, no parent cycles
      const rels = proposal.operations.filter((o) => o.op === 'add_relationship');
      for (const r of rels) {
        const f = resolve(r.from);
        const t = resolve(r.to);
        if (f === t) throw new UserError('A person cannot be related to themselves');

        if (r.type === 'parent' && !refToId.has(r.from) && !refToId.has(r.to)) {
          const loop = await client.query(
            `WITH RECURSIVE d AS (
               SELECT to_member_id AS id FROM relationships WHERE relationship_type='parent' AND from_member_id = $1
               UNION
               SELECT r.to_member_id FROM relationships r JOIN d ON r.from_member_id = d.id WHERE r.relationship_type='parent'
             )
             SELECT 1 FROM d WHERE id = $2 LIMIT 1`,
            [t, f]
          );
          if (loop.rowCount) throw new UserError('That parent relationship would create an ancestral loop');
        }
      }

      // 4. Derive generation for new members (supports negative generations!)
      for (const op of proposal.operations) {
        if (op.op !== 'add_member') continue;
        const id = refToId.get(op.ref);
        let g = op.data.generation ?? null;

        for (const r of rels) {
          const f = resolve(r.from);
          const t = resolve(r.to);
          if (r.type === 'parent' && t === id && gens.has(f)) g = gens.get(f) + 1;
          if (r.type === 'parent' && f === id && gens.has(t)) g = gens.get(t) - 1;
          if (r.type === 'spouse' && (f === id || t === id)) {
            const partnerId = f === id ? t : f;
            if (gens.has(partnerId)) g = gens.get(partnerId);
          }
        }

        if (g == null) g = 1;
        newGen.set(id, g);
        gens.set(id, g);
      }

      // 5. Apply each operation
      for (const op of proposal.operations) {
        // --- ADD MEMBER ---
        if (op.op === 'add_member') {
          const d = op.data;
          const id = refToId.get(op.ref);

          if (d.date_of_birth && d.date_of_passing && d.date_of_passing < d.date_of_birth) {
            throw new UserError(`${d.first_name}: passing date cannot be before birth date`);
          }

          if (d.date_of_birth) {
            const dup = await client.query(
              `SELECT 1 FROM members WHERE family_id = $1 AND lower(first_name) = lower($2)
                 AND lower(last_name) = lower($3) AND date_of_birth = $4 LIMIT 1`,
              [fam, d.first_name, d.last_name, d.date_of_birth]
            );
            if (dup.rowCount) {
              throw new UserError(`${d.first_name} ${d.last_name} (born ${d.date_of_birth}) is already in the tree`);
            }
          }

          await client.query(
            `INSERT INTO members (
               id, family_id, first_name, last_name, maiden_name, gender, generation, is_living,
               date_of_birth, date_of_passing, birth_place, resting_place, occupation, professional_title,
               bio, location
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [
              id,
              fam,
              d.first_name,
              d.last_name,
              d.maiden_name ?? null,
              d.gender ?? null,
              newGen.get(id),
              d.is_living && !d.date_of_passing,
              d.date_of_birth ?? null,
              d.date_of_passing ?? null,
              d.birth_place ?? null,
              d.resting_place ?? null,
              d.occupation ?? null,
              d.professional_title ?? null,
              d.bio ?? null,
              d.location ?? null,
            ]
          );

          if (d.named_after) {
            await client.query(
              `UPDATE members SET named_after = $1 WHERE id = $2 AND family_id = $3`,
              [d.named_after, id, fam]
            ).catch(() => {});
          }

          await audit(client, fam, user.id, 'assistant_add_member', 'member', id, {
            name: `${d.first_name} ${d.last_name}`,
            generation: newGen.get(id),
          });
        }

        // --- UPDATE MEMBER ---
        else if (op.op === 'update_member') {
          const entries = Object.entries(op.data).filter(([, v]) => v !== undefined);
          if (entries.length) {
            const sets = entries.map(([k], i) => `${k} = $${i + 3}`).join(', ');
            await client.query(
              `UPDATE members SET ${sets}, updated_at = now() WHERE id = $1 AND family_id = $2`,
              [op.id, fam, ...entries.map(([, v]) => v)]
            );
            await audit(client, fam, user.id, 'assistant_update_member', 'member', op.id, op.data);
          }
        }

        // --- ADD RELATIONSHIP ---
        else if (op.op === 'add_relationship') {
          const f = resolve(op.from);
          const t = resolve(op.to);
          const pairs = op.type === 'spouse' ? [[f, t], [t, f]] : [[f, t]];

          for (const [a, b] of pairs) {
            await client.query(
              `INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, started_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
               ON CONFLICT (from_member_id, to_member_id, relationship_type)
               DO UPDATE SET started_at = COALESCE(EXCLUDED.started_at, relationships.started_at)`,
              [fam, a, b, op.type, op.started_at ?? null]
            );
          }
          await audit(client, fam, user.id, 'assistant_add_relationship', 'relationship', null, {
            from: f,
            to: t,
            type: op.type,
          });
        }

        // --- ADD RECIPE ---
        else if (op.op === 'add_recipe') {
          const d = op.data;
          const recipeId = (op.ref && refToId.get(op.ref)) || crypto.randomUUID();

          const dup = await client.query(
            `SELECT 1 FROM recipes WHERE family_id = $1 AND lower(title) = lower($2) LIMIT 1`,
            [fam, d.title]
          );
          if (dup.rowCount) {
            throw new UserError(`Recipe "${d.title}" already exists in the cookbook`);
          }

          const albumRes = await client.query(
            `SELECT id FROM cookbook_albums WHERE family_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [fam]
          );
          let albumId = albumRes.rows[0]?.id;
          if (!albumId) {
            const newAlbum = await client.query(
              `INSERT INTO cookbook_albums (id, family_id, title, style)
               VALUES (gen_random_uuid(), $1, 'Traditional Family Cookbook', 'traditional') RETURNING id`,
              [fam]
            );
            albumId = newAlbum.rows[0].id;
          }

          await client.query(
            `INSERT INTO recipes (
               id, album_id, family_id, title, category, is_vegetarian,
               ingredients, instructions, cook_time, family_story
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              recipeId,
              albumId,
              fam,
              d.title,
              d.category || 'main',
              Boolean(d.is_vegetarian),
              d.ingredients || [],
              d.instructions || [],
              d.cook_time ?? null,
              d.family_story ?? null,
            ]
          );

          if (op.ref) refToId.set(op.ref, recipeId);
          await audit(client, fam, user.id, 'assistant_add_recipe', 'recipe', recipeId, { title: d.title });
        }

        // --- UPDATE RECIPE ---
        else if (op.op === 'update_recipe') {
          const entries = Object.entries(op.data).filter(([, v]) => v !== undefined);
          if (entries.length) {
            const sets = entries.map(([k], i) => `${k} = $${i + 3}`).join(', ');
            await client.query(
              `UPDATE recipes SET ${sets} WHERE id = $1 AND family_id = $2`,
              [op.id, fam, ...entries.map(([, v]) => v)]
            );
            await audit(client, fam, user.id, 'assistant_update_recipe', 'recipe', op.id, op.data);
          }
        }

        // --- ADD MEMORY ---
        else if (op.op === 'add_memory') {
          const d = op.data;
          const memoryId = (op.ref && refToId.get(op.ref)) || crypto.randomUUID();

          await client.query(
            `INSERT INTO memories (
               id, family_id, title, body, era, author_member_id, recorded_by_name, related_member_ids
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              memoryId,
              fam,
              d.title,
              d.body,
              d.era ?? null,
              d.author_member_id ?? null,
              d.author_name || profile.display_name || 'Family Member',
              d.related_member_ids || [],
            ]
          );

          if (op.ref) refToId.set(op.ref, memoryId);
          await audit(client, fam, user.id, 'assistant_add_memory', 'memory', memoryId, { title: d.title });
        }

        // --- ADD LANGUAGE ENTRY (PROVERB / SAYING / TERM) ---
        else if (op.op === 'add_language_entry') {
          const d = op.data;
          const langId = (op.ref && refToId.get(op.ref)) || crypto.randomUUID();

          const dup = await client.query(
            `SELECT 1 FROM language_entries WHERE family_id = $1 AND lower(term) = lower($2) LIMIT 1`,
            [fam, d.term]
          );
          if (dup.rowCount) {
            throw new UserError(`"${d.term}" already exists in the Heritage Vault`);
          }

          await client.query(
            `INSERT INTO language_entries (
               id, family_id, entry_type, term, meaning, answer, contributed_by_profile_id, contributed_by_name
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              langId,
              fam,
              d.entry_type || 'proverb',
              d.term,
              d.meaning,
              d.answer ?? null,
              user.id,
              profile.display_name || 'Family Griot',
            ]
          );

          if (op.ref) refToId.set(op.ref, langId);
          await audit(client, fam, user.id, 'assistant_add_language_entry', 'language_entry', langId, {
            term: d.term,
          });
        }

        // --- ADD EVENT ---
        else if (op.op === 'add_event') {
          const d = op.data;
          const eventId = (op.ref && refToId.get(op.ref)) || crypto.randomUUID();

          await client.query(
            `INSERT INTO events (
               id, family_id, title, event_type, description, location, starts_at, ends_at, created_by
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              eventId,
              fam,
              d.title,
              d.event_type || 'reunion',
              d.description ?? null,
              d.location ?? null,
              d.starts_at,
              d.ends_at ?? null,
              user.id,
            ]
          );

          if (op.ref) refToId.set(op.ref, eventId);
          await audit(client, fam, user.id, 'assistant_add_event', 'event', eventId, { title: d.title });
        }
      }

      await client.query('COMMIT');
      return c.json({ ok: true, created: Object.fromEntries(refToId) });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      if (e instanceof UserError) return c.json({ error: e.message }, 400);
      console.error('[assistant] commit failed:', e);
      return c.json({ error: e.message || 'Could not save. Nothing was changed.' }, 500);
    }
  });
});

async function audit(client, familyId, actorId, action, entityType, entityId, details) {
  try {
    await client.query(
      `INSERT INTO audit_log (family_id, actor_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [familyId, actorId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (err) {
    console.warn('[audit] failed to record audit log:', err);
  }
}

export default assistant;
