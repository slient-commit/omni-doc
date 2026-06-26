import { Folder as FolderIcon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { FileExplorerContextMenu } from './file-explorer-context-menu';
import { getDocumentIcon, formatFileSize, formatDate, getOwnerName } from '@/lib/formatters';
import type { Folder, Document } from '@/types/documents';

interface FileExplorerListProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick: (uuid: string) => void;
  onDocumentClick: (uuid: string) => void;
  isTrash?: boolean;
}

// ponytail: context menu wrapper is now a plain div with onContextMenu, no table DOM issues
export function FileExplorerList({
  folders, documents, onFolderClick, onDocumentClick, isTrash = false,
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
          const itemCount = (folder._count?.children ?? 0) + (folder._count?.documentFolders ?? 0);
          return (
            <FileExplorerContextMenu
              key={`f-${folder.id}`}
              item={folder}
              type="folder"
              isTrash={isTrash}
              onOpen={() => onFolderClick(folder.uuid)}
            >
              <TableRow className="cursor-pointer" onClick={() => onFolderClick(folder.uuid)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderIcon className="size-5 shrink-0 text-yellow-500" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(folder.updatedAt)}</TableCell>
                <TableCell className="text-muted-foreground">{getOwnerName(folder.createdBy)}</TableCell>
              </TableRow>
            </FileExplorerContextMenu>
          );
        })}

        {documents.map((doc) => (
          <FileExplorerContextMenu
            key={`d-${doc.id}`}
            item={doc}
            type="document"
            isTrash={isTrash}
            onOpen={() => onDocumentClick(doc.uuid)}
          >
            <TableRow className="cursor-pointer" onClick={() => onDocumentClick(doc.uuid)}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.mimeType, 'size-5 shrink-0')}
                  <span className="truncate">{doc.originalName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSize)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
              <TableCell className="text-muted-foreground">{getOwnerName(doc.createdBy)}</TableCell>
            </TableRow>
          </FileExplorerContextMenu>
        ))}
      </TableBody>
    </Table>
  );
}
