import { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import {
  Folder, FolderPlus, Upload, Download, Trash2, Search, MoreVertical,
  ChevronRight, Star, Share2, Pencil, FileText, FileSpreadsheet,
  FileImage, File as FileIcon, Home as HomeIcon, Archive, Loader2, Edit3,
  History, ListChecks, X, MoveRight, CheckSquare, Square, ArchiveRestore,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAppAuth } from '@/contexts/AppAuthContext';
import JSZip from 'jszip';
import { downloadQueue } from '@/lib/file-manager/downloadQueue';
import BuildStatusIndicator from '@/components/file-manager/BuildStatusIndicator';

const DocxEditor = lazy(() => import('@/components/file-editors/DocxEditor'));
const XlsxEditor = lazy(() => import('@/components/file-editors/XlsxEditor'));
const VersionHistoryDialog = lazy(() => import('@/components/file-editors/VersionHistoryDialog'));
const OfflineQueuePanel = lazy(() => import('@/components/file-editors/OfflineQueuePanel'));

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parent_id: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

interface BreadcrumbItem { id: string | null; name: string; }
interface FileManagerSectionProps { onBack: () => void; }

type ConflictAction = 'skip' | 'replace' | 'keep';
interface ConflictItem { id: string; name: string; type: 'folder' | 'file'; existingId: string; }
interface MoveConflictsState { targetFolderId: string | null; conflicts: ConflictItem[]; }

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const isDocx = (item: FileNode) => item.name.toLowerCase().endsWith('.docx');
const isXlsx = (item: FileNode) => {
  const n = item.name.toLowerCase();
  return n.endsWith('.xlsx') || n.endsWith('.xls');
};
const isEditable = (item: FileNode) => isDocx(item) || isXlsx(item);

const getFileIcon = (mime: string | null, name: string) => {
  if (!mime) {
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return FileSpreadsheet;
    if (name.endsWith('.docx') || name.endsWith('.doc')) return FileText;
    return FileIcon;
  }
  if (mime.startsWith('image/')) return FileImage;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return FileSpreadsheet;
  if (mime.includes('word') || mime.includes('document') || mime === 'application/pdf') return FileText;
  return FileIcon;
};

const getFileColor = (mime: string | null, name: string): string => {
  const lower = name.toLowerCase();
  if (mime?.startsWith('image/')) return 'text-purple-500';
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'text-green-600';
  if (mime?.includes('word') || lower.endsWith('.docx') || lower.endsWith('.doc')) return 'text-blue-600';
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) return 'text-red-600';
  return 'text-muted-foreground';
};

