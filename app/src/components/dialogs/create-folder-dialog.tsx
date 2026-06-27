import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCreateFolder } from "@/hooks/use-folder-queries";
import { FolderPlusIcon, Loader2Icon } from "lucide-react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | number | null;
}

export function CreateFolderDialog({ open, onOpenChange, parentId }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowEdit, setAllowEdit] = useState(true);
  const [allowDelete, setAllowDelete] = useState(true);
  const [allowMove, setAllowMove] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const createFolder = useCreateFolder();

  const reset = () => {
    setName(""); setIsPrivate(false);
    setAllowEdit(true); setAllowDelete(true); setAllowMove(true); setAllowCopy(true);
    createFolder.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createFolder.mutate(
      { name: name.trim(), parentId: parentId ?? null, isPrivate, allowEdit, allowDelete, allowMove, allowCopy },
      { onSuccess: () => { reset(); onOpenChange(false); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlusIcon className="size-4" /> Create Folder
            </DialogTitle>
            <DialogDescription>Enter a name for the new folder.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input id="folder-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My folder" autoFocus />
            </div>

            <Separator />
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permissions</Label>

            <div className="flex items-center gap-2">
              <Checkbox id="folder-private" checked={isPrivate} onCheckedChange={(c) => setIsPrivate(c === true)} />
              <Label htmlFor="folder-private">Private (only you can see this folder)</Label>
            </div>

            <Label className="text-xs text-muted-foreground">Allow other users to:</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="cf-edit" checked={allowEdit} onCheckedChange={(c) => setAllowEdit(c === true)} />
                <Label htmlFor="cf-edit" className="text-sm font-normal">Edit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cf-delete" checked={allowDelete} onCheckedChange={(c) => setAllowDelete(c === true)} />
                <Label htmlFor="cf-delete" className="text-sm font-normal">Delete</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cf-move" checked={allowMove} onCheckedChange={(c) => setAllowMove(c === true)} />
                <Label htmlFor="cf-move" className="text-sm font-normal">Move</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cf-copy" checked={allowCopy} onCheckedChange={(c) => setAllowCopy(c === true)} />
                <Label htmlFor="cf-copy" className="text-sm font-normal">Copy</Label>
              </div>
            </div>
          </div>

          {createFolder.isError && (
            <p className="mt-2 text-sm text-destructive">{createFolder.error?.message ?? "Failed to create folder."}</p>
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!name.trim() || createFolder.isPending}>
              {createFolder.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
