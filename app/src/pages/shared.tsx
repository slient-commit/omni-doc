import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useDocuments } from "@/hooks/use-document-queries";
import { useFolders } from "@/hooks/use-folder-queries";
import { FileExplorerGrid } from "@/components/file-explorer/file-explorer-grid";
import { FileExplorerList } from "@/components/file-explorer/file-explorer-list";
import { FileExplorerEmpty } from "@/components/file-explorer/file-explorer-empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List, Loader2, Users } from "lucide-react";

export default function SharedPage() {
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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shared items..."
            className="pl-8"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value: string[]) => {
            const next = value.find((v) => v !== viewMode);
            if (next) setViewMode(next as "grid" | "list");
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

      <div className="flex items-center gap-2">
        <Users className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Shared with me</h1>
          <p className="text-sm text-muted-foreground">
            Documents and folders others have shared with you.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <FileExplorerEmpty
          message={
            search
              ? "No shared items match your search."
              : "Nothing shared with you yet."
          }
        />
      ) : viewMode === "grid" ? (
        <FileExplorerGrid
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={handleNavigateFolder}
          onDocumentClick={handleDocumentClick}
        />
      ) : (
        <FileExplorerList
          folders={filteredFolders}
          documents={filteredDocuments}
          onFolderClick={handleNavigateFolder}
          onDocumentClick={handleDocumentClick}
        />
      )}
    </div>
  );
}
