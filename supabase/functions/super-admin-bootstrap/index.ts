// supabase/functions/super-admin-bootstrap/index.ts
//
// Deno Edge Function -- one-shot bootstrap for creating the first super_admin.
//
// There is no UI for this endpoint -- it is called manually by the developer
// once, immediately after the initial Supabase project setup:
//
//   curl -X POST \
//     https://<project-ref>.supabase.co/functions/v1/super-admin-bootstrap \
//     -H "Content-Type: application/json" \
//     -H "Authorization: Bearer <BOOTSTRAP_SECRET>" \
//     -d "{\"userId\":\"<auth-user-uuid>\",\"familyId\":\"<family-uuid>\",\"displayName\":\"Admin\",\"email\":\"admin@example.com\"}"
//
// Prerequisites:
//   1. Run supabase/006_super_admin_bootstrap.sql in the SQL editor.
//   2. Create an auth user in Supabase Dashboard -> Authentication -> Users
//      (or sign up normally and grab their UUID from the dashboard).
//   3. Create a family row first if none exists (or use an existing family_id).
//   4. Deploy: `supabase functions deploy super-admin-bootstrap`
//   5. Set secrets in Dashboard -> Settings -> Edge Functions:
//        SUPABASE_SERVICE_ROLE_KEY  (your project service role key)
//        BOOTSTRAP_SECRET           (any strong random string you choose)
//
// After the bootstrap call succeeds, the user can sign in normally.
// Remove BOOTSTRAP_SECRET from the Edge Function secrets afterwards.
//
// Environment variables:
//   SUPABASE_URL              -- automatically injected
//   SUPABASE_SERVICE_ROLE_KEY -- set manually
//   BOOTSTRAP_SECRET          -- set manually

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
  }

  // --------------------------------------------------------------------------
  // Authenticate the request with the bootstrap secret
  // --------------------------------------------------------------------------
  const bootstrapSecret = Deno.env.get('BOOTSTRAP_SECRET');
  if (!bootstrapSecret) {
    console.error('[super-admin-bootstrap] BOOTSTRAP_SECRET is not set');
    return jsonResponse(
      { ok: false, error: 'Server misconfiguration: bootstrap secret not configured.' },
      500,
    );
  }

  const authHeader    = req.headers.get('authorization') ?? '';
  const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!providedToken || providedToken !== bootstrapSecret) {
    return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  }

  // --------------------------------------------------------------------------
  // Parse and validate input
  // --------------------------------------------------------------------------
  let body: { userId?: string; familyId?: string; displayName?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const { userId, familyId, displayName, email } = body;
  if (!userId || !familyId || !displayName) {
    return jsonResponse(
      { ok: false, error: 'userId, familyId, and displayName are required.' },
      400,
    );
  }

  // Basic UUID format check
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(userId) || !uuidRe.test(familyId)) {
    return jsonResponse(
      { ok: false, error: 'userId and familyId must be valid UUIDs.' },
      400,
    );
  }

  // --------------------------------------------------------------------------
  // Create service-role client
  // --------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('[super-admin-bootstrap] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --------------------------------------------------------------------------
  // Verify the auth user exists
  // --------------------------------------------------------------------------
  const { data: userCheck, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userCheck?.user) {
    return jsonResponse(
      {
        ok: false,
        error: `No auth user found with id ${userId}. Create the user in Supabase Auth first.`,
      },
      400,
    );
  }

  // --------------------------------------------------------------------------
  // Call create_super_admin() stored procedure (SECURITY DEFINER, bypasses RLS)
  // --------------------------------------------------------------------------
  const { error: rpcErr } = await admin.rpc('create_super_admin', {
    p_user_id:      userId,
    p_family_id:    familyId,
    p_display_name: displayName,
    p_email:        email ?? null,
  });

  if (rpcErr) {
    console.error('[super-admin-bootstrap] create_super_admin RPC error:', rpcErr);
    return jsonResponse(
      { ok: false, error: rpcErr.message ?? 'Failed to create super_admin profile.' },
      500,
    );
  }

  console.info(
    `[super-admin-bootstrap] super_admin created/upgraded: userId=${userId} familyId=${familyId} name="${displayName}"`,
  );

  return jsonResponse({ ok: true, profileId: userId });
});
