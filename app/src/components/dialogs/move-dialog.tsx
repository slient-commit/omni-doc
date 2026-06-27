import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/hooks/use-folder-queries';
import { useMoveDocument } from '@/hooks/use-document-queries';
import { Folder as FolderIcon, ChevronRight, Loader2, Home } from 'lucide-react';

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number | string;
  documentName: string;
}

// ponytail: simple folder picker — navigate into folders, select destination
export function MoveDialog({ open, onOpenChange, documentId, documentName }: MoveDialogProps) {
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([]);

  const { data: folders = [], isLoading } = useFolders(currentParent);
  const moveDocument = useMoveDocument();

  useEffect(() => {
    if (open) {
      setCurrentParent(null);
      setSelectedFolderId(null);
      setBreadcrumb([]);
    }
  }, [open]);

  function navigateInto(folder: { id: number; uuid: string; name: string }) {
    setCurrentParent(folder.uuid);
    setSelectedFolderId(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.uuid, name: folder.name }]);
  }

  function navigateTo(index: number) {
    if (index === -1) {
      setCurrentParent(null);
      setSelectedFolderId(null);
      setBreadcrumb([]);
    } else {
      const target = breadcrumb[index];
      setCurrentParent(target.id);
      // resolve numeric id from folders if we have it — otherwise keep selectedFolderId
      setBreadcrumb((prev) => prev.slice(0, index + 1));
    }
  }

  function handleMove() {
    const folderIds = selectedFolderId ? [selectedFolderId] : [];
    moveDocument.mutate(
      { id: documentId, folderIds },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) moveDocument.reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{documentName}"</DialogTitle>
          <DialogDescription>Select a destination folder.</DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button className="cursor-pointer hover:text-foreground" onClick={() => navigateTo(-1)}>
            <Home className="size-4" />
          </button>
          {breadcrumb.map((item, i) => (
            <span key={item.id} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              <button
                className="cursor-pointer hover:text-foreground"
                onClick={() => navigateTo(i)}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        {/* Folder list */}
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
                className={`flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm transition-colors last:border-b-0 hover:bg-muted/50 ${
                  selectedFolderId === folder.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedFolderId(folder.id)}
                onDoubleClick={() => navigateInto(folder)}
              >
                <FolderIcon className="size-4 shrink-0 text-yellow-500" />
                <span className="flex-1 truncate text-left">{folder.name}</span>
                <ChevronRight className="size-3 text-muted-foreground" />
              </button>
            ))
          )}
        </div>

        {moveDocument.isError && (
          <p className="text-sm text-destructive">{moveDocument.error?.message ?? 'Move failed.'}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMove} disabled={moveDocument.isPending}>
            {moveDocument.isPending && <Loader2 className="size-4 animate-spin" />}
            {selectedFolderId ? 'Move here' : 'Move to root'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
