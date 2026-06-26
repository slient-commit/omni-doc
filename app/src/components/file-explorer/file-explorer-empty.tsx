import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

interface FileExplorerEmptyProps {
  message?: string;
  action?: ReactNode;
}

export function FileExplorerEmpty({
  message = "No items yet",
  action,
}: FileExplorerEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
      <FolderOpen className="size-12 stroke-1" />
      <p className="text-sm">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
