import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/hooks/use-folder-queries';
import { useMoveDocument, useCopyDocument } from '@/hooks/use-document-queries';
import { useMoveFolder, useCopyFolder } from '@/hooks/use-folder-queries';
import { Folder as FolderIcon, ChevronRight, Loader2, Home } from 'lucide-react';

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'move' | 'copy';
  type: 'document' | 'folder';
  itemId: number | string;
  itemName: string;
}

export function MoveDialog({ open, onOpenChange, mode, type, itemId, itemName }: MoveDialogProps) {
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedFolderUuid, setSelectedFolderUuid] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([]);

  const { data: allFolders = [], isLoading } = useFolders(currentParent);
  // Hide source folder from list when moving/copying a folder
  const folders = type === 'folder'
    ? allFolders.filter((f) => f.uuid !== itemId && String(f.id) !== String(itemId))
    : allFolders;
  const moveDocument = useMoveDocument();
  const copyDocument = useCopyDocument();
  const moveFolder = useMoveFolder();
  const copyFolder = useCopyFolder();

  useEffect(() => {
    if (open) {
      setCurrentParent(null);
      setSelectedFolderId(null);
      setSelectedFolderUuid(null);
      setBreadcrumb([]);
    }
  }, [open]);

  function navigateInto(folder: { id: number; uuid: string; name: string }) {
    setCurrentParent(folder.uuid);
    setSelectedFolderId(folder.id);
    setSelectedFolderUuid(folder.uuid);
    setBreadcrumb((prev) => [...prev, { id: folder.uuid, name: folder.name }]);
  }

  function navigateTo(index: number) {
    if (index === -1) {
      setCurrentParent(null);
      setSelectedFolderId(null);
      setSelectedFolderUuid(null);
      setBreadcrumb([]);
    } else {
      const target = breadcrumb[index];
      setCurrentParent(target.id);
      setSelectedFolderUuid(target.id);
      setBreadcrumb((prev) => prev.slice(0, index + 1));
    }
  }

  function handleSubmit() {
    const onSuccess = () => onOpenChange(false);

    if (type === 'document') {
      if (mode === 'move') {
        moveDocument.mutate({ id: itemId, folderIds: selectedFolderId ? [selectedFolderId] : [] }, { onSuccess });
      } else {
        if (!selectedFolderId) return;
        copyDocument.mutate({ id: itemId, folderId: selectedFolderId }, { onSuccess });
      }
    } else {
      // folder move/copy — targetParentId is the uuid of the destination
      if (mode === 'move') {
        moveFolder.mutate({ id: itemId, targetParentId: selectedFolderUuid }, { onSuccess });
      } else {
        copyFolder.mutate({ id: itemId, targetParentId: selectedFolderUuid }, { onSuccess });
      }
    }
  }

  const isPending = moveDocument.isPending || copyDocument.isPending || moveFolder.isPending || copyFolder.isPending;
  const isError = moveDocument.isError || copyDocument.isError || moveFolder.isError || copyFolder.isError;
  const errorMsg = (moveDocument.error || copyDocument.error || moveFolder.error || copyFolder.error)?.message ?? `${mode} failed.`;

  const canSubmit = mode === 'copy' ? !!selectedFolderId : true;
  const actionLabel = mode === 'move'
    ? (selectedFolderId ? 'Move here' : 'Move to root')
    : 'Copy here';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'move' ? 'Move' : 'Copy'} "{itemName}"</DialogTitle>
          <DialogDescription>Select a destination folder.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button className="cursor-pointer hover:text-foreground" onClick={() => navigateTo(-1)}>
            <Home className="size-4" />
          </button>
          {breadcrumb.map((item, i) => (
            <span key={item.id} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              <button className="cursor-pointer hover:text-foreground" onClick={() => navigateTo(i)}>{item.name}</button>
            </span>
          ))}
        </div>

        <div className="max-h-60 min-h-[120px] overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : folders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {currentParent ? 'No subfolders' : 'No folders yet'}
            </p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                className={`flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm transition-colors last:border-b-0 hover:bg-muted/50 ${selectedFolderId === folder.id ? 'bg-accent' : ''}`}
                onClick={() => { setSelectedFolderId(folder.id); setSelectedFolderUuid(folder.uuid); }}
                onDoubleClick={() => navigateInto(folder)}
              >
                <FolderIcon className="size-4 shrink-0 text-yellow-500" />
                <span className="flex-1 truncate text-left">{folder.name}</span>
                <ChevronRight className="size-3 text-muted-foreground" />
              </button>
            ))
          )}
        </div>

        {isError && <p className="text-sm text-destructive">{errorMsg}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
