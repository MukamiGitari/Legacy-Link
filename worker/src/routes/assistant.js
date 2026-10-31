// src/routes/assistant.js
// AI data-entry assistant for legacy-link-api.
// Reads run immediately (search_members). Writes are only PROPOSED by the model;
// nothing touches the DB until the user approves and the client calls /commit.
//
// Paths match your deployed bundle: src/middleware/auth.js and src/db.js.
// (If your Hono import is "hono" vs "hono/tiny", copy whatever family.js uses.)
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { withClient, getOrCreateProfile } from "../db.js";

const loadProfile = (client, userId) => getOrCreateProfile(client, userId);

// Only admins may use the assistant for now (profiles.role is one of
// super_admin | family_admin | family_member | guest). Read from the DB profile,
// not the JWT, because the JWT role is frozen until the next token refresh.
const CAN_USE = new Set(["super_admin", "family_admin"]);
const denied = (profile) => !profile?.family_id || !CAN_USE.has(profile.role);

const assistant = new Hono();
assistant.use("*", requireAuth);

// Needs: wrangler secret put ANTHROPIC_API_KEY
const MODEL = (env) => env.ASSISTANT_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You help family members add people and relationships to their family tree.
Rules:
- ALWAYS call search_members before proposing a new person, to avoid duplicates. If a likely match exists, ask the user whether it is the same person.
- Never invent facts. If something is unclear (which spouse? which parent?), ask a short question instead of guessing.
- Dates: only fill date_of_birth / date_of_passing when you have a full YYYY-MM-DD. If only a year or "around" is known, leave the date null and add e.g. "Born c. 1938." to bio.
- Parent relationships: from = the parent, to = the child. Spouse: give one entry; the server stores both directions.
- When you have enough information, call propose_changes. Do not claim anything is saved; the user must approve first.
- Be brief and warm.`;

const TOOLS = [
  {
    name: "search_members",
    description: "Search existing family members by name (first, last or maiden). Returns up to 10 matches.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "propose_changes",
    description: "Propose records to add/update. Nothing is saved until the user approves.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "One-line human summary of the proposal" },
        operations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              op: { enum: ["add_member", "update_member", "add_relationship"] },
              ref: { type: "string", description: "add_member: temp name like p1 so relationships can point at it" },
              id: { type: "string", description: "update_member: existing member UUID" },
              data: { type: "object", description: "member fields (snake_case, see members table)" },
              from: { type: "string", description: "add_relationship: member UUID or temp ref" },
              to: { type: "string", description: "add_relationship: member UUID or temp ref" },
              type: { enum: ["parent", "spouse"] },
              started_at: { type: "string" },
            },
            required: ["op"],
          },
        },
      },
      required: ["summary", "operations"],
    },
  },
];

// ---- validation (shared by chat preview and commit) ----
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !isNaN(Date.parse(s)), "bad date");
const memberData = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  maiden_name: z.string().max(100).nullish(),
  gender: z.enum(["male", "female", "other"]).nullish(),
  is_living: z.boolean().default(true),
  date_of_birth: isoDate.nullish(),
  date_of_passing: isoDate.nullish(),
  birth_place: z.string().max(200).nullish(),
  resting_place: z.string().max(200).nullish(),
  occupation: z.string().max(200).nullish(),
  bio: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
  generation: z.number().int().min(1).max(20).nullish(),
});
const patchable = memberData.partial(); // update: any subset; no delete op exists on purpose
const opSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add_member"), ref: z.string().max(40), data: memberData }),
  z.object({ op: z.literal("update_member"), id: z.string().uuid(), data: patchable }),
  z.object({
    op: z.literal("add_relationship"),
    from: z.string(), to: z.string(),
    type: z.enum(["parent", "spouse"]),
    started_at: isoDate.nullish(),
  }),
]);
const proposalSchema = z.object({ summary: z.string().max(500), operations: z.array(opSchema).min(1).max(40) });

// ---- chat ----
assistant.post("/chat", async (c) => {
  const body = z.object({
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).min(1).max(30),
  }).parse(await c.req.json());

  return withClient(c.env, async (client) => {
    const profile = await loadProfile(client, c.get("userId"));
    if (denied(profile)) return c.json({ error: "The assistant is available to family admins" }, 403);

    const convo = body.messages.map((m) => ({ role: m.role, content: m.content }));

    for (let turn = 0; turn < 6; turn++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": c.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: MODEL(c.env), max_tokens: 1500, system: SYSTEM, tools: TOOLS, messages: convo }),
      });
      if (!res.ok) return c.json({ error: "Assistant unavailable" }, 502);
      const out = await res.json();
      convo.push({ role: "assistant", content: out.content });

      const calls = out.content.filter((b) => b.type === "tool_use");
      const text = out.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      if (!calls.length) return c.json({ reply: text, proposal: null });

      const results = [];
      for (const call of calls) {
        if (call.name === "propose_changes") {
          const parsed = proposalSchema.safeParse(call.input);
          if (!parsed.success) {
            results.push({ type: "tool_result", tool_use_id: call.id, is_error: true, content: parsed.error.issues[0].message });
            continue;
          }
          return c.json({ reply: text || parsed.data.summary, proposal: parsed.data });
        }
        if (call.name === "search_members") {
          const q = `%${String(call.input.query || "").slice(0, 80)}%`;
          const r = await client.query(
            `SELECT id, first_name, last_name, maiden_name, generation, date_of_birth, is_living, birth_place
               FROM members
              WHERE family_id = $1 AND (first_name ILIKE $2 OR last_name ILIKE $2 OR maiden_name ILIKE $2
                    OR (first_name || ' ' || last_name) ILIKE $2)
              ORDER BY last_name, first_name LIMIT 10`,
            [profile.family_id, q]
          );
          results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(r.rows) });
        }
      }
      convo.push({ role: "user", content: results });
    }
    return c.json({ reply: "I got stuck. Could you rephrase that?", proposal: null });
  });
});

// ---- commit (the only place that writes) ----
assistant.post("/commit", async (c) => {
  const proposal = proposalSchema.parse(await c.req.json());

  return withClient(c.env, async (client) => {
    const userId = c.get("userId");
    const profile = await loadProfile(client, userId);
    if (denied(profile)) return c.json({ error: "The assistant is available to family admins" }, 403);
    const fam = profile.family_id;

    try {
      await client.query("BEGIN");

      // 1. resolve refs -> UUIDs
      const refToId = new Map();
      const newGen = new Map(); // id -> generation
      for (const op of proposal.operations) {
        if (op.op === "add_member") refToId.set(op.ref, crypto.randomUUID());
      }
      const resolve = (x) => refToId.get(x) ?? x;

      // 2. every existing id must belong to this family
      const existingIds = new Set();
      for (const op of proposal.operations) {
        if (op.op === "update_member") existingIds.add(op.id);
        if (op.op === "add_relationship") for (const x of [op.from, op.to]) if (!refToId.has(x)) existingIds.add(x);
      }
      const gens = new Map();
      if (existingIds.size) {
        const r = await client.query(
          `SELECT id, generation FROM members WHERE family_id = $1 AND id = ANY($2::uuid[])`,
          [fam, [...existingIds]]
        );
        if (r.rowCount !== existingIds.size) throw new Error("A referenced person does not exist in your family");
        r.rows.forEach((m) => gens.set(m.id, m.generation));
      }

      // 3. relationship sanity: no self-links, no parent cycles
      const rels = proposal.operations.filter((o) => o.op === "add_relationship");
      for (const r of rels) {
        const f = resolve(r.from), t = resolve(r.to);
        if (f === t) throw new Error("A person cannot be related to themselves");
        if (r.type === "parent" && !refToId.has(r.from) && !refToId.has(r.to)) {
          // would making `f` a parent of `t` create a loop? i.e. is `f` already a descendant of `t`?
          const loop = await client.query(
            `WITH RECURSIVE d AS (
               SELECT to_member_id AS id FROM relationships WHERE relationship_type='parent' AND from_member_id = $1
               UNION
               SELECT r.to_member_id FROM relationships r JOIN d ON r.from_member_id = d.id WHERE r.relationship_type='parent')
             SELECT 1 FROM d WHERE id = $2 LIMIT 1`,
            [t, f]
          );
          if (loop.rowCount) throw new Error("That parent link would make someone their own ancestor");
        }
      }

      // 4. derive generation for new members from their relationships (parent gen+1, spouse same)
      for (const op of proposal.operations) {
        if (op.op !== "add_member") continue;
        const id = refToId.get(op.ref);
        let g = op.data.generation ?? null;
        for (const r of rels) {
          const f = resolve(r.from), t = resolve(r.to);
          if (r.type === "parent" && t === id && gens.has(f)) g = gens.get(f) + 1;
          if (r.type === "parent" && f === id && gens.has(t)) g = gens.get(t) - 1;
          if (r.type === "spouse" && gens.has(f === id ? t : f) && (f === id || t === id)) g = gens.get(f === id ? t : f);
        }
        if (g == null) throw new Error(`Can't work out the generation for ${op.data.first_name}; connect them to someone or say which generation`);
        newGen.set(id, g);
        gens.set(id, g);
      }

      // 5. apply
      for (const op of proposal.operations) {
        if (op.op === "add_member") {
          const d = op.data, id = refToId.get(op.ref);
          if (d.date_of_birth && d.date_of_passing && d.date_of_passing < d.date_of_birth)
            throw new Error(`${d.first_name}: passing date is before birth date`);
          await client.query(
            `INSERT INTO members (id, family_id, first_name, last_name, maiden_name, gender, generation, is_living,
               date_of_birth, date_of_passing, birth_place, resting_place, occupation, bio, location)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
            [id, fam, d.first_name, d.last_name, d.maiden_name ?? null, d.gender ?? null, newGen.get(id),
             d.is_living && !d.date_of_passing, d.date_of_birth ?? null, d.date_of_passing ?? null,
             d.birth_place ?? null, d.resting_place ?? null, d.occupation ?? null, d.bio ?? null, d.location ?? null]
          );
          await audit(client, fam, userId, "assistant_add_member", id, { name: `${d.first_name} ${d.last_name}` });
        } else if (op.op === "update_member") {
          const entries = Object.entries(op.data).filter(([, v]) => v !== undefined);
          if (!entries.length) continue;
          // column names come from the zod schema keys, never from raw model text
          const sets = entries.map(([k], i) => `${k} = $${i + 3}`).join(", ");
          const before = await client.query(`SELECT * FROM members WHERE id=$1 AND family_id=$2`, [op.id, fam]);
          await client.query(
            `UPDATE members SET ${sets}, updated_at = now() WHERE id = $1 AND family_id = $2`,
            [op.id, fam, ...entries.map(([, v]) => v)]
          );
          const prev = Object.fromEntries(entries.map(([k]) => [k, before.rows[0]?.[k] ?? null]));
          await audit(client, fam, userId, "assistant_update_member", op.id, { before: prev, after: op.data });
        } else {
          const f = resolve(op.from), t = resolve(op.to);
          const pairs = op.type === "spouse" ? [[f, t], [t, f]] : [[f, t]]; // spouse is stored both ways on your site
          for (const [a, b] of pairs) {
            await client.query(
              `INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, started_at)
               VALUES (gen_random_uuid(), $1,$2,$3,$4,$5)
               ON CONFLICT (from_member_id, to_member_id, relationship_type)
               DO UPDATE SET started_at = COALESCE(EXCLUDED.started_at, relationships.started_at)`,
              [fam, a, b, op.type, op.started_at ?? null]
            );
          }
          await audit(client, fam, userId, "assistant_add_relationship", null, { from: f, to: t, type: op.type });
        }
      }

      await client.query("COMMIT");
      return c.json({ ok: true, created: Object.fromEntries(refToId) });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      return c.json({ error: e.message || "Could not save" }, 400);
    }
  });
});

async function audit(client, familyId, actorId, action, entityId, details) {
  await client.query(
    `INSERT INTO audit_log (family_id, actor_id, action, entity_type, entity_id, details)
     VALUES ($1,$2,$3,'member',$4,$5)`,
    [familyId, actorId, action, entityId, JSON.stringify(details)]
  );
}

export default assistant;

// In src/index.js, next to the other routes. Rate limit BEFORE the route (LLM calls cost money):
//   import assistant from "./routes/assistant.js";
//   app.use("/api/assistant/*", rateLimit("ASSISTANT_RATE_LIMITER"));  // new binding, e.g. 10 req / 60s
//   app.route("/api/assistant", assistant);
// wrangler.toml: add an [[unsafe.bindings]] / ratelimit binding named ASSISTANT_RATE_LIMITER,
// then: wrangler secret put ANTHROPIC_API_KEY
