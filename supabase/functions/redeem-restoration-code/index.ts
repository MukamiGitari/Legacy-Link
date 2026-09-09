// supabase/functions/redeem-restoration-code/index.ts
//
// Deno Edge Function — called by db.redeemRestorationCodeViaEdgeFunction()
// in src/lib/db.ts whenever the client is in online (Supabase) mode.
//
// Flow:
//   1. Parse { email, code, newPassword } from the request body.
//   2. Look up the profile by email using the SERVICE ROLE key (bypasses RLS).
//   3. Find an unredeemed restoration_codes row that matches profile_id + code.
//   4. Reject codes older than 48 hours.
//   5. Update the password via auth.admin.updateUserById().
//   6. Mark the code as redeemed.
//   7. Return { ok: true } or { ok: false, error: "..." }.
//
// Environment variables (set in Supabase Dashboard -> Settings -> Edge Functions):
//   SUPABASE_URL              -- automatically injected by the runtime
//   SUPABASE_SERVICE_ROLE_KEY -- must be set manually; never expose to clients

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CODE_MAX_AGE_HOURS = 48;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Generic error -- same text for "no account" and "bad/used code" to prevent
// email enumeration attacks.
const GENERIC_INVALID =
  'That restoration code is invalid, expired, or already used. Ask your family admin for a new one.';

Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
  }

  // --------------------------------------------------------------------------
  // Parse and validate input
  // --------------------------------------------------------------------------
  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const email       = body.email?.trim().toLowerCase();
  const code        = body.code?.trim().toUpperCase();
  const newPassword = body.newPassword;

  if (!email || !code || !newPassword) {
    return jsonResponse(
      { ok: false, error: 'email, code, and newPassword are required.' },
      400,
    );
  }
  if (newPassword.length < 6) {
    return jsonResponse(
      { ok: false, error: 'New password must be at least 6 characters.' },
      400,
    );
  }

  // --------------------------------------------------------------------------
  // Create a service-role client that bypasses all RLS
  // --------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('[redeem-restoration-code] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --------------------------------------------------------------------------
  // 1. Find the profile by email
  // --------------------------------------------------------------------------
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, family_id, display_name')
    .eq('email', email)
    .maybeSingle();

  if (profileErr) {
    console.error('[redeem-restoration-code] profile lookup error:', profileErr);
    return jsonResponse({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
  }
  if (!profile) {
    // Return the same generic message to prevent email enumeration
    return jsonResponse({ ok: false, error: GENERIC_INVALID }, 400);
  }

  // --------------------------------------------------------------------------
  // 2. Find a matching unredeemed restoration code
  // --------------------------------------------------------------------------
  const { data: restorationRow, error: codeErr } = await admin
    .from('restoration_codes')
    .select('id, created_at')
    .eq('profile_id', profile.id)
    .eq('code', code)
    .is('redeemed_at', null)
    .maybeSingle();

  if (codeErr) {
    console.error('[redeem-restoration-code] code lookup error:', codeErr);
    return jsonResponse({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
  }
  if (!restorationRow) {
    return jsonResponse({ ok: false, error: GENERIC_INVALID }, 400);
  }

  // --------------------------------------------------------------------------
  // 3. Check code age (max 48 hours)
  // --------------------------------------------------------------------------
  const codeAgeMs    = Date.now() - new Date(restorationRow.created_at).getTime();
  const codeAgeHours = codeAgeMs / (1000 * 60 * 60);
  if (codeAgeHours > CODE_MAX_AGE_HOURS) {
    return jsonResponse({ ok: false, error: GENERIC_INVALID }, 400);
  }

  // --------------------------------------------------------------------------
  // 4. Update the password via the Auth Admin API
  // --------------------------------------------------------------------------
  const { error: updateErr } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateErr) {
    console.error('[redeem-restoration-code] password update error:', updateErr);
    return jsonResponse(
      {
        ok: false,
        error: updateErr.message ?? 'Could not update your password. Please try again.',
      },
      400,
    );
  }

  // --------------------------------------------------------------------------
  // 5. Mark the code as redeemed
  // --------------------------------------------------------------------------
  const { error: redeemErr } = await admin
    .from('restoration_codes')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', restorationRow.id);

  if (redeemErr) {
    // Password was already changed -- log and continue rather than fail
    console.warn('[redeem-restoration-code] failed to mark code redeemed:', redeemErr);
  }

  console.info(
    `[redeem-restoration-code] password reset for profile ${profile.id} (${profile.display_name})`,
  );

  return jsonResponse({ ok: true });
});
