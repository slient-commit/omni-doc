import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useRenameFolder } from '@/hooks/use-folder-queries';
import { useUpdateDocument } from '@/hooks/use-document-queries';
import { Loader2Icon, Settings2Icon } from 'lucide-react';
import type { Folder, Document } from '@/types/documents';

interface EditPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'folder' | 'document';
  item: Folder | Document;
}

export function EditPropertiesDialog({ open, onOpenChange, type, item }: EditPropertiesDialogProps) {
  const doc = type === 'document' ? (item as Document) : null;
  const folder = type === 'folder' ? (item as Folder) : null;

  const [name, setName] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const renameFolder = useRenameFolder();
  const updateDocument = useUpdateDocument();
  const mutation = type === 'folder' ? renameFolder : updateDocument;

  useEffect(() => {
    if (!open) return;
    if (doc) {
      setName(doc.originalName);
      setDocumentDate(doc.documentDate?.split('T')[0] ?? '');
      setIsPrivate(doc.isPrivate);
    } else if (folder) {
      setName(folder.name);
      setIsPrivate(folder.isPrivate);
    }
  }, [open, doc, folder]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === 'folder') {
      renameFolder.mutate({ id: item.id, name: name.trim() }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      updateDocument.mutate({
        id: item.id,
        originalName: name.trim(),
        documentDate: documentDate || undefined,
        // ponytail: isPrivate update not in API yet, add PATCH field when needed
      }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) mutation.reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2Icon className="size-4" />
              {type === 'folder' ? 'Folder' : 'Document'} Properties
            </DialogTitle>
            <DialogDescription>Edit {type} details.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prop-name">Name</Label>
              <Input id="prop-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>

            {type === 'document' && (
              <div className="grid gap-2">
                <Label htmlFor="prop-date">Document date</Label>
                <Input id="prop-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
              </div>
            )}

            {type === 'document' && (
              <div className="flex items-center gap-2">
                <Checkbox id="prop-private" checked={isPrivate} onCheckedChange={(c) => setIsPrivate(c === true)} />
                <Label htmlFor="prop-private">Private</Label>
              </div>
            )}
          </div>

          {mutation.isError && (
            <p className="mt-2 text-sm text-destructive">{mutation.error?.message ?? 'Update failed.'}</p>
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
