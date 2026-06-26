import { useParams, useNavigate } from 'react-router';
import { useDocument } from '@/hooks/use-document-queries';
import { useAuth } from '@/contexts/auth-context';
import { getDocumentIcon, formatFileSize, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

// ponytail: iframe-based viewer for known types, download fallback for the rest
function getViewerUrl(id: number) {
  return `/api/documents/${id}/download`;
}

function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('text/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/')
  );
}

export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: doc, isLoading, isError } = useDocument(Number(id));

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Go back
        </Button>
      </div>
    );
  }

  const canPreview = isPreviewable(doc.mimeType);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          {getDocumentIcon(doc.mimeType, 'size-5 shrink-0')}
          <h1 className="text-lg font-semibold">{doc.originalName}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {doc.category && <Badge variant="secondary">{doc.category.name}</Badge>}
          <span className="text-sm text-muted-foreground">
            {formatFileSize(doc.fileSize)} &middot; {formatDate(doc.documentDate)}
          </span>
          <Button onClick={() => window.open(getViewerUrl(Number(id)), '_blank')}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      </div>

      {/* Preview */}
      {canPreview ? (
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
          {doc.mimeType?.startsWith('image/') ? (
            <div className="flex h-full items-center justify-center p-4">
              <img
                src={getViewerUrl(Number(id))}
                alt={doc.originalName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <iframe
              src={getViewerUrl(Number(id))}
              title={doc.originalName}
              className="h-full w-full min-h-[600px]"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 py-20">
          {getDocumentIcon(doc.mimeType, 'size-16 stroke-1')}
          <div className="text-center">
            <p className="font-medium">{doc.originalName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview not available for this file type. Download to view.
            </p>
          </div>
          <Button onClick={() => window.open(getViewerUrl(Number(id)), '_blank')}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      )}
    </div>
  );
}
