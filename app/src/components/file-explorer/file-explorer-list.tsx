import { useState } from 'react';
import { Folder as FolderIcon } from 'lucide-react';
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  FolderOpen, Pencil, Download, Share2, Trash2,
  ArchiveRestore, Settings2,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { RenameDialog } from '@/components/dialogs/rename-dialog';
import { ConfirmDeleteDialog } from '@/components/dialogs/confirm-delete-dialog';
import { ShareDialog } from '@/components/dialogs/share-dialog';
import { EditPropertiesDialog } from '@/components/dialogs/edit-properties-dialog';
import { useDeleteFolder, useRestoreFolder } from '@/hooks/use-folder-queries';
import { useDeleteDocument, useRestoreDocument } from '@/hooks/use-document-queries';
import { getDocumentIcon, formatFileSize, formatDate, getOwnerName } from '@/lib/formatters';
import type { Folder, Document } from '@/types/documents';

interface FileExplorerListProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick: (id: number) => void;
  onDocumentClick: (id: number) => void;
  isTrash?: boolean;
}

// ponytail: inline context menu per row to avoid breaking table DOM structure
function ListRow({
  item, type, isTrash, onClick,
}: {
  item: Folder | Document;
  type: 'folder' | 'document';
  isTrash: boolean;
  onClick: () => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);

  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const restoreFolder = useRestoreFolder();
  const restoreDocument = useRestoreDocument();

  const isFolder = type === 'folder';
  const folder = isFolder ? (item as Folder) : null;
  const doc = !isFolder ? (item as Document) : null;
  const name = isFolder ? folder!.name : doc!.originalName;
  const itemCount = folder ? (folder._count?.children ?? 0) + (folder._count?.documentFolders ?? 0) : 0;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger render={<tr />} className="cursor-pointer border-b transition-colors hover:bg-muted/50" onClick={onClick}>
          <TableCell>
            <div className="flex items-center gap-2">
              {isFolder
                ? <FolderIcon className="size-5 shrink-0 text-yellow-500" />
                : getDocumentIcon(doc!.mimeType, 'size-5 shrink-0')}
              <span className="truncate">{name}</span>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground">
            {isFolder ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : formatFileSize(doc!.fileSize)}
          </TableCell>
          <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
          <TableCell className="text-muted-foreground">
            {getOwnerName(item.createdBy)}
          </TableCell>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isTrash ? (
            <>
              <ContextMenuItem onSelect={() => (isFolder ? restoreFolder : restoreDocument).mutate(item.id)}>
                <ArchiveRestore className="size-4" /> Restore
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete Permanently
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onSelect={onClick}>
                <FolderOpen className="size-4" /> Open
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setRenameOpen(true)}>
                <Pencil className="size-4" /> Rename
              </ContextMenuItem>
              {!isFolder && (
                <ContextMenuItem onSelect={() => window.open(`/api/documents/${item.id}/download`, '_blank')}>
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
              <ContextMenuItem variant="destructive" onSelect={() => (isFolder ? deleteFolder : deleteDocument).mutate(item.id)}>
                <Trash2 className="size-4" /> Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} type={type} id={item.id} currentName={name} />
      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} type={type} id={item.id} name={name} permanent />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} type={type} id={item.id} />
      <EditPropertiesDialog open={propsOpen} onOpenChange={setPropsOpen} type={type} item={item} />
    </>
  );
}

export function FileExplorerList({
  folders, documents, onFolderClick, onDocumentClick, isTrash = false,
}: FileExplorerListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="w-24">Size</TableHead>
          <TableHead className="w-36">Date Modified</TableHead>
          <TableHead className="w-36">Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {folders.map((folder) => (
          <ListRow key={`f-${folder.id}`} item={folder} type="folder" isTrash={isTrash} onClick={() => onFolderClick(folder.id)} />
        ))}
        {documents.map((doc) => (
          <ListRow key={`d-${doc.id}`} item={doc} type="document" isTrash={isTrash} onClick={() => onDocumentClick(doc.id)} />
        ))}
      </TableBody>
    </Table>
  );
}
