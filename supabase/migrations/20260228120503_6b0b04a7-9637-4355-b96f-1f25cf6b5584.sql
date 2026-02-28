
-- Create backup_logs table
CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Public read access (app uses custom auth, not Supabase Auth)
CREATE POLICY "Public read access" ON public.backup_logs
  FOR SELECT USING (true);

-- Service role can insert (edge function uses service role key)
CREATE POLICY "Service role insert" ON public.backup_logs
  FOR INSERT WITH CHECK (true);

-- Service role can delete old logs
CREATE POLICY "Service role delete" ON public.backup_logs
  FOR DELETE USING (true);

-- Create daily_backups storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('daily_backups', 'daily_backups', false);

-- Allow public read on storage objects in daily_backups bucket (for download)
CREATE POLICY "Allow read daily_backups" ON storage.objects
  FOR SELECT USING (bucket_id = 'daily_backups');

-- Allow insert for service role (edge function)
CREATE POLICY "Allow insert daily_backups" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'daily_backups');

-- Allow delete for cleanup
CREATE POLICY "Allow delete daily_backups" ON storage.objects
  FOR DELETE USING (bucket_id = 'daily_backups');
