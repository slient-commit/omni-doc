import { useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useUploadDocument } from "@/hooks/use-document-queries";
import { Loader2Icon, UploadIcon } from "lucide-react";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: number | null;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  folderId,
}: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentDate, setDocumentDate] = useState(todayISO());
  const [isPrivate, setIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();

  const resetForm = () => {
    setFile(null);
    setDocumentDate(todayISO());
    setIsPrivate(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadDocument.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentDate", documentDate);
    formData.append("isPrivate", String(isPrivate));
    if (folderId != null) {
      formData.append("folderId", String(folderId));
    }

    uploadDocument.mutate(formData, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
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
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Select a file and set its metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">File</Label>
              <Input
                ref={fileInputRef}
                id="doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
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
              <Label htmlFor="doc-private">Private document</Label>
            </div>
          </div>

          {uploadDocument.isError && (
            <p className="mt-2 text-sm text-destructive">
              {uploadDocument.error?.message ?? "Upload failed."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={!file || uploadDocument.isPending}
            >
              {uploadDocument.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
