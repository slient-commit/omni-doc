import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFolder } from "@/hooks/use-folder-queries";
import { FolderPlusIcon, Loader2Icon } from "lucide-react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: number | null;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentId,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const createFolder = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createFolder.mutate(
      { name: name.trim(), parentId: parentId ?? null },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName("");
      createFolder.reset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlusIcon className="size-4" />
              Create Folder
            </DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My folder"
              autoFocus
            />
          </div>

          {createFolder.isError && (
            <p className="mt-2 text-sm text-destructive">
              {createFolder.error?.message ?? "Failed to create folder."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={!name.trim() || createFolder.isPending}
            >
              {createFolder.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
