export interface OrgUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  role: { id: number; name: string };
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  isSystem: boolean;
  isDefault: boolean;
  _count?: { users: number; rolePermissions: number };
  rolePermissions?: { permissionId: number }[];
}

export interface Permission {
  id: number;
  action: string;
  subject: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}
