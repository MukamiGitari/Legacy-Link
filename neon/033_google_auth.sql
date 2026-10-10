-- Google sign-in: accounts created through Google have no password, and are linked by Google's stable user id.

ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_sub text;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_key
  ON public.users (google_sub)
  WHERE google_sub IS NOT NULL;
