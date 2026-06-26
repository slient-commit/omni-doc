import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFolderAncestors } from "@/hooks/use-folder-queries";

interface FileExplorerBreadcrumbProps {
  folderId: string | null;
  onNavigate: (folderId: string | null) => void;
}

export function FileExplorerBreadcrumb({
  folderId,
  onNavigate,
}: FileExplorerBreadcrumbProps) {
  const { data: ancestors = [] } = useFolderAncestors(folderId);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {folderId === null ? (
            <BreadcrumbPage>Documents</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              render={
                <button
                  type="button"
                  onClick={() => onNavigate(null)}
                />
              }
            >
              Documents
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {ancestors.map((ancestor, index) => {
          const isLast = index === ancestors.length - 1;

          return (
            <BreadcrumbItem key={ancestor.id}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbPage>{ancestor.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={
                    <button
                      type="button"
                      onClick={() => onNavigate(ancestor.uuid)}
                    />
                  }
                >
                  {ancestor.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
