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
