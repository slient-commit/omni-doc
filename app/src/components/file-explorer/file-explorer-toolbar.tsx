import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  FolderPlus,
  Upload,
  LayoutGrid,
  List,
} from "lucide-react";
import { useCreateFolder } from "@/hooks/use-folder-queries";
import { useUploadDocument } from "@/hooks/use-document-queries";

interface FileExplorerToolbarProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  folderId: number | null;
  onSearch: (query: string) => void;
}

export function FileExplorerToolbar({
  viewMode,
  onViewModeChange,
  folderId,
  onSearch,
}: FileExplorerToolbarProps) {
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const createFolder = useCreateFolder();
  const uploadDocument = useUploadDocument();

  function handleCreateFolder() {
    if (!folderName.trim()) return;
    createFolder.mutate(
      { name: folderName.trim(), parentId: folderId },
      {
        onSuccess: () => {
          setFolderName("");
          setCreateFolderOpen(false);
        },
      }
    );
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) {
        formData.append("folderId", String(folderId));
      }
      uploadDocument.mutate(formData);
    });

    setUploadOpen(false);
    e.target.value = "";
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
            aria-label="Search files and folders"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setCreateFolderOpen(true)}
        >
          <FolderPlus className="size-4" />
          New Folder
        </Button>

        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" />
          Upload
        </Button>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value) onViewModeChange(value as "grid" | "list");
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

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
            }}
            placeholder="Folder name"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!folderName.trim() || createFolder.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Select a file to upload.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="file"
            onChange={handleFileUpload}
            multiple
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
