import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useUploadDocument } from "@/hooks/use-document-queries";
import { Loader2Icon, UploadIcon } from "lucide-react";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | number | null;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function UploadDocumentDialog({ open, onOpenChange, folderId }: UploadDocumentDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [documentDate, setDocumentDate] = useState(todayISO());
  const [isPrivate, setIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();
  // ponytail: track pending count instead of per-file state, upgrade to progress bars if needed
  const [pending, setPending] = useState(0);

  const resetForm = () => {
    setFiles([]);
    setDocumentDate(todayISO());
    setIsPrivate(false);
    setPending(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadDocument.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;

    setPending(files.length);

    const uploads = files.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentDate", documentDate);
      formData.append("isPrivate", String(isPrivate));
      if (folderId != null) formData.append("folderId", String(folderId));
      return uploadDocument.mutateAsync(formData);
    });

    Promise.allSettled(uploads).then(() => {
      resetForm();
      onOpenChange(false);
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadIcon className="size-4" />
              Upload Documents
            </DialogTitle>
            <DialogDescription>
              Select one or more files to upload.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">Files</Label>
              <Input
                ref={fileInputRef}
                id="doc-file"
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 1 && (
                <p className="text-xs text-muted-foreground">{files.length} files selected</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doc-date">Document date</Label>
              <Input
                id="doc-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="doc-private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <Label htmlFor="doc-private">Private</Label>
            </div>
          </div>

          {uploadDocument.isError && (
            <p className="mt-2 text-sm text-destructive">
              {uploadDocument.error?.message ?? "Upload failed."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!files.length || pending > 0}>
              {pending > 0 && <Loader2Icon className="size-4 animate-spin" />}
              {pending > 0 ? `Uploading (${pending})...` : `Upload${files.length > 1 ? ` (${files.length})` : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
