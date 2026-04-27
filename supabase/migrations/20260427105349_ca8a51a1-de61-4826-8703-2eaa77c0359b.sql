-- Version history for files
CREATE TABLE public.file_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.file_metadata(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  saved_by TEXT,
  saved_by_role TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_versions_file_id ON public.file_versions(file_id, version_number DESC);

ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read file versions"
  ON public.file_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert file versions"
  ON public.file_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete file versions"
  ON public.file_versions FOR DELETE USING (true);