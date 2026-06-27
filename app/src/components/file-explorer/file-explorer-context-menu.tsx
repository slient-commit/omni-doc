import { type ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { FolderOpen, Pencil, Download, Share2, Trash2, ArchiveRestore, Settings2, FolderInput, Copy } from 'lucide-react';
import { useDeleteFolder, useRestoreFolder } from '@/hooks/use-folder-queries';
import { useDeleteDocument, useRestoreDocument } from '@/hooks/use-document-queries';
import { RenameDialog } from '@/components/dialogs/rename-dialog';
import { ConfirmDeleteDialog } from '@/components/dialogs/confirm-delete-dialog';
import { ShareDialog } from '@/components/dialogs/share-dialog';
import { EditPropertiesDialog } from '@/components/dialogs/edit-properties-dialog';
import { MoveDialog } from '@/components/dialogs/move-dialog';
import { useAuth } from '@/contexts/auth-context';
import type { Folder, Document } from '@/types/documents';

interface FileExplorerContextMenuProps {
  children: ReactNode;
  item: Folder | Document;
  type: 'folder' | 'document';
  isTrash?: boolean;
  onOpen?: () => void;
}

// ponytail: native onContextMenu + absolute-positioned menu div
// avoids base-ui ContextMenu component which breaks in various layouts
export function FileExplorerContextMenu({
  children, item, type, isTrash = false, onOpen,
}: FileExplorerContextMenuProps) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const restoreFolder = useRestoreFolder();
  const restoreDocument = useRestoreDocument();

  const itemName = type === 'folder' ? (item as Folder).name : (item as Document).originalName;
  const uuid = item.uuid;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  // Close on any click, right-click elsewhere, or escape
  useEffect(() => {
    if (!menuPos) return;
    const handleClick = () => closeMenu();
    const handleContext = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuPos, closeMenu]);

  function menuItem(icon: ReactNode, label: string, onClick: () => void, destructive = false) {
    return (
      <button
        type="button"
        className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${destructive ? 'text-destructive hover:text-destructive' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          closeMenu();
          onClick();
        }}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      {menuPos && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          style={{ left: menuPos.x, top: menuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {isTrash ? (
            <>
              {menuItem(<ArchiveRestore className="size-4" />, 'Restore', () => {
                if (type === 'folder') restoreFolder.mutate(uuid);
                else restoreDocument.mutate(uuid);
              })}
              <div className="my-1 h-px bg-border" />
              {menuItem(<Trash2 className="size-4" />, 'Delete Permanently', () => setDeleteOpen(true), true)}
            </>
          ) : (
            <>
              {menuItem(<FolderOpen className="size-4" />, 'Open', () => onOpen?.())}
              <div className="my-1 h-px bg-border" />
              {menuItem(<Pencil className="size-4" />, 'Rename', () => setRenameOpen(true))}
              {type === 'document' && menuItem(
                <Download className="size-4" />, 'Download',
                () => window.open(`/api/documents/${uuid}/download?token=${encodeURIComponent(token ?? '')}`, '_blank'),
              )}
              {menuItem(<FolderInput className="size-4" />, 'Move to', () => setMoveOpen(true))}
              {menuItem(<Copy className="size-4" />, 'Copy to', () => setCopyOpen(true))}
              {menuItem(<Share2 className="size-4" />, 'Share', () => setShareOpen(true))}
              {menuItem(<Settings2 className="size-4" />, 'Properties', () => setPropsOpen(true))}
              <div className="my-1 h-px bg-border" />
              {menuItem(<Trash2 className="size-4" />, 'Delete', () => {
                if (type === 'folder') deleteFolder.mutate(uuid);
                else deleteDocument.mutate(uuid);
              }, true)}
            </>
          )}
        </div>
      )}

      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} type={type} id={uuid} currentName={itemName} />
      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} type={type} id={uuid} name={itemName} permanent />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} type={type} id={uuid} />
      <EditPropertiesDialog open={propsOpen} onOpenChange={setPropsOpen} type={type} item={item} />
      <MoveDialog open={moveOpen} onOpenChange={setMoveOpen} mode="move" type={type} itemId={uuid} itemName={itemName} />
      <MoveDialog open={copyOpen} onOpenChange={setCopyOpen} mode="copy" type={type} itemId={uuid} itemName={itemName} />
    </>
  );
}
