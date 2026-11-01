import { Hono } from 'hono';
import { z } from 'zod';
import { withClient, getOrCreateProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const assistant = new Hono();
assistant.use('*', requireAuth);

async function getProfile(client, userId) {
  return await getOrCreateProfile(client, userId);
}

// Request validation schema
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

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
      `SELECT first_name, last_name, gender, generation, is_living, date_of_birth, date_of_passing,
              birth_place, resting_place, occupation, professional_title, bio, is_founder, named_after
       FROM members WHERE family_id = $1 ORDER BY generation ASC, first_name ASC LIMIT 80`,
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
 * Intelligent Heritage Knowledge Synthesizer (Fallback engine).
 * Answers questions authoritatively using the retrieved database records.
 */
function synthesizeResponse(query, context, callerName) {
  const q = query.toLowerCase();
  const { family, members, biographies, language, recipes, chronicle, memories } = context;

  // 1. Founders / Patriarchs / Gerald Kithinji M'Ikunyua
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
    q.includes('word') ||
    q.includes('meru') ||
    q.includes('kimeru') ||
    q.includes('kĩmĩrũ') ||
    q.includes('elder')
  ) {
    if (language && language.length > 0) {
      // Check for specific word match
      const matchedWord = language.find(
        (l) => q.includes(l.term.toLowerCase()) || (l.answer && q.includes(l.answer.toLowerCase()))
      );
      if (matchedWord) {
        return `**"${matchedWord.term}"**\n\n*Meaning / English:* ${matchedWord.meaning}\n${matchedWord.answer ? `*Answer / Response:* ${matchedWord.answer}\n` : ''}*Category:* ${matchedWord.entry_type || 'Heritage Vault'}\n\nThis wisdom reflects the rich cultural traditions of the Meru people preserved in our vault.`;
      }

      // Return a selection of proverbs and sayings
      const proverbs = language.filter(
        (l) => l.entry_type === 'proverb' || l.entry_type === 'elder_proverb' || l.entry_type === 'family_saying'
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
        if (matched.cookTime) response += `⏱️ *Cook Time:* ${matched.cookTime}\n\n`;
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

  // 5. Chronicle & Family Eras / History
  if (
    q.includes('history') ||
    q.includes('chronicle') ||
    q.includes('era') ||
    q.includes('colonial') ||
    q.includes('mau mau') ||
    q.includes('origin') ||
    q.includes('1890') ||
    q.includes('timeline')
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
      if (m.generation) response += `**Generation:** Generation ${m.generation}\n`;
      if (m.date_of_birth) response += `**Born:** ${m.date_of_birth}${m.birth_place ? ` in ${m.birth_place}` : ''}\n`;
      if (!m.is_living && m.date_of_passing) response += `**Resting Place:** ${m.resting_place || 'Resting in peace'} (${m.date_of_passing})\n`;
      if (m.named_after) response += `**Named After:** ${m.named_after}\n`;
      if (m.occupation) response += `**Occupation / Calling:** ${m.occupation}\n`;
      if (m.bio) response += `\n${m.bio}\n`;
      response += `\nYou can view their complete profile, relationships, and tagged photos in the **Member Directory**.`;
      return response;
    }
  }

  // 7. General Family Overview / Welcome
  const rawFamName = (family.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
  const asstTitle = `${rawFamName} Assistant`;

  return (
    `Greetings, ${callerName || 'family member'}! I am your **${asstTitle}**.\n\n` +
    `I hold knowledge of the **${family.name}** ancestry, spanning our ${members.length} documented family members, biographical milestones, traditional Meru proverbs, recipes, and historical chronicle.\n\n` +
    `Here are some things you can ask me:\n` +
    `• *"Tell me about Senior Chief Gerald Kithinji M'Ikunyua's early life."*\n` +
    `• *"What traditional Meru recipes are in our cookbook?"*\n` +
    `• *"Share a proverb or saying from our Heritage Vault."*\n` +
    `• *"What historical eras are captured in our chronicle?"*\n` +
    `• *"Who was in Generation 1 or Generation 2?"*\n\n` +
    `What aspect of our family story would you like to explore today?`
  );
}

// ===========================================================================
// Routes
// ===========================================================================

/**
 * GET /api/assistant/status
 * Health, capability, and permission check.
 */
assistant.get('/status', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) {
      return c.json({ ok: false, error: 'No family linked' }, 403);
    }

    // Check optional family restrictions
    const allowed = c.env.APPROVED_FAMILY_IDS
      ? c.env.APPROVED_FAMILY_IDS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : null;

    const isApproved = !allowed || allowed.length === 0 || allowed.includes(profile.family_id.toLowerCase());

    return c.json({
      ok: true,
      familyId: profile.family_id,
      isApproved,
      hasWorkersAi: Boolean(c.env.AI),
      hasExternalAi: Boolean(c.env.ANTHROPIC_API_KEY || c.env.OPENAI_API_KEY || c.env.GEMINI_API_KEY),
    });
  });
});

