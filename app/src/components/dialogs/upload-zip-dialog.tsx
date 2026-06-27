import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useUploadZip } from "@/hooks/use-document-queries";
import { Loader2Icon, ArchiveIcon } from "lucide-react";

interface UploadZipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | number | null;
}

export function UploadZipDialog({ open, onOpenChange, folderId }: UploadZipDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowEdit, setAllowEdit] = useState(true);
  const [allowDelete, setAllowDelete] = useState(true);
  const [allowMove, setAllowMove] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadZip = useUploadZip();

  const resetForm = () => {
    setFile(null); setIsPrivate(false);
    setAllowEdit(true); setAllowDelete(true); setAllowMove(true); setAllowCopy(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadZip.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPrivate", String(isPrivate));
    formData.append("allowEdit", String(allowEdit));
    formData.append("allowDelete", String(allowDelete));
    formData.append("allowMove", String(allowMove));
    formData.append("allowCopy", String(allowCopy));
    if (folderId != null) formData.append("folderId", String(folderId));

    uploadZip.mutate(formData, {
      onSuccess: () => { resetForm(); onOpenChange(false); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArchiveIcon className="size-4" /> Upload ZIP Archive
            </DialogTitle>
            <DialogDescription>
              Upload a ZIP file to extract its contents into the current folder. All folders and files inside the ZIP will be created.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zip-file">ZIP File</Label>
              <Input
                ref={fileInputRef}
                id="zip-file"
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Separator />
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Permissions (applied to all extracted files &amp; folders)
            </Label>

            <div className="flex items-center gap-2">
              <Checkbox id="zip-private" checked={isPrivate} onCheckedChange={(c) => setIsPrivate(c === true)} />
              <Label htmlFor="zip-private">Private (only you can see)</Label>
            </div>

            <Label className="text-xs text-muted-foreground">Allow other users to:</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="zip-edit" checked={allowEdit} onCheckedChange={(c) => setAllowEdit(c === true)} />
                <Label htmlFor="zip-edit" className="text-sm font-normal">Edit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="zip-delete" checked={allowDelete} onCheckedChange={(c) => setAllowDelete(c === true)} />
                <Label htmlFor="zip-delete" className="text-sm font-normal">Delete</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="zip-move" checked={allowMove} onCheckedChange={(c) => setAllowMove(c === true)} />
                <Label htmlFor="zip-move" className="text-sm font-normal">Move</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="zip-copy" checked={allowCopy} onCheckedChange={(c) => setAllowCopy(c === true)} />
                <Label htmlFor="zip-copy" className="text-sm font-normal">Copy</Label>
              </div>
            </div>
          </div>

          {uploadZip.isError && (
            <p className="mt-2 text-sm text-destructive">{uploadZip.error?.message ?? "Upload failed."}</p>
          )}

          {uploadZip.isSuccess && (
            <p className="mt-2 text-sm text-green-600">
              {(uploadZip.data as any)?.message}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!file || uploadZip.isPending}>
              {uploadZip.isPending && <Loader2Icon className="size-4 animate-spin" />}
              {uploadZip.isPending ? 'Extracting...' : 'Upload & Extract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
