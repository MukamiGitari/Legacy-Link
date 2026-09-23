import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

function secretKey(env) {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

export async function signAccessToken(env, user) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secretKey(env));
}

export async function verifyAccessToken(env, token) {
  const { payload } = await jwtVerify(token, secretKey(env));
  return payload; // { sub, role, iat, exp }
}

// Refresh tokens are opaque random strings (not JWTs); we store only a
// SHA-256 hash in Postgres, generated via the Workers-native Web Crypto
// API rather than Node's `crypto` module.
export async function generateRefreshToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  const token = toHex(bytes);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export async function hashToken(token) {
  return sha256Hex(token);
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
