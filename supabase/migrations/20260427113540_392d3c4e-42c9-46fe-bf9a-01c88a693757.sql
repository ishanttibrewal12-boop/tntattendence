ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS previous_login_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_app_users_last_login_at
  ON public.app_users (last_login_at DESC);