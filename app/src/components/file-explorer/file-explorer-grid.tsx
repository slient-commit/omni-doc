import { Folder as FolderIcon, FileText, FileImage, File } from "lucide-react";
import { FileExplorerContextMenu } from "./file-explorer-context-menu";
import type { Folder, Document } from "@/types/documents";

interface FileExplorerGridProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick: (id: number) => void;
  onDocumentClick: (id: number) => void;
  isTrash?: boolean;
}

function getDocumentIcon(mimeType: string | null) {
  if (!mimeType) return <File className="size-10 stroke-1 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-10 stroke-1 text-blue-500" />;
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return <FileText className="size-10 stroke-1 text-orange-500" />;
  return <File className="size-10 stroke-1 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "--";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FileExplorerGrid({
  folders,
  documents,
  onFolderClick,
  onDocumentClick,
  isTrash = false,
}: FileExplorerGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((folder) => {
        const itemCount =
          (folder._count?.children ?? 0) +
          (folder._count?.documentFolders ?? 0);

        return (
          <FileExplorerContextMenu
            key={`folder-${folder.id}`}
            item={folder}
            type="folder"
            isTrash={isTrash}
            onOpen={() => onFolderClick(folder.id)}
          >
            <button
              type="button"
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onFolderClick(folder.id)}
              onDoubleClick={() => onFolderClick(folder.id)}
            >
              <FolderIcon className="size-10 stroke-1 text-yellow-500" />
              <div className="w-full text-center">
                <p className="truncate text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </button>
          </FileExplorerContextMenu>
        );
      })}

      {documents.map((doc) => (
        <FileExplorerContextMenu
          key={`doc-${doc.id}`}
          item={doc}
          type="document"
          isTrash={isTrash}
          onOpen={() => onDocumentClick(doc.id)}
        >
          <button
            type="button"
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onDocumentClick(doc.id)}
            onDoubleClick={() => onDocumentClick(doc.id)}
          >
            {getDocumentIcon(doc.mimeType)}
            <div className="w-full text-center">
              <p className="truncate text-sm font-medium">
                {doc.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.fileSize)} &middot;{" "}
                {formatDate(doc.updatedAt)}
              </p>
            </div>
          </button>
        </FileExplorerContextMenu>
      ))}
    </div>
  );
}
