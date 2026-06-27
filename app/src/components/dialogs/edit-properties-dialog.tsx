import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useRenameFolder } from '@/hooks/use-folder-queries';
import { useUpdateDocument } from '@/hooks/use-document-queries';
import { useAuth } from '@/contexts/auth-context';
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
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowEdit, setAllowEdit] = useState(true);
  const [allowDelete, setAllowDelete] = useState(true);
  const [allowMove, setAllowMove] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);

  const renameFolder = useRenameFolder();
  const updateDocument = useUpdateDocument();
  const mutation = type === 'folder' ? renameFolder : updateDocument;

  const isOwner = item.createdById === user?.id;
  const canEdit = isOwner || item.allowEdit;

  useEffect(() => {
    if (!open) return;
    if (doc) {
      setName(doc.originalName);
      setDocumentDate(doc.documentDate?.split('T')[0] ?? '');
      setIsPrivate(doc.isPrivate);
      setAllowEdit(doc.allowEdit);
      setAllowDelete(doc.allowDelete);
      setAllowMove(doc.allowMove);
      setAllowCopy(doc.allowCopy);
    } else if (folder) {
      setName(folder.name);
      setIsPrivate(folder.isPrivate);
      setAllowEdit(folder.allowEdit);
      setAllowDelete(folder.allowDelete);
      setAllowMove(folder.allowMove);
      setAllowCopy(folder.allowCopy);
    }
  }, [open, doc, folder]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const ownerFields = isOwner ? { isPrivate, allowEdit, allowDelete, allowMove, allowCopy } : {};

    if (type === 'folder') {
      renameFolder.mutate({ id: item.uuid, name: name.trim(), ...ownerFields }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      updateDocument.mutate({
        id: item.uuid,
        originalName: name.trim(),
        documentDate: documentDate || undefined,
        ...ownerFields,
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
            <DialogDescription>{canEdit ? `Edit ${type} details.` : `View ${type} details.`}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prop-name">Name</Label>
              <Input id="prop-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus disabled={!canEdit} />
            </div>

            {type === 'document' && (
              <div className="grid gap-2">
                <Label htmlFor="prop-date">Document date</Label>
                <Input id="prop-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} disabled={!canEdit} />
              </div>
            )}

            {isOwner && (
              <>
                <Separator />
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner settings</Label>

                <div className="flex items-center gap-2">
                  <Checkbox id="prop-private" checked={isPrivate} onCheckedChange={(c) => setIsPrivate(c === true)} />
                  <Label htmlFor="prop-private">Private (only you can see this)</Label>
                </div>

                <Label className="text-xs text-muted-foreground">Allow other users to:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="prop-allow-edit" checked={allowEdit} onCheckedChange={(c) => setAllowEdit(c === true)} />
                    <Label htmlFor="prop-allow-edit" className="text-sm font-normal">Edit</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="prop-allow-delete" checked={allowDelete} onCheckedChange={(c) => setAllowDelete(c === true)} />
                    <Label htmlFor="prop-allow-delete" className="text-sm font-normal">Delete</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="prop-allow-move" checked={allowMove} onCheckedChange={(c) => setAllowMove(c === true)} />
                    <Label htmlFor="prop-allow-move" className="text-sm font-normal">Move</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="prop-allow-copy" checked={allowCopy} onCheckedChange={(c) => setAllowCopy(c === true)} />
                    <Label htmlFor="prop-allow-copy" className="text-sm font-normal">Copy</Label>
                  </div>
                </div>
              </>
            )}
          </div>

          {mutation.isError && (
            <p className="mt-2 text-sm text-destructive">{mutation.error?.message ?? 'Update failed.'}</p>
          )}

          {canEdit && (
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={!name.trim() || mutation.isPending}>
                {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
