import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDocument, useEditorConfig } from '@/hooks/use-document-queries';
import { useAuth } from '@/contexts/auth-context';
import { getDocumentIcon, formatFileSize, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';

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

// ponytail: ONLYOFFICE integration per official docs
// 1. Load api.js with ?shardkey= (v8.1+)
// 2. Create DocEditor on placeholder div
// 3. Destroy on unmount to prevent zombie WebSockets
function OnlyOfficeViewer({ id, mimeType }: { id: string; mimeType: string }) {
  const editorRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const { data, isLoading, isError, error } = useEditorConfig(id, isOfficeFile(mimeType));

  // Load the ONLYOFFICE api.js script
  useEffect(() => {
    if (!data) return;

    // @ts-expect-error — ONLYOFFICE global
    if (window.DocsAPI) {
      setScriptReady(true);
      return;
    }

    const scriptId = 'onlyoffice-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (script) {
      // Script tag exists but not loaded yet — wait for it
      const onLoad = () => setScriptReady(true);
      const onError = () => setEditorError('Failed to load ONLYOFFICE editor');
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      return () => {
        script?.removeEventListener('load', onLoad);
        script?.removeEventListener('error', onError);
      };
    }

    // ponytail: v8.1+ shardkey parameter for load balancing
    const shardkey = data.documentKey || '';
    script = document.createElement('script');
    script.id = scriptId;
    script.src = `${data.onlyofficeUrl}/web-apps/apps/api/documents/api.js?shardkey=${encodeURIComponent(shardkey)}`;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setEditorError('Failed to load ONLYOFFICE editor. Check that the Document Server is reachable.');
    document.head.appendChild(script);
  }, [data]);

  // Initialize the editor once script + config are ready
  useEffect(() => {
    // @ts-expect-error — ONLYOFFICE global
    if (!scriptReady || !data || !window.DocsAPI) return;
    if (editorRef.current) return;

    try {
      const config = {
        ...data.config,
        height: '100%',
        width: '100%',
        type: 'desktop',
        events: {
          onError: (event: { data?: number | string }) => {
            const code = event.data;
            const messages: Record<string, string> = {
              '-2': 'Network error — ONLYOFFICE cannot download the file from your server',
              '-3': 'Connection to ONLYOFFICE server lost',
              '-4': 'File not found — the download URL may be unreachable from ONLYOFFICE',
              '-7': 'Download error — ensure APP_URL is accessible from the ONLYOFFICE container',
              '-8': 'Token validation error — check ONLYOFFICE_JWT_SECRET matches',
            };
            const msg = messages[String(code)] || `ONLYOFFICE error (code: ${code})`;
            setEditorError(msg);
          },
          onDocumentReady: () => {
            setEditorError(null);
          },
        },
      };

      // @ts-expect-error — ONLYOFFICE global
      editorRef.current = new window.DocsAPI.DocEditor('onlyoffice-placeholder', config);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : 'Failed to initialize ONLYOFFICE editor');
    }
  }, [scriptReady, data]);

  // Destroy editor on unmount — prevents memory leaks and zombie WebSocket connections
  useEffect(() => {
    return () => {
      try { editorRef.current?.destroyEditor?.(); } catch { /* ignore */ }
      editorRef.current = null;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertTriangle className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'ONLYOFFICE is not configured'}</p>
      </div>
    );
  }

  if (editorError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <AlertTriangle className="size-8 text-destructive/50" />
        <p className="max-w-md text-center text-sm text-muted-foreground">{editorError}</p>
        <p className="text-xs text-muted-foreground/70">Download the file to view it instead.</p>
      </div>
    );
  }

  // ponytail: this div is the placeholder per ONLYOFFICE docs — DocEditor renders into it
  return <div id="onlyoffice-placeholder" className="h-full w-full" />;
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
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30" style={{ minHeight: '600px' }}>
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
