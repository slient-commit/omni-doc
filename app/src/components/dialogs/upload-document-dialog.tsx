import { useRef, useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useUploadDocument } from "@/hooks/use-document-queries";
import { Loader2Icon, UploadIcon } from "lucide-react";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | number | null;
  initialFiles?: File[];
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function UploadDocumentDialog({ open, onOpenChange, folderId, initialFiles }: UploadDocumentDialogProps) {
  const [files, setFiles] = useState<File[]>(initialFiles ?? []);
  const [documentDate, setDocumentDate] = useState(todayISO());
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowEdit, setAllowEdit] = useState(true);
  const [allowDelete, setAllowDelete] = useState(true);
  const [allowMove, setAllowMove] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();
  const [pending, setPending] = useState(0);

  // ponytail: sync dropped files when dialog opens with initialFiles
  useEffect(() => {
    if (initialFiles?.length) setFiles(initialFiles);
  }, [initialFiles]);

  const resetForm = () => {
    setFiles([]); setDocumentDate(todayISO()); setIsPrivate(false);
    setAllowEdit(true); setAllowDelete(true); setAllowMove(true); setAllowCopy(true);
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
      formData.append("allowEdit", String(allowEdit));
      formData.append("allowDelete", String(allowDelete));
      formData.append("allowMove", String(allowMove));
      formData.append("allowCopy", String(allowCopy));
      if (folderId != null) formData.append("folderId", String(folderId));
      return uploadDocument.mutateAsync(formData);
    });

    Promise.allSettled(uploads).then(() => {
      resetForm();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadIcon className="size-4" /> Upload Documents
            </DialogTitle>
            <DialogDescription>Select one or more files to upload.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">Files</Label>
              <Input ref={fileInputRef} id="doc-file" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
              {files.length > 1 && <p className="text-xs text-muted-foreground">{files.length} files selected</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doc-date">Document date</Label>
              <Input id="doc-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
            </div>

            <Separator />
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permissions</Label>

            <div className="flex items-center gap-2">
              <Checkbox id="doc-private" checked={isPrivate} onCheckedChange={(c) => setIsPrivate(c === true)} />
              <Label htmlFor="doc-private">Private (only you can see)</Label>
            </div>

            <Label className="text-xs text-muted-foreground">Allow other users to:</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="ud-edit" checked={allowEdit} onCheckedChange={(c) => setAllowEdit(c === true)} />
                <Label htmlFor="ud-edit" className="text-sm font-normal">Edit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ud-delete" checked={allowDelete} onCheckedChange={(c) => setAllowDelete(c === true)} />
                <Label htmlFor="ud-delete" className="text-sm font-normal">Delete</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ud-move" checked={allowMove} onCheckedChange={(c) => setAllowMove(c === true)} />
                <Label htmlFor="ud-move" className="text-sm font-normal">Move</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ud-copy" checked={allowCopy} onCheckedChange={(c) => setAllowCopy(c === true)} />
                <Label htmlFor="ud-copy" className="text-sm font-normal">Copy</Label>
              </div>
            </div>
          </div>

          {uploadDocument.isError && (
            <p className="mt-2 text-sm text-destructive">{uploadDocument.error?.message ?? "Upload failed."}</p>
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
