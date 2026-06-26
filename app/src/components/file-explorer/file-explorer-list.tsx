import {
  Folder as FolderIcon,
  FileText,
  FileImage,
  File,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FileExplorerContextMenu } from "./file-explorer-context-menu";
import type { Folder, Document } from "@/types/documents";

interface FileExplorerListProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick: (id: number) => void;
  onDocumentClick: (id: number) => void;
  isTrash?: boolean;
}

function getDocumentIcon(mimeType: string | null) {
  if (!mimeType)
    return <File className="size-5 shrink-0 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-5 shrink-0 text-blue-500" />;
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return <FileText className="size-5 shrink-0 text-orange-500" />;
  return <File className="size-5 shrink-0 text-muted-foreground" />;
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

function getOwnerName(
  createdBy?: { firstName: string; lastName: string }
): string {
  if (!createdBy) return "--";
  return `${createdBy.firstName} ${createdBy.lastName}`;
}

export function FileExplorerList({
  folders,
  documents,
  onFolderClick,
  onDocumentClick,
  isTrash = false,
}: FileExplorerListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="w-24">Size</TableHead>
          <TableHead className="w-36">Date Modified</TableHead>
          <TableHead className="w-36">Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
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
              <TableRow
                className="cursor-pointer"
                onClick={() => onFolderClick(folder.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderIcon className="size-5 shrink-0 text-yellow-500" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(folder.updatedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getOwnerName(folder.createdBy)}
                </TableCell>
              </TableRow>
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
            <TableRow
              className="cursor-pointer"
              onClick={() => onDocumentClick(doc.id)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.mimeType)}
                  <span className="truncate">{doc.originalName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatFileSize(doc.fileSize)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(doc.updatedAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getOwnerName(doc.createdBy)}
              </TableCell>
            </TableRow>
          </FileExplorerContextMenu>
        ))}
      </TableBody>
    </Table>
  );
}
