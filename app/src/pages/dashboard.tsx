import { FolderOpen, FolderPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <FolderOpen className="h-16 w-16 text-muted-foreground/70" />
      <div>
        <h2 className="text-lg font-semibold">Welcome to omni-doc</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your document workspace is ready. Start by creating a folder or uploading a document.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
    </div>
  );
}
