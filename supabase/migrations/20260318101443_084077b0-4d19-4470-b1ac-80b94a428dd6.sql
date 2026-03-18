CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE(table_name text, total_size text, size_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.relname::text AS table_name,
    pg_size_pretty(pg_total_relation_size(c.oid))::text AS total_size,
    pg_total_relation_size(c.oid)::bigint AS size_bytes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS TABLE(bucket_id text, file_count bigint, total_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    o.bucket_id::text,
    count(*)::bigint AS file_count,
    coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes
  FROM storage.objects o
  GROUP BY o.bucket_id;
$$;

CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS TABLE(size_pretty text, size_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pg_size_pretty(pg_database_size(current_database()))::text AS size_pretty,
    pg_database_size(current_database())::bigint AS size_bytes;
$$;