// A deliberately simple local-mode credential store. This is NOT secure
// (password is just base64-encoded) and is only meant to let the standalone
// / localStorage build demonstrate a real sign-in flow without a backend.
// Once Supabase is configured, real Supabase Auth is used instead (see AppContext).

const CRED_KEY = 'legacy-link-credentials-v1';

interface StoredCredential {
  email: string;
  passwordHash: string;
  profileId: string;
}

function encode(password: string): string {
  try {
    return btoa(unescape(encodeURIComponent(password)));
  } catch {
    return password;
  }
}

function loadCredentials(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential[]) : [];
  } catch {
    return [];
  }
}

function saveCredentials(list: StoredCredential[]) {
  try {
    localStorage.setItem(CRED_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function registerCredential(email: string, password: string, profileId: string) {
  const list = loadCredentials().filter(c => c.email.toLowerCase() !== email.toLowerCase());
  list.push({ email: email.toLowerCase(), passwordHash: encode(password), profileId });
  saveCredentials(list);
}

export function hasCredential(email: string): boolean {
  return loadCredentials().some(c => c.email.toLowerCase() === email.toLowerCase());
}

/** Returns the matching profileId if the email/password pair is valid, else null. */
export function verifyCredential(email: string, password: string): string | null {
  const match = loadCredentials().find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!match) return null;
  return match.passwordHash === encode(password) ? match.profileId : null;
}

/**
 * Sets a brand-new password for an email that already has stored credentials,
 * without needing the old one — used after a restoration code has been verified
 * (see AppContext.redeemRestorationCode). Returns false if no account exists yet
 * for that email, in which case the caller should fall back to registerCredential.
 */
export function resetCredentialPassword(email: string, newPassword: string): boolean {
  const list = loadCredentials();
  const idx = list.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  list[idx] = { ...list[idx], passwordHash: encode(newPassword) };
  saveCredentials(list);
  return true;
}
