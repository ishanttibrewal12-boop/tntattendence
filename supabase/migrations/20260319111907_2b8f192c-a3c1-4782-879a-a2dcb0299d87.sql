-- Allow anon users to manage app_users (custom auth, not Supabase Auth)
CREATE POLICY "Allow anon manage users"
ON public.app_users
FOR ALL
TO anon
USING (true)
WITH CHECK (true);