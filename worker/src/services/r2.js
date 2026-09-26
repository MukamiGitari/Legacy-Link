import { AwsClient } from 'aws4fetch';

const ALLOWED_CATEGORIES = ['photos', 'documents', 'videos', 'recipe-images'];
const UPLOAD_EXPIRES_SECONDS = 60 * 5;
const DOWNLOAD_EXPIRES_SECONDS = 60 * 10;

function client(env) {
  return new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}

export function buildKey(category, originalFilename) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error('Invalid media category');
  }
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  return `${category}/${crypto.randomUUID()}-${safeName}`;
}

/**
 * Convert a stored R2 key (e.g. "photos/uuid-file.jpg") into a full public URL.
 * Already-absolute URLs are returned unchanged so existing data is never broken.
 */
export function toPublicUrl(env, keyOrUrl) {
  if (!keyOrUrl) return keyOrUrl;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) return keyOrUrl;
  return `${env.R2_PUBLIC_URL}/${keyOrUrl}`;
}

// Presigning happens server-side via the S3-compatible API, using the
// scoped R2 API token — the browser only ever sees the resulting URL,
// never the credentials. Called after auth + ownership checks upstream.
export async function getUploadUrl(env, key, contentType) {
  const url = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}?X-Amz-Expires=${UPLOAD_EXPIRES_SECONDS}`;
  const signed = await client(env).sign(
    new Request(url, { method: 'PUT', headers: { 'Content-Type': contentType } }),
    { aws: { signQuery: true } }
  );
  return signed.url.toString();
}

// The public, browser-viewable URL for an object — separate from R2_ENDPOINT,
// which is the private S3-compatible endpoint used only for signing requests.
// Requires either the bucket's r2.dev public URL to be enabled, or a custom
// domain bound to it, with R2_PUBLIC_URL set to that base (no trailing slash).
export function getPublicUrl(env, key) {
  if (!env.R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is not configured on the Worker — set it to the bucket\'s public base URL.');
  }
  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function getDownloadUrl(env, key) {
  const url = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}?X-Amz-Expires=${DOWNLOAD_EXPIRES_SECONDS}`;
  const signed = await client(env).sign(new Request(url), { aws: { signQuery: true } });
  return signed.url.toString();
}

export async function deleteObject(env, key) {
  // Delete via the native binding rather than a signed fetch — simpler
  // and doesn't need an expiring URL for a same-request server action.
  await env.MEDIA_BUCKET.delete(key);
}
