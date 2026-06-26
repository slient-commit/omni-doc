import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTrash, useEmptyTrash } from "@/hooks/use-trash-queries";
import { FileExplorerGrid } from "@/components/file-explorer/file-explorer-grid";
import { FileExplorerList } from "@/components/file-explorer/file-explorer-list";
import { FileExplorerEmpty } from "@/components/file-explorer/file-explorer-empty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function TrashPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useTrash();
  const emptyTrash = useEmptyTrash();

  const folders = data?.folders ?? [];
  const documents = data?.documents ?? [];

  const filteredFolders = useMemo(() => {
    if (!search) return folders;
    const q = search.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, search]);

  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.originalName.toLowerCase().includes(q));
  }, [documents, search]);

  const isEmpty = filteredFolders.length === 0 && filteredDocuments.length === 0;
  const hasTrashItems = folders.length > 0 || documents.length > 0;

  function handleEmptyTrash() {
    emptyTrash.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
    });
  }

  function handleDocumentClick(uuid: string) {
    navigate(`/documents/${uuid}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trash..."
            className="pl-8"
            aria-label="Search trash"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {hasTrashItems && (
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Empty Trash
          </Button>
        )}

        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value: string[]) => {
            const next = value.find((v) => v !== viewMode);
            if (next) setViewMode(next as "grid" | "list");
          }}
          variant="outline"
          spacing={0}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <Trash2 className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Trash</h1>
          <p className="text-sm text-muted-foreground">
            Items in trash will be permanently deleted after 30 days.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <FileExplorerEmpty
          message={
            search ? "No trashed items match your search." : "Trash is empty."
          }
        />
      ) : viewMode === "grid" ? (
        <FileExplorerGrid
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={() => {}}
          onDocumentClick={handleDocumentClick}
          isTrash
        />
      ) : (
        <FileExplorerList
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={() => {}}
          onDocumentClick={handleDocumentClick}
          isTrash
        />
      )}

      {/* Empty Trash Confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Empty Trash
            </DialogTitle>
            <DialogDescription>
              This action is <strong>irreversible</strong>. All items in the
              trash will be permanently deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          {emptyTrash.isError && (
            <p className="text-sm text-destructive" aria-live="assertive">
              {emptyTrash.error?.message ?? "Failed to empty trash."}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmptyTrash}
              disabled={emptyTrash.isPending}
            >
              {emptyTrash.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
