import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDocument, useEditorConfig } from '@/hooks/use-document-queries';
import { useAuth } from '@/contexts/auth-context';
import { getDocumentIcon, formatFileSize, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Loader2, ShieldAlert } from 'lucide-react';

const OFFICE_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
]);

function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('text/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    OFFICE_MIMES.has(mimeType)
  );
}

function isOfficeFile(mimeType: string | null): boolean {
  return !!mimeType && OFFICE_MIMES.has(mimeType);
}

// ponytail: loads ONLYOFFICE JS API and renders the editor in view-only mode
function OnlyOfficeViewer({ id, mimeType }: { id: string; mimeType: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);
  const { data, isLoading, isError } = useEditorConfig(id, isOfficeFile(mimeType));

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const scriptId = 'onlyoffice-api-script';
    const existingScript = document.getElementById(scriptId);

    function initEditor() {
      // @ts-expect-error — ONLYOFFICE global
      if (!window.DocsAPI) return;
      if (editorRef.current) return;
      // @ts-expect-error — ONLYOFFICE global
      editorRef.current = new window.DocsAPI.DocEditor('onlyoffice-container', data.config);
    }

    if (existingScript) {
      initEditor();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `${data.onlyofficeUrl}/web-apps/apps/api/documents/api.js`;
      script.async = true;
      script.onload = initEditor;
      document.head.appendChild(script);
    }

    return () => {
      if (editorRef.current && typeof (editorRef.current as { destroyEditor?: () => void }).destroyEditor === 'function') {
        (editorRef.current as { destroyEditor: () => void }).destroyEditor();
      }
      editorRef.current = null;
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Office preview not available. Download the file to view it.</p>
      </div>
    );
  }

  return <div id="onlyoffice-container" ref={containerRef} className="h-full w-full" />;
}

export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { data: doc, isLoading, isError } = useDocument(id!);

  const tokenParam = `token=${encodeURIComponent(token ?? '')}`;
  const previewUrl = `/api/documents/${id}/download?preview=true&${tokenParam}`;
  const downloadUrl = `/api/documents/${id}/download?${tokenParam}`;

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
        <ShieldAlert className="size-12 text-muted-foreground/50" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have permission to view this document, or it doesn't exist.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Go back
        </Button>
      </div>
    );
  }

  const canPreview = isPreviewable(doc.mimeType);

  return (
    <div className="flex flex-1 flex-col gap-4">
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
          <Button onClick={() => window.open(downloadUrl, '_blank')}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      </div>

      {canPreview ? (
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
          {isOfficeFile(doc.mimeType) ? (
            <OnlyOfficeViewer id={doc.uuid} mimeType={doc.mimeType!} />
          ) : doc.mimeType?.startsWith('image/') ? (
            <div className="flex h-full items-center justify-center p-4">
              <img src={previewUrl} alt={doc.originalName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe src={previewUrl} title={doc.originalName} className="h-full w-full min-h-[600px]" />
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
          <Button onClick={() => window.open(downloadUrl, '_blank')}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      )}
    </div>
  );
}
