// Verifies a Google Sign-In ID token (the "credential" Google Identity Services hands the browser)
// using only Web Crypto, so it runs in a Worker without extra dependencies.

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const CLOCK_SKEW_SECONDS = 60;

let jwksCache = { keys: null, fetchedAt: 0 };

function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson(part) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
}

async function getGoogleKeys(forceRefresh = false) {
  const fresh = jwksCache.keys && Date.now() - jwksCache.fetchedAt < 60 * 60 * 1000;
  if (fresh && !forceRefresh) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error('Could not load Google signing keys');
  const { keys } = await res.json();
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * @returns {Promise<{ sub: string, email: string, name: string, picture?: string }>}
 * @throws Error with a user-safe message when the token is not acceptable.
 */
export async function verifyGoogleIdToken(env, idToken) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not set up on this server yet.');

  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid Google sign-in token.');
  const [h, p, s] = parts;

  let header, payload;
  try {
    header = decodeJson(h);
    payload = decodeJson(p);
  } catch {
    throw new Error('Invalid Google sign-in token.');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid Google sign-in token.');

  let keys = await getGoogleKeys();
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getGoogleKeys(true); // Google rotates keys; retry once with a fresh set
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error('Invalid Google sign-in token.');

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)
  );
  if (!valid) throw new Error('Invalid Google sign-in token.');

  const now = Math.floor(Date.now() / 1000);
  if (!ISSUERS.includes(payload.iss)) throw new Error('Invalid Google sign-in token.');
  if (payload.aud !== clientId) throw new Error('This Google sign-in was issued for a different app.');
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < now) {
    throw new Error('That Google sign-in expired. Please try again.');
  }
  if (!payload.sub || !payload.email) throw new Error('Google did not share an email address.');
  if (payload.email_verified !== true) throw new Error('Your Google email address is not verified.');

  return {
    sub: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: String(payload.name || payload.given_name || payload.email.split('@')[0]).slice(0, 100),
    picture: payload.picture,
  };
}