/**
 * GET /api/assistant/suggestions
 * Provides prompt chips relevant to the active family archive.
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
      "What traditional Meru recipes are in our cookbook?",
      "What eras are documented in our Family Chronicle?",
      "How are our family branches organized across generations?",
    ];

    return c.json({ suggestions });
  });
});

/**
 * POST /api/assistant/chat
 * Primary conversation endpoint. Hardened with auth, family validation, and AI fallback.
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

    // Restriction check: Restricting assistant access to approved family IDs if configured
    const allowed = c.env.APPROVED_FAMILY_IDS
      ? c.env.APPROVED_FAMILY_IDS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : null;

    if (allowed && allowed.length > 0 && !allowed.includes(profile.family_id.toLowerCase())) {
      return c.json(
        { error: 'The AI Family Assistant is currently restricted for this family space. Contact an administrator.' },
        403
      );
    }

    // 1. Gather family archive context
    const context = await getFamilyContext(client, profile.family_id);

    // 2. Format system prompt with grounding context
    const membersSummary = context.members
      .slice(0, 30)
      .map(
        (m) =>
          `- ${m.first_name} ${m.last_name} (Gen ${m.generation || '?'}${m.is_founder ? ', Founder' : ''}${
            m.professional_title ? `, ${m.professional_title}` : ''
          }${m.named_after ? `, Named After: ${m.named_after}` : ''})`
      )
      .join('\n');

    const proverbsSummary = context.language
      .slice(0, 12)
      .map((l) => `- "${l.term}": ${l.meaning}`)
      .join('\n');

    const recipesSummary = context.recipes
      .slice(0, 6)
      .map((r) => `- ${r.title} (${r.category})`)
      .join('\n');

    const rawFamName = (context.family?.name || '').replace(/\s*family\s*/i, '').trim() || 'Family';
    const asstTitle = `${rawFamName} Assistant`;

    const systemPrompt = `You are the "${asstTitle}" (also honored as the Family Griot and Heritage Keeper) for the ${context.family.name || 'Family'}.
You are warm, wise, culturally proud, respectful, and deeply knowledgeable about the family's lineage, African/Meru heritage, values, elders, recipes, and traditions.

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

Detailed Biographies on record:
${context.biographies.map((b) => `Patriarch/Matriarch: ${b.first_name} ${b.last_name}\nSummary: ${b.professional_summary || ''}\nEarly Life: ${b.early_life_background || ''}\nPublic Service: ${b.public_service_chieftainship || ''}`).join('\n\n')}

INSTRUCTIONS:
1. Always be warm, respectful, and honor family elders and ancestral lineage.
2. Ground all answers accurately in the provided family knowledge.
3. If asked about Senior Chief Gerald Kithinji M'Ikunyua or Lily Ncurubi, share their accomplishments, leadership, and public service with reverence.
4. If asked about Meru proverbs or language, explain the literal meaning and cultural lesson.
5. If something is unknown or not recorded in the archives, politely encourage the family member to interview elders and record it in the app.`;

    // 3. Try Cloudflare Workers AI if bound
    if (c.env.AI) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
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
          return c.json({ reply: reply.trim(), source: 'workers-ai' });
        }
      } catch (aiErr) {
        console.warn('[Assistant] Cloudflare Workers AI call failed, transitioning to knowledge synthesizer:', aiErr);
      }
    }

    // 4. Try external LLM provider if configured
    if (c.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': c.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              ...history.map((h) => ({ role: h.role, content: h.content })),
              { role: 'user', content: message },
            ],
          }),
        });

        if (anthropicRes.ok) {
          const data = await anthropicRes.json();
          const reply = data.content?.[0]?.text;
          if (reply) {
            return c.json({ reply, source: 'anthropic' });
          }
        }
      } catch (extErr) {
        console.warn('[Assistant] Anthropic API failed:', extErr);
      }
    }

    // 5. Intelligent Heritage Knowledge Synthesis (100% resilient fallback)
    const reply = synthesizeResponse(message, context, profile.display_name);
    return c.json({ reply, source: 'synthesizer' });
  });
});

export default assistant;
