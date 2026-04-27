import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder, FolderPlus, Upload, Download, Trash2, Search, MoreVertical,
  ChevronRight, Star, Share2, Pencil, FileText, FileSpreadsheet,
  FileImage, File as FileIcon, Home as HomeIcon, ArrowLeft,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('file_metadata').select('*').order('type', { ascending: true }).order('name', { ascending: true });
    if (currentFolder === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', currentFolder);
    }
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load files');
      console.error(error);
    } else {
      setItems((data || []) as FileNode[]);
    }
    setIsLoading(false);
  }, [currentFolder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    if (!name) {
      toast.error('Enter a folder name');
      return;
    }
    const { error } = await supabase.from('file_metadata').insert({
      name,
      type: 'folder',
      parent_id: currentFolder,
      uploaded_by: user?.username || null,
      uploaded_by_role: user?.role || null,
    });
    if (error) {
      toast.error('Failed to create folder');
      return;
    }
    toast.success(`Folder "${name}" created`);
    setNewFolderOpen(false);
    setNewFolderName('');
    fetchItems();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from('files').upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });
        if (uploadError) throw uploadError;
        const { error: metaError } = await supabase.from('file_metadata').insert({
          name: file.name,
          type: 'file',
          parent_id: currentFolder,
          storage_path: storagePath,
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
    if (error || !data) {
      toast.error('Failed to download');
      return;
    }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (item: FileNode) => {
    if (!item.storage_path) return;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(item.storage_path, 60 * 60 * 24 * 7); // 7-day link
    if (error || !data) {
      toast.error('Failed to create share link');
      return;
    }
    try {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success('Share link copied (valid 7 days)');
    } catch {
      window.prompt('Share link (valid 7 days):', data.signedUrl);
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      toast.error('Enter a name');
      return;
    }
    const { error } = await supabase.from('file_metadata').update({ name }).eq('id', renameTarget.id);
    if (error) {
      toast.error('Failed to rename');
      return;
    }
    toast.success('Renamed');
    setRenameTarget(null);
    setRenameValue('');
    fetchItems();
  };

  const handleStar = async (item: FileNode) => {
    const { error } = await supabase.from('file_metadata').update({ is_starred: !item.is_starred }).eq('id', item.id);
    if (error) {
      toast.error('Failed');
      return;
    }
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
        if (childPaths.length > 0) {
          await supabase.storage.from('files').remove(childPaths);
        }
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

  const filteredItems = searchQuery
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const folders = filteredItems.filter((i) => i.type === 'folder');
  const files = filteredItems.filter((i) => i.type === 'file');

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto pb-24 lg:pb-8 section-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-primary">
          <Folder className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">File Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Documents, spreadsheets & more</p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 mb-4 text-sm overflow-x-auto whitespace-nowrap">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.id ?? 'root'}-${index}`} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className={`px-2 py-1 rounded hover:bg-muted/60 transition-colors flex items-center gap-1.5 ${
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

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          size="sm"
          className="h-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
        <Button size="sm" variant="outline" className="h-10" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-14 rounded-lg bg-muted/50" />
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
        <div className="space-y-1">
          {/* Folders first */}
          {folders.map((folder) => (
            <FileRow
              key={folder.id}
              item={folder}
              onOpen={() => navigateToFolder(folder)}
              onStar={() => handleStar(folder)}
              onRename={() => {
                setRenameTarget(folder);
                setRenameValue(folder.name);
              }}
              onDelete={() => setDeleteTarget(folder)}
            />
          ))}
          {/* Files */}
          {files.map((file) => (
            <FileRow
              key={file.id}
              item={file}
              onOpen={() => handleDownload(file)}
              onDownload={() => handleDownload(file)}
              onShare={() => handleShare(file)}
              onStar={() => handleStar(file)}
              onRename={() => {
                setRenameTarget(file);
                setRenameValue(file.name);
              }}
              onDelete={() => setDeleteTarget(file)}
            />
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <MobileFriendlyDialog
        open={newFolderOpen}
        onOpenChange={(open) => {
          setNewFolderOpen(open);
          if (!open) setNewFolderName('');
        }}
        header={<DialogTitle>New Folder</DialogTitle>}
        footer={<Button onClick={handleCreateFolder} className="w-full h-11">Create</Button>}
      >
        <div>
          <Label>Folder Name</Label>
          <Input
            autoFocus
            className="h-10"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="e.g. Invoices 2026"
          />
        </div>
      </MobileFriendlyDialog>

      {/* Rename Dialog */}
      <MobileFriendlyDialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameValue('');
          }
        }}
        header={<DialogTitle>Rename {renameTarget?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>}
        footer={<Button onClick={handleRename} className="w-full h-11">Rename</Button>}
      >
        <div>
          <Label>New Name</Label>
          <Input
            autoFocus
            className="h-10"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        </div>
      </MobileFriendlyDialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'folder' ? 'folder' : 'file'}?
            </AlertDialogTitle>
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
    </div>
  );
};

// --- File / Folder row ---
interface FileRowProps {
  item: FileNode;
  onOpen: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStar: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const FileRow = ({ item, onOpen, onDownload, onShare, onStar, onRename, onDelete }: FileRowProps) => {
  const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mime_type, item.name);
  const iconColor = item.type === 'folder' ? 'text-amber-500' : getFileColor(item.mime_type, item.name);

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-3 flex items-center gap-3">
        <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Icon className={`h-6 w-6 shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
              {item.name}
              {item.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {item.type === 'file' && (
                <>
                  {formatBytes(item.size_bytes)} · {' '}
                </>
              )}
              {format(new Date(item.updated_at), 'dd MMM yyyy')}
              {item.uploaded_by && ` · by ${item.uploaded_by}`}
            </p>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {item.type === 'file' && onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" /> Download
              </DropdownMenuItem>
            )}
            {item.type === 'file' && onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share Link
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
