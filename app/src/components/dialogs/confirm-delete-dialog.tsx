import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  usePermanentDeleteFolder,
  useDeleteFolder,
} from "@/hooks/use-folder-queries";
import {
  usePermanentDeleteDocument,
  useDeleteDocument,
} from "@/hooks/use-document-queries";
import { Loader2Icon, Trash2Icon, AlertTriangleIcon } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "folder" | "document";
  id: number | string;
  name: string;
  permanent?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  type,
  id,
  name,
  permanent = false,
}: ConfirmDeleteDialogProps) {
  const deleteFolder = useDeleteFolder();
  const deleteDocument = useDeleteDocument();
  const permanentDeleteFolder = usePermanentDeleteFolder();
  const permanentDeleteDocument = usePermanentDeleteDocument();

  const mutation = permanent
    ? type === "folder"
      ? permanentDeleteFolder
      : permanentDeleteDocument
    : type === "folder"
      ? deleteFolder
      : deleteDocument;

  const handleConfirm = () => {
    mutation.mutate(id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) mutation.reset();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {permanent ? (
              <AlertTriangleIcon className="size-4 text-destructive" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            {permanent ? "Permanently Delete" : "Delete"}{" "}
            {type === "folder" ? "Folder" : "Document"}
          </DialogTitle>
          <DialogDescription>
            {permanent ? (
              <>
                This action is <strong>irreversible</strong>. The {type}{" "}
                <strong>{name}</strong> will be permanently deleted and cannot be
                recovered.
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <strong>{name}</strong>? It will be moved to the trash.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            {mutation.error?.message ?? "Delete failed."}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            {permanent ? "Delete permanently" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
