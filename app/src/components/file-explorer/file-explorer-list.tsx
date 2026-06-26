import { useState, useCallback } from 'react';
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
import { useAuth } from '@/contexts/auth-context';
import { getDocumentIcon, formatFileSize, formatDate, getOwnerName } from '@/lib/formatters';
import type { Folder, Document } from '@/types/documents';

interface FileExplorerListProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick: (uuid: string) => void;
  onDocumentClick: (uuid: string) => void;
  isTrash?: boolean;
}

type ContextTarget = { item: Folder | Document; type: 'folder' | 'document'; onClick: () => void } | null;

export function FileExplorerList({
  folders, documents, onFolderClick, onDocumentClick, isTrash = false,
}: FileExplorerListProps) {
  const [target, setTarget] = useState<ContextTarget>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  // ponytail: single shared context menu triggered via native onContextMenu + hidden ContextMenuTrigger
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { token } = useAuth();
  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const restoreFolder = useRestoreFolder();
  const restoreDocument = useRestoreDocument();

  const handleContextMenu = useCallback((e: React.MouseEvent, item: Folder | Document, type: 'folder' | 'document', onClick: () => void) => {
    e.preventDefault();
    setTarget({ item, type, onClick });
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const itemName = target
    ? target.type === 'folder' ? (target.item as Folder).name : (target.item as Document).originalName
    : '';

  return (
    <>
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
          {folders.map((folder) => {
            const itemCount = (folder._count?.children ?? 0) + (folder._count?.documentFolders ?? 0);
            return (
              <TableRow
                key={`f-${folder.id}`}
                className="cursor-pointer"
                onClick={() => onFolderClick(folder.uuid)}
                onContextMenu={(e) => handleContextMenu(e, folder, 'folder', () => onFolderClick(folder.uuid))}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderIcon className="size-5 shrink-0 text-yellow-500" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(folder.updatedAt)}</TableCell>
                <TableCell className="text-muted-foreground">{getOwnerName(folder.createdBy)}</TableCell>
              </TableRow>
            );
          })}

          {documents.map((doc) => (
            <TableRow
              key={`d-${doc.id}`}
              className="cursor-pointer"
              onClick={() => onDocumentClick(doc.uuid)}
              onContextMenu={(e) => handleContextMenu(e, doc, 'document', () => onDocumentClick(doc.uuid))}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.mimeType, 'size-5 shrink-0')}
                  <span className="truncate">{doc.originalName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSize)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
              <TableCell className="text-muted-foreground">{getOwnerName(doc.createdBy)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Floating context menu positioned at click coordinates */}
      {menuOpen && menuPos && target && (
        <div style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 50 }}>
          <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <ContextMenuTrigger style={{ position: 'absolute', width: 1, height: 1 }} />
            <ContextMenuContent>
              {isTrash ? (
                <>
                  <ContextMenuItem onSelect={() => (target.type === 'folder' ? restoreFolder : restoreDocument).mutate(target.item.id)}>
                    <ArchiveRestore className="size-4" /> Restore
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" /> Delete Permanently
                  </ContextMenuItem>
                </>
              ) : (
                <>
                  <ContextMenuItem onSelect={target.onClick}>
                    <FolderOpen className="size-4" /> Open
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => setRenameOpen(true)}>
                    <Pencil className="size-4" /> Rename
                  </ContextMenuItem>
                  {target.type === 'document' && (
                    <ContextMenuItem onSelect={() => window.open(`/api/documents/${(target.item as Document).uuid}/download?token=${encodeURIComponent(token ?? '')}`, '_blank')}>
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
                  <ContextMenuItem variant="destructive" onSelect={() => (target.type === 'folder' ? deleteFolder : deleteDocument).mutate(target.item.id)}>
                    <Trash2 className="size-4" /> Delete
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}

      {/* Dialogs */}
      {target && (
        <>
          <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} type={target.type} id={target.item.id} currentName={itemName} />
          <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} type={target.type} id={target.item.id} name={itemName} permanent />
          <ShareDialog open={shareOpen} onOpenChange={setShareOpen} type={target.type} id={target.item.id} />
          <EditPropertiesDialog open={propsOpen} onOpenChange={setPropsOpen} type={target.type} item={target.item} />
        </>
      )}
    </>
  );
}
