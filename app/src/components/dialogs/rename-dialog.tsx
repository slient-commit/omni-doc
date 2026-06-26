import { useEffect, useState } from "react";
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
import { useRenameFolder } from "@/hooks/use-folder-queries";
import { useUpdateDocument } from "@/hooks/use-document-queries";
import { Loader2Icon, PencilIcon } from "lucide-react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "folder" | "document";
  id: number | string;
  currentName: string;
}

export function RenameDialog({
  open,
  onOpenChange,
  type,
  id,
  currentName,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const renameFolder = useRenameFolder();
  const updateDocument = useUpdateDocument();

  const mutation = type === "folder" ? renameFolder : updateDocument;

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;

    if (type === "folder") {
      renameFolder.mutate(
        { id, name: name.trim() },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      updateDocument.mutate(
        { id, originalName: name.trim() },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) mutation.reset();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilIcon className="size-4" />
              Rename {type === "folder" ? "Folder" : "Document"}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for this {type}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {mutation.isError && (
            <p className="mt-2 text-sm text-destructive">
              {mutation.error?.message ?? "Rename failed."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                name.trim() === currentName ||
                mutation.isPending
              }
            >
              {mutation.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
