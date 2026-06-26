import { File, FileText, FileImage } from 'lucide-react';

export function getDocumentIcon(mimeType: string | null, sizeClass = 'size-10 stroke-1') {
  if (!mimeType) return <File className={`${sizeClass} text-muted-foreground`} />;
  if (mimeType.startsWith('image/')) return <FileImage className={`${sizeClass} text-blue-500`} />;
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  )
    return <FileText className={`${sizeClass} text-orange-500`} />;
  return <File className={`${sizeClass} text-muted-foreground`} />;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getOwnerName(createdBy?: { firstName: string; lastName: string }): string {
  if (!createdBy) return '--';
  return `${createdBy.firstName} ${createdBy.lastName}`;
}
