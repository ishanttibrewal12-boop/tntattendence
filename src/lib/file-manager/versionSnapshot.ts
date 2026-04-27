/**
 * Snapshot a file's current contents as a new entry in file_versions.
 * Called BEFORE the editor overwrites the file in storage.
 * Silently no-ops on failure so the user's save is never blocked.
 */
import { supabase } from '@/integrations/supabase/client';

const MAX_VERSIONS_PER_FILE = 20;

export async function snapshotCurrentVersion(currentPath: string, fileName: string) {
  try {
    // Find file_metadata row
    const { data: meta } = await supabase
      .from('file_metadata')
      .select('id, mime_type, uploaded_by')
      .eq('storage_path', currentPath)
      .maybeSingle();
    if (!meta) return;

    // Download current contents
    const { data: blob, error: dErr } = await supabase.storage.from('files').download(currentPath);
    if (dErr || !blob) return;

    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const versionPath = `versions/${meta.id}/v_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('files').upload(versionPath, blob, {
      upsert: false, contentType: blob.type || meta.mime_type || undefined,
    });
    if (upErr) return;

    // Get next version number
    const { data: latest } = await supabase
      .from('file_versions')
      .select('version_number')
      .eq('file_id', meta.id)
      .order('version_number', { ascending: false })
      .limit(1);
    const nextNum = (latest?.[0]?.version_number || 0) + 1;

    await supabase.from('file_versions').insert({
      file_id: meta.id,
      version_number: nextNum,
      storage_path: versionPath,
      size_bytes: blob.size,
      mime_type: blob.type || meta.mime_type || null,
      saved_by: meta.uploaded_by || null,
      note: null,
    });

    // Prune oldest versions beyond limit
    const { data: all } = await supabase
      .from('file_versions')
      .select('id, storage_path, version_number')
      .eq('file_id', meta.id)
      .order('version_number', { ascending: false });
    if (all && all.length > MAX_VERSIONS_PER_FILE) {
      const toRemove = all.slice(MAX_VERSIONS_PER_FILE);
      const paths = toRemove.map((v) => v.storage_path).filter(Boolean);
      const ids = toRemove.map((v) => v.id);
      if (paths.length) await supabase.storage.from('files').remove(paths);
      if (ids.length) await supabase.from('file_versions').delete().in('id', ids);
    }
  } catch (err) {
    console.warn('[version snapshot] skipped:', err);
  }
}
