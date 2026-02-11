-- Allow anon users to read app_users for login authentication
CREATE POLICY "Allow anon login read"
ON public.app_users
FOR SELECT
TO anon
USING (true);
