import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import mammoth from 'mammoth';
import { asBlob } from 'html-docx-js-typescript';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { snapshotCurrentVersion } from '@/lib/file-manager/versionSnapshot';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Heading1, Heading2, Heading3, Save, Loader2, Undo, Redo,
} from 'lucide-react';

interface DocxEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storagePath: string;
  fileName: string;
  onSaved?: () => void;
}

export function DocxEditor({ open, onOpenChange, storagePath, fileName, onSaved }: DocxEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content: '<p>Loading…</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[60vh] focus:outline-none px-3 py-4 bg-background text-foreground',
      },
    },
  });

  const loadDocument = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('files').download(storagePath);
      if (error) throw error;
      const arrayBuffer = await data.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor.commands.setContent(result.value || '<p></p>');
    } catch (err) {
      console.error('DOCX load error', err);
      toast.error('Failed to load document');
      editor.commands.setContent('<p></p>');
    } finally {
      setLoading(false);
    }
  }, [editor, storagePath]);

  useEffect(() => {
    if (open && editor) loadDocument();
  }, [open, editor, loadDocument]);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      // Snapshot existing version before overwriting
      await snapshotCurrentVersion(storagePath, fileName);

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${editor.getHTML()}</body></html>`;
      const blob = await asBlob(html);
      const file = blob instanceof Blob ? blob : new Blob([blob as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const { error } = await supabase.storage.from('files').upload(storagePath, file, {
        upsert: true,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      if (error) throw error;
      await supabase.from('file_metadata').update({
        size_bytes: file.size,
        updated_at: new Date().toISOString(),
      }).eq('storage_path', storagePath);
      toast.success('Document saved · history updated');
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!editor) return null;

  const ToolbarBtn = ({ active, onClick, children, label }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-md transition-colors shrink-0
        ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
    >
      {children}
    </button>
  );

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={onOpenChange}
      header={
        <div className="flex items-center justify-between gap-2 w-full">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <Button onClick={handleSave} size="sm" disabled={saving || loading} className="shrink-0">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1 sticky top-0 bg-background z-10 border-b">
          <ToolbarBtn label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolbarBtn>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarBtn label="H1" active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="H2" active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="H3" active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolbarBtn>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarBtn label="Bold" active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Italic" active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Underline" active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Strike" active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></ToolbarBtn>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarBtn label="Bullets" active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Ordered" active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarBtn label="Left" active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Center" active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Right" active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></ToolbarBtn>
        </div>

        {/* Editor surface */}
        <div className="border rounded-lg overflow-hidden bg-background">
          {loading ? (
            <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading document…
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Note: Complex formatting like images & tables from the original .docx may render simplified.
        </p>
      </div>
    </MobileFriendlyDialog>
  );
}

export default DocxEditor;
