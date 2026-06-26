import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { useDocuments } from "@/hooks/use-document-queries";
import { FileExplorerGrid } from "@/components/file-explorer/file-explorer-grid";
import { FileExplorerList } from "@/components/file-explorer/file-explorer-list";
import { FileExplorerEmpty } from "@/components/file-explorer/file-explorer-empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List, Loader2 } from "lucide-react";

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const { data: documents = [], isLoading } = useDocuments({
    createdById: user?.id,
  });

  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.originalName.toLowerCase().includes(q));
  }, [documents, search]);

  function handleDocumentClick(uuid: string) {
    navigate(`/documents/${uuid}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your documents..."
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

      <div>
        <h1 className="text-lg font-semibold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          Documents you have created.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <FileExplorerEmpty
          message={
            search
              ? "No documents match your search."
              : "You haven't created any documents yet."
          }
        />
      ) : viewMode === "grid" ? (
        <FileExplorerGrid
          folders={[]}
          documents={filteredDocuments}
          onFolderClick={() => {}}
          onDocumentClick={handleDocumentClick}
        />
      ) : (
        <FileExplorerList
          folders={[]}
          documents={filteredDocuments}
          onFolderClick={() => {}}
          onDocumentClick={handleDocumentClick}
        />
      )}
    </div>
  );
}
