import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { FileExplorerToolbar } from "@/components/file-explorer/file-explorer-toolbar";
import { FileExplorerBreadcrumb } from "@/components/file-explorer/file-explorer-breadcrumb";
import { FileExplorerGrid } from "@/components/file-explorer/file-explorer-grid";
import { FileExplorerList } from "@/components/file-explorer/file-explorer-list";
import { FileExplorerEmpty } from "@/components/file-explorer/file-explorer-empty";
import { useFolders } from "@/hooks/use-folder-queries";
import { useDocuments } from "@/hooks/use-document-queries";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get("folderId") || null;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const { data: folders = [], isLoading: foldersLoading } =
    useFolders(folderId);
  const { data: documents = [], isLoading: documentsLoading } = useDocuments({
    folderId,
  });

  const isLoading = foldersLoading || documentsLoading;

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
    if (uuid === null) {
      setSearchParams({});
    } else {
      setSearchParams({ folderId: uuid });
    }
  }

  function handleDocumentClick(uuid: string) {
    navigate(`/documents/${uuid}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
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
    </div>
  );
}
