export interface Folder {
  id: number;
  uuid: string;
  name: string;
  parentId: number | null;
  createdById: number;
  isPrivate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowMove: boolean;
  allowCopy: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; firstName: string; lastName: string };
  _count?: { children: number; documentFolders: number };
  children?: Folder[];
}

export interface Document {
  id: number;
  uuid: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  documentDate: string;
  categoryId: number | null;
  createdById: number;
  isPrivate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowMove: boolean;
  allowCopy: boolean;
  metadata: Record<string, unknown> | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; firstName: string; lastName: string };
  category?: { id: number; name: string; icon: string | null; color: string | null } | null;
  documentFolders?: { folder: { id: number; name: string } }[];
}

export interface FolderInvite {
  id: number;
  folderId: number;
  invitedUserId: number;
  invitedById: number;
  permission: 'view' | 'edit';
  createdAt: string;
  invitedUser: { id: number; firstName: string; lastName: string; email: string };
}

export interface DocumentInvite {
  id: number;
  documentId: number;
  invitedUserId: number;
  invitedById: number;
  permission: 'view' | 'edit';
  createdAt: string;
  invitedUser: { id: number; firstName: string; lastName: string; email: string };
}

export interface ShareLink {
  id: number;
  token: string;
  documentId: number | null;
  folderId: number | null;
  createdById: number;
  password: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface TrashResponse {
  documents: Document[];
  folders: Folder[];
}

export interface BreadcrumbItem {
  id: number;
  uuid: string;
  name: string;
  parentId: number | null;
}
