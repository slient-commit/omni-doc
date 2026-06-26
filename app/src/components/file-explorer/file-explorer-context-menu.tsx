import { type ReactNode, useState } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Pencil,
  Download,
  Share2,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import { useDeleteFolder, useRenameFolder, useRestoreFolder, usePermanentDeleteFolder } from "@/hooks/use-folder-queries";
import { useDeleteDocument, useUpdateDocument, useRestoreDocument, usePermanentDeleteDocument } from "@/hooks/use-document-queries";
import { ShareDialog } from "@/components/dialogs/share-dialog";
import type { Folder, Document } from "@/types/documents";

interface FileExplorerContextMenuProps {
  children: ReactNode;
  item: Folder | Document;
  type: "folder" | "document";
  isTrash?: boolean;
  onOpen?: () => void;
}

export function FileExplorerContextMenu({
  children,
  item,
  type,
  isTrash = false,
  onOpen,
}: FileExplorerContextMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const renameFolder = useRenameFolder();
  const updateDocument = useUpdateDocument();
  const restoreFolder = useRestoreFolder();
  const restoreDocument = useRestoreDocument();
  const permanentDeleteFolder = usePermanentDeleteFolder();
  const permanentDeleteDocument = usePermanentDeleteDocument();

  const itemName = type === "folder" ? (item as Folder).name : (item as Document).originalName;

  function handleRenameOpen() {
    setRenameValue(itemName);
    setRenameOpen(true);
  }

  function handleRename() {
    if (!renameValue.trim()) return;
    if (type === "folder") {
      renameFolder.mutate({ id: item.id, name: renameValue.trim() });
    } else {
      updateDocument.mutate({ id: item.id, originalName: renameValue.trim() });
    }
    setRenameOpen(false);
  }

  function handleSoftDelete() {
    if (type === "folder") {
      deleteFolder.mutate(item.id);
    } else {
      deleteDocument.mutate(item.id);
    }
  }

  function handleRestore() {
    if (type === "folder") {
      restoreFolder.mutate(item.id);
    } else {
      restoreDocument.mutate(item.id);
    }
  }

  function handlePermanentDelete() {
    if (type === "folder") {
      permanentDeleteFolder.mutate(item.id);
    } else {
      permanentDeleteDocument.mutate(item.id);
    }
    setDeleteOpen(false);
  }

  function handleDownload() {
    if (type === "document") {
      window.open(`/api/documents/${item.id}/download`, "_blank");
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          {isTrash ? (
            <>
              <ContextMenuItem onSelect={handleRestore}>
                <ArchiveRestore className="size-4" />
                Restore
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete Permanently
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onSelect={onOpen}>
                <FolderOpen className="size-4" />
                Open
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={handleRenameOpen}>
                <Pencil className="size-4" />
                Rename
              </ContextMenuItem>
              {type === "document" && (
                <ContextMenuItem onSelect={handleDownload}>
                  <Download className="size-4" />
                  Download
                </ContextMenuItem>
              )}
              <ContextMenuItem onSelect={() => setShareOpen(true)}>
                <Share2 className="size-4" />
                Share
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onSelect={handleSoftDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {type === "folder" ? "Folder" : "Document"}</DialogTitle>
            <DialogDescription>
              Enter a new name for this {type}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            placeholder="New name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Permanent Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{itemName}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePermanentDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        type={type}
        id={item.id}
      />
    </>
  );
}
