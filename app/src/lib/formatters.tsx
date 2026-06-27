import {
  File, FileText, FileImage, FileVideo, FileAudio,
  FileSpreadsheet, FileArchive, FileCode, FileType,
} from 'lucide-react';

export function getDocumentIcon(mimeType: string | null, sizeClass = 'size-10 stroke-1') {
  if (!mimeType) return <File className={`${sizeClass} text-muted-foreground`} />;

  // Images
  if (mimeType.startsWith('image/'))
    return <FileImage className={`${sizeClass} text-blue-500`} />;

  // PDF
  if (mimeType === 'application/pdf')
    return <FileText className={`${sizeClass} text-red-500`} />;

  // Word
  if (mimeType.includes('wordprocessing') || mimeType.includes('msword'))
    return <FileType className={`${sizeClass} text-blue-600`} />;

  // Excel / Spreadsheet
  if (mimeType.includes('spreadsheet') || mimeType.includes('ms-excel'))
    return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;

  // PowerPoint / Presentation
  if (mimeType.includes('presentation') || mimeType.includes('ms-powerpoint'))
    return <FileText className={`${sizeClass} text-orange-500`} />;

  // Video
  if (mimeType.startsWith('video/'))
    return <FileVideo className={`${sizeClass} text-purple-500`} />;

  // Audio
  if (mimeType.startsWith('audio/'))
    return <FileAudio className={`${sizeClass} text-pink-500`} />;

  // Archives
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('7z'))
    return <FileArchive className={`${sizeClass} text-yellow-600`} />;

  // Code / text
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript'))
    return <FileCode className={`${sizeClass} text-gray-500`} />;

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
