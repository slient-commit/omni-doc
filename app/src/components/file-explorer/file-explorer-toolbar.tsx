import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CreateFolderDialog } from '@/components/dialogs/create-folder-dialog';
import { UploadDocumentDialog } from '@/components/dialogs/upload-document-dialog';
import { UploadZipDialog } from '@/components/dialogs/upload-zip-dialog';
import { useMyPermissions } from '@/hooks/use-role-queries';
import { Search, FolderPlus, Upload, LayoutGrid, List, Archive } from 'lucide-react';

interface FileExplorerToolbarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  folderId: string | null;
  onSearch: (query: string) => void;
}

export function FileExplorerToolbar({
  viewMode, onViewModeChange, folderId, onSearch,
}: FileExplorerToolbarProps) {
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [zipOpen, setZipOpen] = useState(false);
  const { data: myPerms } = useMyPermissions();
  const canCreateFolder = myPerms?.some((p) => p.action === 'create' && p.subject === 'folder') ?? false;
  const canCreateDocument = myPerms?.some((p) => p.action === 'create' && p.subject === 'document') ?? false;
  const canUploadZip = canCreateFolder && canCreateDocument;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8" aria-label="Search files and folders" onChange={(e) => onSearch(e.target.value)} />
        </div>

        {canCreateFolder && (
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="size-4" /> New Folder
          </Button>
        )}

        {canCreateDocument && (
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" /> Upload
          </Button>
        )}

        {canUploadZip && (
          <Button variant="outline" onClick={() => setZipOpen(true)}>
            <Archive className="size-4" /> Upload ZIP
          </Button>
        )}

        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value: string[]) => {
            const next = value.find((v) => v !== viewMode);
            if (next) onViewModeChange(next as 'grid' | 'list');
          }}
          variant="outline"
          spacing={0}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} parentId={folderId} />
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} folderId={folderId} />
      <UploadZipDialog open={zipOpen} onOpenChange={setZipOpen} folderId={folderId} />
    </>
  );
}