const FileManagerSection = ({ onBack }: FileManagerSectionProps) => {
  const { user } = useAppAuth();
  const [items, setItems] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'My Files' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileNode | null>(null);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ name: string; links: { name: string; url: string }[] } | null>(null);
  const [docxEditor, setDocxEditor] = useState<FileNode | null>(null);
  const [xlsxEditor, setXlsxEditor] = useState<FileNode | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FileNode | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveConflicts, setMoveConflicts] = useState<MoveConflictsState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to queue for badge
  useEffect(() => {
    const unsub = downloadQueue.subscribe((jobs) => {
      const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running' || j.status === 'failed').length;
      setQueueCount(active);
    });
    return () => { unsub(); };
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('file_metadata').select('*').order('type', { ascending: true }).order('name', { ascending: true });
    if (currentFolder === null) query = query.is('parent_id', null);
    else query = query.eq('parent_id', currentFolder);
    const { data, error } = await query;
    if (error) { toast.error('Failed to load files'); console.error(error); }
    else setItems((data || []) as FileNode[]);
    setIsLoading(false);
  }, [currentFolder]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Clear selection when navigating
  useEffect(() => { setSelectedIds(new Set()); }, [currentFolder]);

  const navigateToFolder = (folder: FileNode) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolder(folder.id);
  };

  const navigateToBreadcrumb = (index: number) => {
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    setCurrentFolder(newCrumbs[newCrumbs.length - 1].id);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) { toast.error('Enter a folder name'); return; }
    const { error } = await supabase.from('file_metadata').insert({
      name, type: 'folder', parent_id: currentFolder,
      uploaded_by: user?.username || null, uploaded_by_role: user?.role || null,
    });
    if (error) { toast.error('Failed to create folder'); return; }
    toast.success(`Folder "${name}" created`);
    setNewFolderOpen(false);
    setNewFolderName('');
    fetchItems();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0, failed = 0;
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from('files').upload(storagePath, file, {
          cacheControl: '3600', upsert: false, contentType: file.type || undefined,
        });
        if (uploadError) throw uploadError;
        const { error: metaError } = await supabase.from('file_metadata').insert({
          name: file.name, type: 'file', parent_id: currentFolder, storage_path: storagePath,
          mime_type: file.type || `application/${ext || 'octet-stream'}`,
          size_bytes: file.size,
          uploaded_by: user?.username || null,
          uploaded_by_role: user?.role || null,
        });
        if (metaError) throw metaError;
        success++;
      } catch (err) {
        console.error('Upload error', err);
        failed++;
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (success > 0) toast.success(`${success} file${success > 1 ? 's' : ''} uploaded`);
    if (failed > 0) toast.error(`${failed} file${failed > 1 ? 's' : ''} failed`);
    fetchItems();
  };

  // Direct download (small + immediate); large/multi uses queue
  const handleQuickDownload = async (item: FileNode) => {
    if (!item.storage_path) return;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(item.storage_path, 60);
    if (error || !data) { toast.error('Failed to download'); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = item.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleOpen = (item: FileNode) => {
    if (item.type === 'folder') return navigateToFolder(item);
    if (isDocx(item)) return setDocxEditor(item);
    if (isXlsx(item)) return setXlsxEditor(item);
    return handleQuickDownload(item);
  };

  const handleShareFile = (item: FileNode) => {
    if (!item.storage_path) return;
    downloadQueue.enqueue({
      type: 'share-link',
      label: `Share link · ${item.name}`,
      payload: { storage_path: item.storage_path, name: item.name },
    });
    toast.success('Share link queued', { description: 'Will appear in clipboard & Export Queue' });
  };

  const handleShareFolder = (folder: FileNode) => {
    downloadQueue.enqueue({
      type: 'share-folder',
      label: `Share folder · ${folder.name}`,
      payload: { folder_id: folder.id, folder_name: folder.name },
    });
    toast.success(`Generating share links for "${folder.name}"…`, {
      description: 'View progress in Export Queue',
    });
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) { toast.error('Enter a name'); return; }
    const { error } = await supabase.from('file_metadata').update({ name }).eq('id', renameTarget.id);
    if (error) { toast.error('Failed to rename'); return; }
    toast.success('Renamed');
    setRenameTarget(null);
    setRenameValue('');
    fetchItems();
  };

  const handleStar = async (item: FileNode) => {
    const { error } = await supabase.from('file_metadata').update({ is_starred: !item.is_starred }).eq('id', item.id);
    if (error) { toast.error('Failed'); return; }
    fetchItems();
  };

  const collectStoragePaths = async (rootId: string): Promise<string[]> => {
    const paths: string[] = [];
    const visit = async (id: string) => {
      const { data } = await supabase.from('file_metadata').select('id,type,storage_path').eq('parent_id', id);
      for (const child of data || []) {
        if (child.type === 'file' && child.storage_path) paths.push(child.storage_path);
        else if (child.type === 'folder') await visit(child.id);
      }
    };
    await visit(rootId);
    return paths;
  };

  // Also collect & remove version snapshots when deleting a file
  const removeVersionsForFile = async (fileId: string) => {
    const { data: vers } = await supabase.from('file_versions').select('storage_path').eq('file_id', fileId);
    const paths = (vers || []).map((v: any) => v.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from('files').remove(paths);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'file' && deleteTarget.storage_path) {
        await supabase.storage.from('files').remove([deleteTarget.storage_path]);
        await removeVersionsForFile(deleteTarget.id);
      } else if (deleteTarget.type === 'folder') {
        const childPaths = await collectStoragePaths(deleteTarget.id);
        if (childPaths.length > 0) await supabase.storage.from('files').remove(childPaths);
      }
      const { error } = await supabase.from('file_metadata').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success(`${deleteTarget.type === 'folder' ? 'Folder' : 'File'} deleted`);
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  // ===== ZIP backup (queued for resilience) =====
  const handleBackupZip = () => {
    downloadQueue.enqueue({
      type: 'backup-zip',
      label: `Full Backup ZIP · ${format(new Date(), 'dd MMM HH:mm')}`,
      payload: {},
    });
    toast.success('Backup queued', { description: 'View progress in Export Queue' });
  };

  // ===== Restore from Backup ZIP =====
  const handleRestoreClick = () => restoreInputRef.current?.click();

  const handleRestoreZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (restoreInputRef.current) restoreInputRef.current.value = '';
    setRestoring(true);
    const tid = toast.loading('Reading backup ZIP…');
    try {
      const zip = await JSZip.loadAsync(file);
      // Folder map: relative path -> created file_metadata id
      const folderIds = new Map<string, string>();
      const ensureFolder = async (relPath: string): Promise<string | null> => {
        if (!relPath) return currentFolder;
        if (folderIds.has(relPath)) return folderIds.get(relPath)!;
        const segments = relPath.split('/').filter(Boolean);
        let parentId: string | null = currentFolder;
        let acc = '';
        for (const seg of segments) {
          acc = acc ? `${acc}/${seg}` : seg;
          if (folderIds.has(acc)) { parentId = folderIds.get(acc)!; continue; }
          // Reuse existing folder with same name under parent
          let q = supabase.from('file_metadata').select('id').eq('type', 'folder').eq('name', seg);
          q = parentId === null ? q.is('parent_id', null) : q.eq('parent_id', parentId);
          const { data: existing } = await q.maybeSingle();
          let id = existing?.id;
          if (!id) {
            const { data: created, error } = await supabase.from('file_metadata').insert({
              name: seg, type: 'folder', parent_id: parentId,
              uploaded_by: user?.username || null, uploaded_by_role: user?.role || null,
            }).select('id').single();
            if (error || !created) throw error || new Error('Folder create failed');
            id = created.id;
          }
          folderIds.set(acc, id!);
          parentId = id!;
        }
        return parentId;
      };

      // Find all files within the "files/" prefix; fall back to top-level if no prefix
      const fileEntries = Object.values(zip.files).filter((f) => !f.dir);
      const targets = fileEntries.filter((f) => !f.name.endsWith('metadata.json') && !f.name.endsWith('README.txt'));
      let done = 0, failed = 0;
      for (const entry of targets) {
        try {
          let rel = entry.name;
          if (rel.startsWith('files/')) rel = rel.slice('files/'.length);
          const lastSlash = rel.lastIndexOf('/');
          const folderPath = lastSlash >= 0 ? rel.slice(0, lastSlash) : '';
          const fileName = lastSlash >= 0 ? rel.slice(lastSlash + 1) : rel;
          if (!fileName) continue;
          const parent = await ensureFolder(folderPath);
          const blob = await entry.async('blob');
          const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `restored/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;
          const mime = blob.type || `application/${ext || 'octet-stream'}`;
          const { error: upErr } = await supabase.storage.from('files').upload(storagePath, blob, {
            upsert: false, contentType: mime,
          });
          if (upErr) throw upErr;
          const { error: metaErr } = await supabase.from('file_metadata').insert({
            name: fileName, type: 'file', parent_id: parent,
            storage_path: storagePath, mime_type: mime, size_bytes: blob.size,
            uploaded_by: user?.username || null, uploaded_by_role: user?.role || null,
          });
          if (metaErr) throw metaErr;
          done++;
          toast.loading(`Restoring ${done}/${targets.length}…`, { id: tid });
        } catch (err) {
          console.error('Restore file error', entry.name, err);
          failed++;
        }
      }
      toast.dismiss(tid);
      if (done > 0) toast.success(`Restored ${done} file${done !== 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''}`);
      else toast.error('Nothing was restored');
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.dismiss(tid);
      toast.error('Restore failed: invalid ZIP');
    } finally {
      setRestoring(false);
    }
  };

  // ===== Bulk actions =====
  const filteredItems = searchQuery
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;
  const folders = filteredItems.filter((i) => i.type === 'folder');
  const files = filteredItems.filter((i) => i.type === 'file');

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  };

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  const handleBulkDownload = () => {
    const filesOnly = selectedItems.filter((i) => i.type === 'file' && i.storage_path);
    if (filesOnly.length === 0) { toast.error('No files selected (folders are skipped)'); return; }
    filesOnly.forEach((f) => {
      downloadQueue.enqueue({
        type: 'download',
        label: `Download · ${f.name}`,
        payload: { storage_path: f.storage_path, name: f.name },
      });
    });
    toast.success(`Queued ${filesOnly.length} download${filesOnly.length > 1 ? 's' : ''}`);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkShare = () => {
    if (selectedItems.length === 0) return;
    selectedItems.forEach((it) => {
      if (it.type === 'file' && it.storage_path) {
        downloadQueue.enqueue({
          type: 'share-link',
          label: `Share · ${it.name}`,
          payload: { storage_path: it.storage_path, name: it.name },
        });
      } else if (it.type === 'folder') {
        downloadQueue.enqueue({
          type: 'share-folder',
          label: `Share folder · ${it.name}`,
          payload: { folder_id: it.id, folder_name: it.name },
        });
      }
    });
    toast.success(`Queued ${selectedItems.length} share job${selectedItems.length > 1 ? 's' : ''}`);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkDelete = async () => {
    setBulkDeleteOpen(false);
    const tid = toast.loading(`Deleting ${selectedItems.length}…`);
    try {
      const allPaths: string[] = [];
      for (const it of selectedItems) {
        if (it.type === 'file' && it.storage_path) {
          allPaths.push(it.storage_path);
          await removeVersionsForFile(it.id);
        } else if (it.type === 'folder') {
          const sub = await collectStoragePaths(it.id);
          allPaths.push(...sub);
        }
      }
      if (allPaths.length) await supabase.storage.from('files').remove(allPaths);
      const ids = selectedItems.map((i) => i.id);
      await supabase.from('file_metadata').delete().in('id', ids);
      toast.dismiss(tid);
      toast.success(`Deleted ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setSelectMode(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.dismiss(tid);
      toast.error('Bulk delete failed');
    }
  };

  // Returns next free name like "Report (2).docx"
  const nextAvailableName = (base: string, existingNames: Set<string>): string => {
    if (!existingNames.has(base)) return base;
    const dot = base.lastIndexOf('.');
    const stem = dot > 0 ? base.slice(0, dot) : base;
    const ext = dot > 0 ? base.slice(dot) : '';
    for (let i = 2; i < 1000; i++) {
      const candidate = `${stem} (${i})${ext}`;
      if (!existingNames.has(candidate)) return candidate;
    }
    return `${stem}_${Date.now()}${ext}`;
  };

  // Decisions are passed in from the conflict resolver dialog

  const handleBulkMove = async (
    targetFolderId: string | null,
    decisions?: Record<string, ConflictAction>,
  ) => {
    if (selectedItems.length === 0) return;
    setMoveLoading(true);
    try {
      // Prevent moving a folder into itself / its descendants
      const movable = selectedItems.filter((i) => i.id !== targetFolderId);

      // Fetch existing names in the target folder to detect conflicts
      let existingQuery = supabase.from('file_metadata').select('id,name,type');
      existingQuery = targetFolderId === null
        ? existingQuery.is('parent_id', null)
        : existingQuery.eq('parent_id', targetFolderId);
      const { data: existing } = await existingQuery;
      const existingByName = new Map<string, { id: string; type: string }>();
      const existingNameSet = new Set<string>();
      (existing || []).forEach((e: any) => {
        // Skip the items being moved themselves (e.g. moving within same folder)
        if (movable.some((m) => m.id === e.id)) return;
        existingByName.set(e.name, { id: e.id, type: e.type });
        existingNameSet.add(e.name);
      });

      // First pass — find conflicts
      const conflicts: ConflictItem[] = [];
      for (const item of movable) {
        const hit = existingByName.get(item.name);
        if (hit) {
          conflicts.push({ id: item.id, name: item.name, type: item.type, existingId: hit.id });
        }
      }

      // If conflicts exist and we don't have decisions yet → open resolver
      if (conflicts.length > 0 && !decisions) {
        setMoveLoading(false);
        setMoveConflicts({ targetFolderId, conflicts });
        return;
      }

      // Apply decisions
      const namesToReserve = new Set(existingNameSet);
      const updates: { id: string; name?: string }[] = [];
      const toReplaceIds: { id: string; type: string }[] = [];
      let skipped = 0;

      for (const item of movable) {
        const conflict = conflicts.find((c) => c.id === item.id);
        if (!conflict) { updates.push({ id: item.id }); namesToReserve.add(item.name); continue; }
        const action = decisions?.[item.id] ?? 'skip';
        if (action === 'skip') { skipped++; continue; }
        if (action === 'replace') {
          toReplaceIds.push({ id: conflict.existingId, type: conflict.type });
          updates.push({ id: item.id });
          namesToReserve.add(item.name);
        } else { // keep both
          const newName = nextAvailableName(item.name, namesToReserve);
          updates.push({ id: item.id, name: newName });
          namesToReserve.add(newName);
        }
      }

      // Perform replacements (delete existing, including storage where applicable)
      for (const r of toReplaceIds) {
        if (r.type === 'file') {
          const { data: f } = await supabase.from('file_metadata')
            .select('storage_path').eq('id', r.id).maybeSingle();
          if (f?.storage_path) {
            await supabase.storage.from('files').remove([f.storage_path]);
            await removeVersionsForFile(r.id);
          }
        } else {
          const childPaths = await collectStoragePaths(r.id);
          if (childPaths.length) await supabase.storage.from('files').remove(childPaths);
        }
        await supabase.from('file_metadata').delete().eq('id', r.id);
      }

      // Move + optional rename in a few targeted updates
      const stamp = new Date().toISOString();
      const sameNameIds = updates.filter((u) => !u.name).map((u) => u.id);
      if (sameNameIds.length) {
        const { error } = await supabase.from('file_metadata').update({
          parent_id: targetFolderId, updated_at: stamp,
        }).in('id', sameNameIds);
        if (error) throw error;
      }
      for (const u of updates.filter((x) => x.name)) {
        const { error } = await supabase.from('file_metadata').update({
          parent_id: targetFolderId, name: u.name, updated_at: stamp,
        }).eq('id', u.id);
        if (error) throw error;
      }

      const movedCount = updates.length;
      if (movedCount > 0) {
        toast.success(
          `Moved ${movedCount} item${movedCount > 1 ? 's' : ''}` +
          (skipped ? ` · ${skipped} skipped` : '') +
          (toReplaceIds.length ? ` · ${toReplaceIds.length} replaced` : '')
        );
      } else {
        toast.info('No items moved');
      }
      setMoveDialogOpen(false);
      setMoveConflicts(null);
      setSelectedIds(new Set());
      setSelectMode(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error('Move failed');
    } finally {
      setMoveLoading(false);
    }
  };

  return (
    <div
      className="p-4 lg:p-6 max-w-6xl mx-auto pb-24 lg:pb-8 section-enter"
      style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-primary">
          <Folder className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">File Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Documents, spreadsheets &amp; more</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 relative shrink-0"
          onClick={() => setQueueOpen(true)}
          title="Export Queue"
        >
          <ListChecks className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Queue</span>
          {queueCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {queueCount}
            </span>
          )}
        </Button>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 -mx-4 lg:mx-0 px-4 lg:px-0 pt-1 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b lg:border-0 mb-3">
        {/* Breadcrumbs + Build status */}
        <div className="flex items-start gap-2 mb-3">
          <div
            className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap flex-1 min-w-0"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={`${crumb.id ?? 'root'}-${index}`} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`px-2.5 py-1.5 rounded hover:bg-muted/60 active:bg-muted transition-colors flex items-center gap-1.5 min-h-[36px] ${
                    index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {index === 0 && <HomeIcon className="h-3.5 w-3.5" />}
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
          <div className="shrink-0 pt-0.5">
            <BuildStatusIndicator />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 text-base lg:text-sm"
            placeholder="Search files…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputMode="search"
          />
        </div>

        {/* Action buttons OR bulk action bar */}
        {selectMode ? (
          <BulkActionBar
            count={selectedIds.size}
            allSelected={allSelected}
            onToggleAll={toggleAll}
            onCancel={() => { setSelectMode(false); setSelectedIds(new Set()); }}
            onDownload={handleBulkDownload}
            onShare={handleBulkShare}
            onDelete={() => setBulkDeleteOpen(true)}
            onMove={() => setMoveDialogOpen(true)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
            <input ref={restoreInputRef} type="file" accept=".zip,application/zip" onChange={handleRestoreZip} className="hidden" />
            <Button size="sm" className="h-11 flex-1 sm:flex-initial min-w-[110px]"
              onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            <Button size="sm" variant="outline" className="h-11 flex-1 sm:flex-initial min-w-[110px]"
              onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" /> Folder
            </Button>
            <Button size="sm" variant="outline" className="h-11 flex-1 sm:flex-initial min-w-[110px]"
              onClick={() => { setSelectMode(true); }}>
              <CheckSquare className="h-4 w-4 mr-2" /> Select
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-11 flex-1 sm:flex-initial min-w-[110px]">
                  <Archive className="h-4 w-4 mr-2" /> Backup
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleBackupZip}>
                  <Archive className="h-4 w-4 mr-2" /> Download Backup ZIP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRestoreClick} disabled={restoring}>
                  {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArchiveRestore className="h-4 w-4 mr-2" />}
                  Restore from Backup ZIP
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">
              {searchQuery ? 'No files match your search' : 'This folder is empty'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Upload files or create a folder to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {folders.map((folder) => (
            <FileRow
              key={folder.id}
              item={folder}
              selectMode={selectMode}
              selected={selectedIds.has(folder.id)}
              onToggle={() => toggleSelect(folder.id)}
              onOpen={() => selectMode ? toggleSelect(folder.id) : handleOpen(folder)}
              onShare={() => handleShareFolder(folder)}
              onStar={() => handleStar(folder)}
              onRename={() => { setRenameTarget(folder); setRenameValue(folder.name); }}
              onDelete={() => setDeleteTarget(folder)}
            />
          ))}
          {files.map((file) => (
            <FileRow
              key={file.id}
              item={file}
              selectMode={selectMode}
              selected={selectedIds.has(file.id)}
              onToggle={() => toggleSelect(file.id)}
              onOpen={() => selectMode ? toggleSelect(file.id) : handleOpen(file)}
              onEdit={isEditable(file) ? () => handleOpen(file) : undefined}
              onDownload={() => handleQuickDownload(file)}
              onShare={() => handleShareFile(file)}
              onStar={() => handleStar(file)}
              onRename={() => { setRenameTarget(file); setRenameValue(file.name); }}
              onDelete={() => setDeleteTarget(file)}
              onHistory={isEditable(file) ? () => setHistoryTarget(file) : undefined}
            />
          ))}
        </div>
      )}

      {/* New Folder */}
      <MobileFriendlyDialog
        open={newFolderOpen}
        onOpenChange={(open) => { setNewFolderOpen(open); if (!open) setNewFolderName(''); }}
        header={<DialogTitle>New Folder</DialogTitle>}
        footer={<Button onClick={handleCreateFolder} className="w-full h-11">Create</Button>}
      >
        <div>
          <Label>Folder Name</Label>
          <Input autoFocus className="h-11" value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="e.g. Invoices 2026" />
        </div>
      </MobileFriendlyDialog>

      {/* Rename */}
      <MobileFriendlyDialog
        open={!!renameTarget}
        onOpenChange={(open) => { if (!open) { setRenameTarget(null); setRenameValue(''); } }}
        header={<DialogTitle>Rename {renameTarget?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>}
        footer={<Button onClick={handleRename} className="w-full h-11">Rename</Button>}
      >
        <div>
          <Label>New Name</Label>
          <Input autoFocus className="h-11" value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
        </div>
      </MobileFriendlyDialog>

      {/* Single Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'folder' ? 'folder' : 'file'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'folder'
                ? `"${deleteTarget?.name}" and ALL its contents will be permanently deleted. This cannot be undone.`
                : `"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Selected files and ALL contents of selected folders will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move dialog */}
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={(open) => { setMoveDialogOpen(open); if (!open) setMoveConflicts(null); }}
        loading={moveLoading}
        excludeIds={selectedIds}
        onMove={(folderId) => handleBulkMove(folderId)}
      />

      {/* Conflict resolver */}
      <ConflictResolverDialog
        state={moveConflicts}
        loading={moveLoading}
        onCancel={() => setMoveConflicts(null)}
        onResolve={(decisions) => {
          if (!moveConflicts) return;
          handleBulkMove(moveConflicts.targetFolderId, decisions);
        }}
      />

      {/* Editors & Sub-dialogs (lazy) */}
      <Suspense fallback={null}>
        {docxEditor && (
          <DocxEditor
            open={!!docxEditor}
            onOpenChange={(open) => !open && setDocxEditor(null)}
            storagePath={docxEditor.storage_path!}
            fileName={docxEditor.name}
            onSaved={fetchItems}
          />
        )}
        {xlsxEditor && (
          <XlsxEditor
            open={!!xlsxEditor}
            onOpenChange={(open) => !open && setXlsxEditor(null)}
            storagePath={xlsxEditor.storage_path!}
            fileName={xlsxEditor.name}
            onSaved={fetchItems}
          />
        )}
        {historyTarget && (
          <VersionHistoryDialog
            open={!!historyTarget}
            onOpenChange={(open) => !open && setHistoryTarget(null)}
            fileId={historyTarget.id}
            fileName={historyTarget.name}
            currentStoragePath={historyTarget.storage_path!}
            onRestored={fetchItems}
          />
        )}
        {queueOpen && <OfflineQueuePanel open={queueOpen} onOpenChange={setQueueOpen} />}
      </Suspense>
    </div>
  );
};

// ===== Bulk action bar =====
interface BulkActionBarProps {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  onMove: () => void;
}
const BulkActionBar = ({ count, allSelected, onToggleAll, onCancel, onDownload, onShare, onDelete, onMove }: BulkActionBarProps) => (
  <div className="flex items-center gap-2 flex-wrap">
    <button
      onClick={onToggleAll}
      className="flex items-center gap-2 h-11 px-3 rounded-md border bg-background hover:bg-muted transition-colors text-sm font-medium"
    >
      {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
      {allSelected ? 'Deselect All' : 'Select All'}
    </button>
    <span className="text-sm text-muted-foreground px-1">{count} selected</span>
    <div className="flex-1" />
    <Button size="sm" variant="outline" className="h-11" onClick={onDownload} disabled={count === 0}>
      <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Download</span>
    </Button>
    <Button size="sm" variant="outline" className="h-11" onClick={onShare} disabled={count === 0}>
      <Share2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Share</span>
    </Button>
    <Button size="sm" variant="outline" className="h-11" onClick={onMove} disabled={count === 0}>
      <MoveRight className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Move</span>
    </Button>
    <Button size="sm" variant="destructive" className="h-11" onClick={onDelete} disabled={count === 0}>
      <Trash2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Delete</span>
    </Button>
    <Button size="sm" variant="ghost" className="h-11" onClick={onCancel} title="Cancel">
      <X className="h-4 w-4" />
    </Button>
  </div>
);

// ===== Move destination picker =====
interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  excludeIds: Set<string>;
  onMove: (folderId: string | null) => void;
}
const MoveDialog = ({ open, onOpenChange, loading, excludeIds, onMove }: MoveDialogProps) => {
  const [allFolders, setAllFolders] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [stack, setStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Files' }]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStack([{ id: null, name: 'My Files' }]);
    (async () => {
      setLoadingList(true);
      const { data } = await supabase.from('file_metadata').select('id,name,parent_id').eq('type', 'folder');
      setAllFolders((data || []) as any[]);
      setLoadingList(false);
    })();
  }, [open]);

  const current = stack[stack.length - 1].id;
  const visible = allFolders.filter((f) => f.parent_id === current && !excludeIds.has(f.id));

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={onOpenChange}
      header={<DialogTitle>Move to folder</DialogTitle>}
      footer={
        <Button
          className="w-full h-11"
          onClick={() => onMove(current)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MoveRight className="h-4 w-4 mr-2" />}
          Move here ({stack[stack.length - 1].name})
        </Button>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap">
          {stack.map((s, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setStack(stack.slice(0, i + 1))}
                className={`px-2 py-1 rounded hover:bg-muted/60 ${i === stack.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
              >
                {i === 0 && <HomeIcon className="h-3 w-3 inline mr-1" />}
                {s.name}
              </button>
              {i < stack.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
        {loadingList ? (
          <div className="py-6 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No subfolders here</div>
        ) : (
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {visible.map((f) => (
              <button
                key={f.id}
                onClick={() => setStack([...stack, { id: f.id, name: f.name }])}
                className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 text-left text-sm"
              >
                <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileFriendlyDialog>
  );
};

// ===== Row =====
interface FileRowProps {
  item: FileNode;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStar: () => void;
  onRename: () => void;
  onDelete: () => void;
  onHistory?: () => void;
}

const FileRow = ({
  item, selectMode, selected, onToggle, onOpen, onEdit, onDownload,
  onShare, onStar, onRename, onDelete, onHistory,
}: FileRowProps) => {
  const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mime_type, item.name);
  const iconColor = item.type === 'folder' ? 'text-amber-500' : getFileColor(item.mime_type, item.name);
  const editable = item.type === 'file' && (item.name.toLowerCase().endsWith('.docx') || item.name.toLowerCase().endsWith('.xlsx') || item.name.toLowerCase().endsWith('.xls'));

  return (
    <Card className={`transition-colors touch-manipulation ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/30 active:bg-muted/50'}`}>
      <CardContent className="p-3 flex items-center gap-3">
        {selectMode && (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="h-5 w-5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[44px]">
          <Icon className={`h-7 w-7 shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
              {item.name}
              {item.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              {editable && (
                <span className="hidden sm:inline-flex text-[9px] uppercase font-semibold px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  Edit
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {item.type === 'file' && (<>{formatBytes(item.size_bytes)} · </>)}
              {format(new Date(item.updated_at), 'dd MMM yyyy')}
              {item.uploaded_by && ` · by ${item.uploaded_by}`}
            </p>
          </div>
        </button>
        {!selectMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" /> Open in Editor
                </DropdownMenuItem>
              )}
              {onHistory && (
                <DropdownMenuItem onClick={onHistory}>
                  <History className="h-4 w-4 mr-2" /> Version History
                </DropdownMenuItem>
              )}
              {item.type === 'file' && onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {item.type === 'folder' ? 'Share Folder (7d)' : 'Share Link (7d)'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onStar}>
                <Star className={`h-4 w-4 mr-2 ${item.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                {item.is_starred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManagerSection;

// ===== Conflict resolver =====
interface ConflictResolverProps {
  state: MoveConflictsState | null;
  loading: boolean;
  onCancel: () => void;
  onResolve: (decisions: Record<string, ConflictAction>) => void;
}
const ConflictResolverDialog = ({ state, loading, onCancel, onResolve }: ConflictResolverProps) => {
  const [decisions, setDecisions] = useState<Record<string, ConflictAction>>({});
  const open = !!state;

  useEffect(() => {
    if (state) {
      const initial: Record<string, ConflictAction> = {};
      state.conflicts.forEach((c) => { initial[c.id] = 'keep'; });
      setDecisions(initial);
    }
  }, [state]);

  if (!state) return null;

  const setAll = (action: ConflictAction) => {
    const next: Record<string, ConflictAction> = {};
    state.conflicts.forEach((c) => { next[c.id] = action; });
    setDecisions(next);
  };

  const optionBtn = (id: string, action: ConflictAction, label: string, color: string) => (
    <button
      onClick={() => setDecisions((d) => ({ ...d, [id]: action }))}
      className={`flex-1 min-w-0 h-9 px-2 rounded-md border text-xs font-medium transition-colors ${
        decisions[id] === action
          ? `${color} text-white border-transparent`
          : 'bg-background hover:bg-muted text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => { if (!o) onCancel(); }}
      header={
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {state.conflicts.length} name conflict{state.conflicts.length > 1 ? 's' : ''}
        </DialogTitle>
      }
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1 h-11" onClick={() => onResolve(decisions)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MoveRight className="h-4 w-4 mr-2" />}
            Apply &amp; Move
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Some items already exist in the destination folder. Choose what to do for each:
        </p>

        <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-muted/40 border">
          <span className="text-xs font-medium self-center mr-1">Apply to all:</span>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAll('skip')}>
            Skip all
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAll('replace')}>
            Replace all
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAll('keep')}>
            Keep both for all
          </Button>
        </div>

        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {state.conflicts.map((c) => (
            <div key={c.id} className="border rounded-lg p-2.5 bg-card">
              <div className="flex items-center gap-2 mb-2">
                {c.type === 'folder'
                  ? <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                  : <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="text-sm font-medium truncate flex-1">{c.name}</span>
              </div>
              <div className="flex gap-1.5">
                {optionBtn(c.id, 'skip', 'Skip', 'bg-muted-foreground')}
                {optionBtn(c.id, 'replace', 'Replace', 'bg-destructive')}
                {optionBtn(c.id, 'keep', 'Keep both', 'bg-primary')}
              </div>
              {decisions[c.id] === 'replace' && (
                <p className="text-[10px] text-destructive mt-1.5">
                  ⚠ Existing {c.type} will be permanently deleted.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </MobileFriendlyDialog>
  );
};
