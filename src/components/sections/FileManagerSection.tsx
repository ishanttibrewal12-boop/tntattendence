import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Folder, FolderPlus, Upload, Download, Trash2, Search, MoreVertical,
  ChevronRight, Star, Share2, Pencil, FileText, FileSpreadsheet,
  FileImage, File as FileIcon, Home as HomeIcon, Archive, Loader2, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const DocxEditor = lazy(() => import('@/components/file-editors/DocxEditor'));
const XlsxEditor = lazy(() => import('@/components/file-editors/XlsxEditor'));

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

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FileManagerSectionProps {
  onBack: () => void;
}

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
  const [exporting, setExporting] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ name: string; links: { name: string; url: string }[] } | null>(null);
  const [docxEditor, setDocxEditor] = useState<FileNode | null>(null);
  const [xlsxEditor, setXlsxEditor] = useState<FileNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('file_metadata').select('*').order('type', { ascending: true }).order('name', { ascending: true });
    if (currentFolder === null) query = query.is('parent_id', null);
    else query = query.eq('parent_id', currentFolder);
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load files');
      console.error(error);
    } else {
      setItems((data || []) as FileNode[]);
    }
    setIsLoading(false);
  }, [currentFolder]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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

  const handleDownload = async (item: FileNode) => {
    if (!item.storage_path) return;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(item.storage_path, 60);
    if (error || !data) { toast.error('Failed to download'); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = (item: FileNode) => {
    if (item.type === 'folder') return navigateToFolder(item);
    if (isDocx(item)) return setDocxEditor(item);
    if (isXlsx(item)) return setXlsxEditor(item);
    return handleDownload(item);
  };

  const handleShareFile = async (item: FileNode) => {
    if (!item.storage_path) return;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(item.storage_path, 60 * 60 * 24 * 7);
    if (error || !data) { toast.error('Failed to create share link'); return; }
    try {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success('Share link copied (valid 7 days)');
    } catch {
      window.prompt('Share link (valid 7 days):', data.signedUrl);
    }
  };

  // Recursively collect all files in folder
  const collectFolderFiles = async (
    rootId: string,
    pathPrefix = ''
  ): Promise<{ name: string; storage_path: string; relative: string }[]> => {
    const out: { name: string; storage_path: string; relative: string }[] = [];
    const visit = async (id: string, prefix: string) => {
      const { data } = await supabase.from('file_metadata')
        .select('id,name,type,storage_path').eq('parent_id', id);
      for (const child of data || []) {
        if (child.type === 'file' && child.storage_path) {
          out.push({ name: child.name, storage_path: child.storage_path, relative: `${prefix}${child.name}` });
        } else if (child.type === 'folder') {
          await visit(child.id, `${prefix}${child.name}/`);
        }
      }
    };
    await visit(rootId, pathPrefix);
    return out;
  };

  const handleShareFolder = async (folder: FileNode) => {
    const tid = toast.loading(`Generating share links for "${folder.name}"…`);
    try {
      const files = await collectFolderFiles(folder.id);
      if (files.length === 0) {
        toast.dismiss(tid);
        toast.error('Folder is empty');
        return;
      }
      const links: { name: string; url: string }[] = [];
      for (const f of files) {
        const { data } = await supabase.storage.from('files')
          .createSignedUrl(f.storage_path, 60 * 60 * 24 * 7);
        if (data?.signedUrl) links.push({ name: f.relative, url: data.signedUrl });
      }
      toast.dismiss(tid);
      if (links.length === 0) { toast.error('Failed to generate links'); return; }
      // Build a plain-text bundle
      const bundle = links.map((l) => `${l.name}\n${l.url}`).join('\n\n');
      try {
        await navigator.clipboard.writeText(bundle);
        toast.success(`${links.length} share links copied (valid 7 days)`);
      } catch {/* fall back to dialog */}
      setShareDialog({ name: folder.name, links });
    } catch (err) {
      console.error(err);
      toast.dismiss(tid);
      toast.error('Failed to share folder');
    }
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'file' && deleteTarget.storage_path) {
        await supabase.storage.from('files').remove([deleteTarget.storage_path]);
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

  // ===== ZIP backup of the entire File Manager =====
  const handleBackupZip = async () => {
    setExporting(true);
    const tid = toast.loading('Preparing backup…');
    try {
      const { data: allMeta, error: metaErr } = await supabase
        .from('file_metadata').select('*');
      if (metaErr) throw metaErr;
      const meta = (allMeta || []) as FileNode[];

      // Build path for each item
      const byId = new Map(meta.map((m) => [m.id, m]));
      const pathOf = (id: string): string => {
        const parts: string[] = [];
        let cur: FileNode | undefined = byId.get(id);
        while (cur) {
          parts.unshift(cur.name);
          cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
        }
        return parts.join('/');
      };

      const zip = new JSZip();
      const filesRoot = zip.folder('files')!;
      zip.file('metadata.json', JSON.stringify(meta, null, 2));
      zip.file('README.txt',
        `File Manager Backup\nGenerated: ${new Date().toISOString()}\n\n` +
        `- metadata.json: full metadata for all files & folders\n` +
        `- files/: original files in their folder hierarchy\n`);

      const fileItems = meta.filter((m) => m.type === 'file' && m.storage_path);
      let done = 0;
      for (const f of fileItems) {
        try {
          const { data: blob, error } = await supabase.storage.from('files').download(f.storage_path!);
          if (error || !blob) continue;
          filesRoot.file(pathOf(f.id), blob);
          done++;
          toast.loading(`Packaging ${done}/${fileItems.length}…`, { id: tid });
        } catch (err) {
          console.error('skip', f.name, err);
        }
      }
      toast.loading('Compressing zip…', { id: tid });
      const blob = await zip.generateAsync({
        type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file-manager-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss(tid);
      toast.success(`Backup ready: ${done} file${done !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error(err);
      toast.dismiss(tid);
      toast.error('Backup failed');
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = searchQuery
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;
  const folders = filteredItems.filter((i) => i.type === 'folder');
  const files = filteredItems.filter((i) => i.type === 'file');

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
      </div>

      {/* Sticky toolbar (mobile-friendly) */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:mx-0 px-4 lg:px-0 pt-1 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b lg:border-0 mb-3"
      >
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 mb-3 text-sm overflow-x-auto whitespace-nowrap" style={{ WebkitOverflowScrolling: 'touch' as any }}>
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
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>

        {/* Search (always full width on mobile) */}
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

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
          <Button
            size="sm"
            className="h-11 flex-1 sm:flex-initial min-w-[120px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
          <Button size="sm" variant="outline" className="h-11 flex-1 sm:flex-initial min-w-[120px]" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-11 flex-1 sm:flex-initial min-w-[120px]"
            onClick={handleBackupZip}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
            {exporting ? 'Packing…' : 'Backup ZIP'}
          </Button>
        </div>
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
              onOpen={() => handleOpen(folder)}
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
              onOpen={() => handleOpen(file)}
              onEdit={isEditable(file) ? () => handleOpen(file) : undefined}
              onDownload={() => handleDownload(file)}
              onShare={() => handleShareFile(file)}
              onStar={() => handleStar(file)}
              onRename={() => { setRenameTarget(file); setRenameValue(file.name); }}
              onDelete={() => setDeleteTarget(file)}
            />
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <MobileFriendlyDialog
        open={newFolderOpen}
        onOpenChange={(open) => { setNewFolderOpen(open); if (!open) setNewFolderName(''); }}
        header={<DialogTitle>New Folder</DialogTitle>}
        footer={<Button onClick={handleCreateFolder} className="w-full h-11">Create</Button>}
      >
        <div>
          <Label>Folder Name</Label>
          <Input
            autoFocus
            className="h-11"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="e.g. Invoices 2026"
          />
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
          <Input
            autoFocus
            className="h-11"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        </div>
      </MobileFriendlyDialog>

      {/* Folder share results */}
      <MobileFriendlyDialog
        open={!!shareDialog}
        onOpenChange={(open) => !open && setShareDialog(null)}
        header={<DialogTitle>Share "{shareDialog?.name}"</DialogTitle>}
        footer={
          <Button
            className="w-full h-11"
            onClick={async () => {
              if (!shareDialog) return;
              const text = shareDialog.links.map((l) => `${l.name}\n${l.url}`).join('\n\n');
              try {
                await navigator.clipboard.writeText(text);
                toast.success('All links copied');
              } catch {
                toast.error('Copy failed — select and copy manually');
              }
            }}
          >
            Copy All Links
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground mb-2">
          {shareDialog?.links.length} link{shareDialog?.links.length !== 1 ? 's' : ''} · Valid for 7 days
        </p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {shareDialog?.links.map((l, i) => (
            <div key={i} className="border rounded-lg p-2.5">
              <p className="text-xs font-medium truncate text-foreground">{l.name}</p>
              <input
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                value={l.url}
                className="mt-1 w-full text-[11px] font-mono bg-muted/50 rounded px-2 py-1.5 outline-none"
              />
            </div>
          ))}
        </div>
      </MobileFriendlyDialog>

      {/* Delete */}
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

      {/* Editors */}
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
      </Suspense>
    </div>
  );
};

interface FileRowProps {
  item: FileNode;
  onOpen: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStar: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const FileRow = ({ item, onOpen, onEdit, onDownload, onShare, onStar, onRename, onDelete }: FileRowProps) => {
  const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mime_type, item.name);
  const iconColor = item.type === 'folder' ? 'text-amber-500' : getFileColor(item.mime_type, item.name);
  const editable = item.type === 'file' && (item.name.toLowerCase().endsWith('.docx') || item.name.toLowerCase().endsWith('.xlsx') || item.name.toLowerCase().endsWith('.xls'));

  return (
    <Card className="hover:bg-muted/30 active:bg-muted/50 transition-colors touch-manipulation">
      <CardContent className="p-3 flex items-center gap-3">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" /> Open in Editor
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
      </CardContent>
    </Card>
  );
};

export default FileManagerSection;
