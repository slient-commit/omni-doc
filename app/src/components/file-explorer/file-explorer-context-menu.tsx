import { type ReactNode, useState } from 'react';
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { FolderOpen, Pencil, Download, Share2, Trash2, ArchiveRestore, Settings2 } from 'lucide-react';
import { useDeleteFolder, useRestoreFolder } from '@/hooks/use-folder-queries';
import { useDeleteDocument, useRestoreDocument } from '@/hooks/use-document-queries';
import { RenameDialog } from '@/components/dialogs/rename-dialog';
import { ConfirmDeleteDialog } from '@/components/dialogs/confirm-delete-dialog';
import { ShareDialog } from '@/components/dialogs/share-dialog';
import { EditPropertiesDialog } from '@/components/dialogs/edit-properties-dialog';
import { useAuth } from '@/contexts/auth-context';
import type { Folder, Document } from '@/types/documents';

interface FileExplorerContextMenuProps {
  children: ReactNode;
  item: Folder | Document;
  type: 'folder' | 'document';
  isTrash?: boolean;
  onOpen?: () => void;
}

export function FileExplorerContextMenu({
  children, item, type, isTrash = false, onOpen,
}: FileExplorerContextMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const { token } = useAuth();

  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const restoreFolder = useRestoreFolder();
  const restoreDocument = useRestoreDocument();

  const itemName = type === 'folder' ? (item as Folder).name : (item as Document).originalName;

  function handleSoftDelete() {
    if (type === 'folder') deleteFolder.mutate(item.id);
    else deleteDocument.mutate(item.id);
  }

  function handleRestore() {
    if (type === 'folder') restoreFolder.mutate(item.id);
    else restoreDocument.mutate(item.id);
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          {isTrash ? (
            <>
              <ContextMenuItem onSelect={handleRestore}>
                <ArchiveRestore className="size-4" /> Restore
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete Permanently
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onSelect={onOpen}>
                <FolderOpen className="size-4" /> Open
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setRenameOpen(true)}>
                <Pencil className="size-4" /> Rename
              </ContextMenuItem>
              {type === 'document' && (
                <ContextMenuItem onSelect={() => window.open(`/api/documents/${(item as Document).uuid}/download?token=${encodeURIComponent(token ?? '')}`, '_blank')}>
                  <Download className="size-4" /> Download
                </ContextMenuItem>
              )}
              <ContextMenuItem onSelect={() => setShareOpen(true)}>
                <Share2 className="size-4" /> Share
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setPropsOpen(true)}>
                <Settings2 className="size-4" /> Properties
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" onSelect={handleSoftDelete}>
                <Trash2 className="size-4" /> Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} type={type} id={item.id} currentName={itemName} />
      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} type={type} id={item.id} name={itemName} permanent />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} type={type} id={item.id} />
      <EditPropertiesDialog open={propsOpen} onOpenChange={setPropsOpen} type={type} item={item} />
    </>
  );
}
