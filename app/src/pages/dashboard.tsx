import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { FileExplorerToolbar } from "@/components/file-explorer/file-explorer-toolbar";
import { FileExplorerBreadcrumb } from "@/components/file-explorer/file-explorer-breadcrumb";
import { FileExplorerGrid } from "@/components/file-explorer/file-explorer-grid";
import { FileExplorerList } from "@/components/file-explorer/file-explorer-list";
import { FileExplorerEmpty } from "@/components/file-explorer/file-explorer-empty";
import { CreateFolderDialog } from "@/components/dialogs/create-folder-dialog";
import { UploadDocumentDialog } from "@/components/dialogs/upload-document-dialog";
import { EditPropertiesDialog } from "@/components/dialogs/edit-properties-dialog";
import { useFolders, useFolder } from "@/hooks/use-folder-queries";
import { useDocuments } from "@/hooks/use-document-queries";
import { useMyPermissions } from "@/hooks/use-role-queries";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, ArrowLeft, FolderPlus, Upload, Settings2 } from "lucide-react";

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get("folderId") || null;
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  // Background context menu state
  const [bgMenuPos, setBgMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderPropsOpen, setFolderPropsOpen] = useState(false);
  const bgMenuRef = useRef<HTMLDivElement>(null);

  // Permissions
  const { data: myPerms } = useMyPermissions();
  const hasPerm = (action: string, subject: string) => myPerms?.some((p) => p.action === action && p.subject === subject) ?? false;
  const canCreateFolder = hasPerm('create', 'folder');
  const canCreateDocument = hasPerm('create', 'document');

  // Folder check
  const { data: currentFolder, isError: folderError, isLoading: folderChecking } = useFolder(folderId ?? "");

  const { data: folders = [], isLoading: foldersLoading } = useFolders(folderId);
  const { data: documents = [], isLoading: documentsLoading } = useDocuments({ folderId });

  const isLoading = folderId ? folderChecking : (foldersLoading || documentsLoading);

  const isOwnerOfFolder = currentFolder && currentFolder.createdById === user?.id;
  const canEditFolder = isOwnerOfFolder || (currentFolder?.allowEdit && hasPerm('update', 'folder'));

  const filteredFolders = useMemo(() => {
    if (!search) return folders;
    const q = search.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, search]);

  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.originalName.toLowerCase().includes(q));
  }, [documents, search]);

  const isEmpty = filteredFolders.length === 0 && filteredDocuments.length === 0;

  function handleNavigateFolder(uuid: string | null) {
    if (uuid === null) setSearchParams({});
    else setSearchParams({ folderId: uuid });
  }

  function handleDocumentClick(uuid: string) {
    navigate(`/documents/${uuid}`);
  }

  // Background context menu
  const handleBgContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger on the background, not on items
    if ((e.target as HTMLElement).closest('[data-item]')) return;
    e.preventDefault();
    setBgMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeBgMenu = useCallback(() => setBgMenuPos(null), []);

  useEffect(() => {
    if (!bgMenuPos) return;
    const handleClick = () => closeBgMenu();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeBgMenu(); };
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', closeBgMenu);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', closeBgMenu);
      document.removeEventListener('keydown', handleKey);
    };
  }, [bgMenuPos, closeBgMenu]);

  function bgMenuItem(icon: React.ReactNode, label: string, onClick: () => void) {
    return (
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        onClick={(e) => { e.stopPropagation(); closeBgMenu(); onClick(); }}
      >
        {icon}
        {label}
      </button>
    );
  }

  if (folderId && folderError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-muted-foreground/50" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have permission to view this folder, or it doesn't exist.
          </p>
        </div>
        <Button variant="outline" onClick={() => handleNavigateFolder(null)}>
          <ArrowLeft className="size-4" /> Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4" onContextMenu={handleBgContextMenu}>
      <FileExplorerToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        folderId={folderId}
        onSearch={setSearch}
      />

      <FileExplorerBreadcrumb
        folderId={folderId}
        onNavigate={handleNavigateFolder}
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <FileExplorerEmpty
          message={
            search
              ? "No items match your search."
              : "This folder is empty. Create a folder or upload a document to get started."
          }
        />
      ) : viewMode === "grid" ? (
        <FileExplorerGrid
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={handleNavigateFolder}
          onDocumentClick={handleDocumentClick}
          currentFolderId={folderId}
        />
      ) : (
        <FileExplorerList
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={handleNavigateFolder}
          onDocumentClick={handleDocumentClick}
          currentFolderId={folderId}
        />
      )}

      {/* Background context menu */}
      {bgMenuPos && (canCreateFolder || canCreateDocument || (folderId && canEditFolder)) && (
        <div
          ref={bgMenuRef}
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          style={{ left: bgMenuPos.x, top: bgMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {canCreateFolder && bgMenuItem(<FolderPlus className="size-4" />, 'New Folder', () => setCreateFolderOpen(true))}
          {canCreateDocument && bgMenuItem(<Upload className="size-4" />, 'Upload File', () => setUploadOpen(true))}
          {folderId && currentFolder && (
            <>
              <div className="my-1 h-px bg-border" />
              {bgMenuItem(
                <Settings2 className="size-4" />,
                canEditFolder ? 'Folder Properties' : 'Folder Details',
                () => setFolderPropsOpen(true),
              )}
            </>
          )}
        </div>
      )}

      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} parentId={folderId} />
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} folderId={folderId} />
      {folderId && currentFolder && (
        <EditPropertiesDialog open={folderPropsOpen} onOpenChange={setFolderPropsOpen} type="folder" item={currentFolder} />
      )}
    </div>
  );
}
