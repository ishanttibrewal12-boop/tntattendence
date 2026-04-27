-- File Manager: storage bucket + metadata table
-- Note: This app uses custom role-based auth (not Supabase auth), so RLS allows anon access
-- consistent with the rest of the project's security model.

-- 1) Create the files storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Storage RLS — permissive for anon (app handles access control)
CREATE POLICY "Anyone can read files bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'files');

CREATE POLICY "Anyone can upload to files bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can update files bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'files');

CREATE POLICY "Anyone can delete from files bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'files');

-- 3) file_metadata table — folders + file records
CREATE TABLE public.file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
  parent_id UUID REFERENCES public.file_metadata(id) ON DELETE CASCADE,
  storage_path TEXT,           -- only for files: path inside the 'files' bucket
  mime_type TEXT,              -- only for files
  size_bytes BIGINT DEFAULT 0, -- only for files
  uploaded_by TEXT,            -- app username (custom auth)
  uploaded_by_role TEXT,       -- app role
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_metadata_parent ON public.file_metadata(parent_id);
CREATE INDEX idx_file_metadata_type ON public.file_metadata(type);
CREATE INDEX idx_file_metadata_name_search ON public.file_metadata USING gin (to_tsvector('simple', name));

ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read file metadata"
ON public.file_metadata FOR SELECT USING (true);

CREATE POLICY "Anyone can insert file metadata"
ON public.file_metadata FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update file metadata"
ON public.file_metadata FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete file metadata"
ON public.file_metadata FOR DELETE USING (true);

-- 4) updated_at trigger
CREATE TRIGGER update_file_metadata_updated_at
BEFORE UPDATE ON public.file_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();