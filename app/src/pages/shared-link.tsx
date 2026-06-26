import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Document, Folder } from "@/types/documents";
import {
  Loader2,
  Lock,
  Download,
  FileText,
  FileImage,
  File,
  Folder as FolderIcon,
} from "lucide-react";

interface SharedContent {
  type: "document" | "folder";
  document?: Document;
  folder?: Folder & { documents?: Document[]; children?: Folder[] };
  passwordRequired?: boolean;
}

function getDocumentIcon(mimeType: string | null) {
  if (!mimeType)
    return <File className="size-12 stroke-1 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-12 stroke-1 text-blue-500" />;
  return <FileText className="size-12 stroke-1 text-orange-500" />;
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

export default function SharedLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(
    null
  );
  const [passwordError, setPasswordError] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["shared", token, submittedPassword],
    queryFn: () =>
      api
        .get<SharedContent>(`/shared/${token}`, {
          params: submittedPassword ? { password: submittedPassword } : {},
        })
        .then((r) => r.data),
    enabled: !!token,
    retry: false,
  });

  const needsPassword = data?.passwordRequired && !submittedPassword;

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setPasswordError(false);
    setSubmittedPassword(password.trim());
  }

  function handleDownload() {
    if (!data?.document) return;
    window.open(
      `/api/shared/${token}/download${submittedPassword ? `?password=${encodeURIComponent(submittedPassword)}` : ""}`,
      "_blank"
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <File className="size-12 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">
            {status === 404
              ? "Link not found"
              : status === 401
                ? "Invalid password"
                : "Something went wrong"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === 404
              ? "This shared link may have expired or been removed."
              : status === 401
                ? "The password you entered is incorrect."
                : "Unable to access this shared content."}
          </p>
        </div>
        {status === 401 && (
          <Button
            variant="outline"
            onClick={() => {
              setSubmittedPassword(null);
              setPasswordError(true);
            }}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Lock className="size-10 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">Password Required</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This shared content is protected with a password.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="shared-password">Password</Label>
              <Input
                id="shared-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!password.trim()}>
              Access Content
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Document view
  if (data?.type === "document" && data.document) {
    const doc = data.document;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {getDocumentIcon(doc.mimeType)}
            <div>
              <h1 className="text-lg font-semibold">{doc.originalName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatFileSize(doc.fileSize)} &middot;{" "}
                {formatDate(doc.updatedAt)}
              </p>
            </div>
          </div>

          <Button onClick={handleDownload} className="w-full">
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  // Folder view
  if (data?.type === "folder" && data.folder) {
    const folder = data.folder;
    return (
      <div className="flex min-h-screen justify-center p-4 pt-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <FolderIcon className="size-8 text-yellow-500" />
            <div>
              <h1 className="text-lg font-semibold">{folder.name}</h1>
              <p className="text-sm text-muted-foreground">Shared folder</p>
            </div>
          </div>

          {/* Subfolders */}
          {folder.children && folder.children.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Folders
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {folder.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <FolderIcon className="size-5 shrink-0 text-yellow-500" />
                    <span className="truncate text-sm">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {folder.documents && folder.documents.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Documents
              </h2>
              <div className="divide-y rounded-lg border">
                {folder.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2">
                      {doc.mimeType?.startsWith("image/") ? (
                        <FileImage className="size-5 shrink-0 text-blue-500" />
                      ) : (
                        <FileText className="size-5 shrink-0 text-orange-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!folder.children || folder.children.length === 0) &&
            (!folder.documents || folder.documents.length === 0) && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <FolderIcon className="size-10 stroke-1" />
                <p className="text-sm">This folder is empty.</p>
              </div>
            )}
        </div>
      </div>
    );
  }

  return null;
}
