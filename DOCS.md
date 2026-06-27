# Omni Doc — Documentation

Complete reference for the Omni Doc document management platform.

---

## Table of Contents

- [Architecture](#architecture)
- [Authentication](#authentication)
- [Permission System](#permission-system)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Documents](#documents)
  - [Folders](#folders)
  - [Sharing & Invites](#sharing--invites)
  - [Trash](#trash)
  - [Users](#users)
  - [Roles & Permissions](#roles--permissions)
  - [Organization](#organization)
  - [Health](#health)
- [Frontend Pages](#frontend-pages)
- [File Storage](#file-storage)
- [Email Notifications](#email-notifications)
- [Soft Delete & Trash](#soft-delete--trash)
- [Organization Lifecycle](#organization-lifecycle)
- [ZIP Import & Export](#zip-import--export)
- [Security](#security)
- [Deployment](#deployment)
- [Database Schema](#database-schema)

---

## Architecture

Omni Doc is a monorepo with two services:

| Service | Tech | Role |
|---------|------|------|
| **omni-doc-api** | Express.js + Prisma + MySQL | REST API, file storage, email, cron |
| **omni-doc-app** | React 19 + Vite + TypeScript | SPA served via nginx, proxies `/api` to the API |

### Request Flow

```
Browser → nginx (port 80/8080)
  ├── /api/* → omni-doc-api:3000
  └── /*    → React SPA (client-side routing)
```

### Key Libraries

- **Prisma** — ORM and migration management
- **Multer** — multipart file upload handling
- **Archiver/Unzipper** — ZIP export and import
- **Resend** — transactional email delivery
- **Helmet** — security headers
- **express-rate-limit** — rate limiting
- **TanStack Query** — frontend data fetching and caching
- **shadcn/ui** — UI component library (base-nova style)

---

## Authentication

JWT-based authentication with email verification.

### Flow

1. **Register** — creates an organization + owner user, sends verification email
2. **Verify email** — activates the account via token link
3. **Login** — returns a JWT token (default expiry: 7 days)
4. **Password reset** — token-based flow via email

### Token Delivery

- **Header**: `Authorization: Bearer <token>` (standard)
- **Query param**: `?token=<jwt>` (fallback for iframe/image preview loads)

---

## Permission System

### Role-Based Access Control

Each organization has roles with configurable permissions. Roles are assigned to users.

**27 permissions** across 8 subjects:

| Subject | Actions |
|---------|---------|
| `document` | create, read, update, delete |
| `folder` | create, read, update, delete |
| `category` | create, read, update, delete |
| `user` | create, read, update, delete |
| `role` | create, read, update, delete |
| `organization` | manage |
| `share_link` | create, read, delete |
| `invite` | create, read, delete |

### Per-Item Permissions

Documents and folders have owner-controlled flags:

| Flag | Effect |
|------|--------|
| `allowEdit` | Non-owners can edit (if they also have the role permission) |
| `allowDelete` | Non-owners can delete |
| `allowMove` | Non-owners can move |
| `allowCopy` | Non-owners can copy |

**Owner bypass**: item creators can always edit/delete/move/copy their own items.

### Privacy

- `isPrivate` flag on documents and folders
- Private items are visible only to the owner and invited users
- Setting a folder to private cascades to all sub-items
- Private items are excluded from non-owner item counts

### System Roles

- **Owner** — created automatically with the organization; has all permissions; `isSystem = true`, cannot be deleted or reassigned
- **Default role** — `isDefault = true`; auto-assigned to new members via invite

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create organization + owner account |
| POST | `/auth/login` | No | Authenticate, returns JWT |
| POST | `/auth/verify-email` | No | Verify email via token |
| POST | `/auth/forgot-password` | No | Send password reset email |
| POST | `/auth/reset-password` | No | Reset password via token |

**POST /auth/register**
```json
{
  "email": "admin@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Inc"
}
```

**POST /auth/login**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```
Response: `{ "token": "eyJ...", "user": { ... } }`

---

### Documents

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/documents` | create:document | Upload file (multipart/form-data) |
| GET | `/documents` | read:document | List documents (query: `folderId`, `search`, `myDocuments`, `sharedWithMe`) |
| GET | `/documents/:id` | read:document | Get document details |
| GET | `/documents/:id/download` | read:document | Download file (`?preview=true` for inline) |
| PATCH | `/documents/:id` | update:document | Update metadata |
| DELETE | `/documents/:id` | delete:document | Soft delete (move to trash) |
| DELETE | `/documents/:id/permanent` | delete:document | Permanently delete + remove file |
| POST | `/documents/:id/restore` | update:document | Restore from trash |
| POST | `/documents/:id/move` | update:document | Move to folder |
| POST | `/documents/:id/copy` | update:document | Copy to folder |

**POST /documents** (multipart)
- Field `file` — the file to upload
- Field `folderId` (optional) — target folder UUID
- Field `isPrivate` (optional) — `true`/`false`
- Field `allowEdit`, `allowDelete`, `allowMove`, `allowCopy` (optional) — per-item permission flags

**`:id` parameter** accepts both numeric ID and UUID.

---

### Folders

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/folders` | create:folder | Create folder |
| GET | `/folders` | read:folder | List folders (query: `parentId`) |
| GET | `/folders/:id` | read:folder | Get folder details + children count |
| GET | `/folders/:id/ancestors` | read:folder | Get breadcrumb ancestry path |
| PATCH | `/folders/:id` | update:folder | Update folder |
| DELETE | `/folders/:id` | delete:folder | Soft delete (recursive) |
| DELETE | `/folders/:id/permanent` | delete:folder | Permanently delete (recursive) |
| POST | `/folders/:id/restore` | update:folder | Restore from trash |
| POST | `/folders/:id/move` | update:folder | Move to parent folder |
| POST | `/folders/:id/copy` | create:folder | Duplicate folder tree |

**POST /folders**
```json
{
  "name": "Project Files",
  "parentId": "optional-parent-uuid",
  "isPrivate": false,
  "allowEdit": true,
  "allowDelete": true,
  "allowMove": true,
  "allowCopy": true
}
```

---

### Sharing & Invites

#### Document Invites

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/documents/:id/invite` | update:document | Invite org user to document |
| DELETE | `/documents/:id/invite/:inviteId` | update:document | Remove invite |

#### Folder Invites

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/folders/:id/invite` | update:folder | Invite org user to folder |
| DELETE | `/folders/:id/invite/:inviteId` | update:folder | Remove invite |

**Invite body**:
```json
{
  "userId": 5,
  "permission": "view"
}
```
Permission values: `view`, `edit`.

#### Share Links

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/share-links` | update:document | Create public share link |
| GET | `/share-links` | read:document | List your share links |
| DELETE | `/share-links/:id` | update:document | Delete share link |
| POST | `/share-links/email` | create:share_link | Email a share link |

**POST /share-links**
```json
{
  "documentId": "doc-uuid",
  "password": "optional",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

#### Public Access (no auth)

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| GET | `/shared/:token` | 20/min | Get shared item metadata |
| GET | `/shared/:token/download` | 20/min | Download shared file |

Password-protected links require `?password=xxx` query param.

---

### Trash

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/trash` | delete:document, delete:folder | List all soft-deleted items |
| DELETE | `/trash/empty` | delete:document, delete:folder | Permanently delete all trash |

---

### Users

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/users` | read:user | List organization users |
| POST | `/users/invite` | create:user | Invite new user (sends email) |
| PATCH | `/users/:id` | update:user | Update user (name, role, status) |
| DELETE | `/users/:id` | delete:user | Deactivate user |

**POST /users/invite**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleId": 2
}
```

---

### Roles & Permissions

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/roles` | read:role | List organization roles |
| GET | `/roles/permissions` | read:role | List all available permissions |
| GET | `/roles/my-permissions` | — | Get current user's permissions |
| POST | `/roles` | create:role | Create custom role |
| PATCH | `/roles/:id` | update:role | Update role name/description/permissions |
| DELETE | `/roles/:id` | delete:role | Delete role (not system roles) |

**POST /roles**
```json
{
  "name": "Editor",
  "description": "Can edit documents and folders",
  "permissionIds": [1, 2, 3, 5, 6, 7]
}
```

---

### Organization

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/organization` | — | Get current org details |
| PATCH | `/organization` | manage:organization | Update org name |
| DELETE | `/organization` | — | Soft delete org (owner only) |
| POST | `/organization/recover` | — | Recover deleted org |
| POST | `/organization/export` | manage:organization | Request org data export (ZIP) |
| GET | `/organization/exports` | manage:organization | List exports |
| GET | `/organization/exports/:id/download` | — | Download export ZIP |

---

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/ready` | Readiness check (pings database) |

---

## Frontend Pages

| Path | Page | Description |
|------|------|-------------|
| `/welcome` | Landing | Marketing page with features and deploy instructions |
| `/login` | Login | Email + password authentication |
| `/register` | Register | Create org + owner account |
| `/forgot-password` | Forgot Password | Request password reset email |
| `/reset-password` | Reset Password | Set new password via token |
| `/verify-email` | Verify Email | Confirm email address |
| `/` | Dashboard | File explorer — grid/list view with context menus |
| `/my-documents` | My Documents | Documents created by current user |
| `/shared` | Shared with Me | Documents/folders shared via invites |
| `/trash` | Trash | Soft-deleted items with restore/permanent delete |
| `/documents/:id` | Document Viewer | Preview or download a document |
| `/settings` | General Settings | Organization name, export, delete org |
| `/settings/users` | User Management | List, invite, edit, deactivate users |
| `/settings/roles` | Role Management | Create/edit roles with permission checkboxes |
| `/shared/:token` | Shared Link | Public access to shared document/folder |

---

## File Storage

Files are stored on disk under the configured `STORAGE_PATH`:

```
uploads/
└── {org.storagePath}/
    └── {uuid}.{ext}
```

- Filenames are UUID-generated to prevent collisions
- Original filename is preserved in the database (`originalName`)
- Path traversal is guarded at the API level
- A Docker volume (`omni-doc-uploads`) persists files across container restarts

### Allowed File Types

Uploads are filtered by MIME type whitelist including:
- Documents: PDF, Word, Excel, PowerPoint, text, CSV
- Images: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO
- Video: MP4, WebM, OGG, AVI, MOV, MKV
- Audio: MP3, WAV, OGG, AAC, FLAC, MIDI
- Archives: ZIP, TAR, GZIP, 7Z, RAR, BZIP2

---

## Email Notifications

Transactional emails are sent via [Resend](https://resend.com). Templates include:

| Email | Trigger |
|-------|---------|
| **Email Verification** | User registers or is invited |
| **Password Reset** | User requests password reset |
| **User Invite** | Admin invites a new user |
| **Share Notification** | User emails a share link |

All emails use branded HTML templates with the Omni Doc logo and consistent styling.

---

## Soft Delete & Trash

Documents and folders support soft delete via a `deletedAt` timestamp.

- **Soft delete**: sets `deletedAt` to current time; item disappears from normal views
- **Folder soft delete**: cascades to all children folders and contained documents
- **Restore**: clears `deletedAt`; item reappears in its original location
- **Permanent delete**: removes the database record and physical file from disk
- **Auto-cleanup**: a daily cron (midnight UTC) permanently deletes items older than `TRASH_RETENTION_DAYS` (default: 30)

---

## Organization Lifecycle

1. **Create** — on registration, an org is created with a generated `storagePath` and `slug`
2. **Soft delete** — owner can delete the org; sets `deletedAt`, all users lose access
3. **Recovery** — within `ORG_RETENTION_DAYS` (default: 30), the owner can recover the org
4. **Permanent delete** — after the retention period, the daily cron removes the org and all associated data

---

## ZIP Import & Export

### Import (Upload ZIP)

- Upload a `.zip` file to `POST /documents/upload-zip`
- Extracts the archive preserving folder structure
- Creates folders and documents matching the ZIP hierarchy
- Requires both `create:document` and `create:folder` permissions

### Export (Download ZIP)

- Request an export via `POST /organization/export`
- The API packages all org documents into a ZIP asynchronously
- Status tracked via `OrgExport` model (pending → processing → ready/failed)
- Download the ready ZIP from `GET /organization/exports/:id/download`
- Exports auto-expire after `ZIP_EXPIRY_HOURS` (default: 24)

---

## Security

- **Helmet** — sets security headers (CSP, HSTS, etc.)
- **Rate limiting** — global rate limit on all endpoints; stricter limit on public share routes (20/min)
- **CORS** — configurable allowed origins
- **Path traversal guard** — file path resolution validates against the storage root
- **MIME whitelist** — only allowed file types can be uploaded
- **Error sanitization** — 500 errors return generic messages; details only in development
- **JWT auth** — stateless authentication with configurable expiry
- **Permission middleware** — every protected route checks role permissions via database query
- **Per-item authorization** — owner bypass + per-item flags checked before mutations
- **Input validation** — express-validator on all route inputs

---

## Deployment

### Docker Compose (recommended)

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, RESEND_API_KEY, APP_URL
docker compose up --build
```

The compose file defines two services:
- **omni-doc-api** — Node.js Express server (port 3000 internal)
- **omni-doc-app** — nginx serving the React build + proxying `/api` to the API

Migrations run automatically via `docker-entrypoint.sh` on API startup.

### Volumes

- `omni-doc-uploads` — persists uploaded files across container restarts

### Network

By default configured for Dokploy with Traefik. For standalone use, adjust the `networks` section in `docker-compose.yml` and ensure port 8080 is exposed.

### Local Development

Run each service separately:

```bash
# Terminal 1 — API
cd api && npm install && npm run dev

# Terminal 2 — App
cd app && npm install && npm run dev
```

API runs at http://localhost:3000, app at http://localhost:5173 (Vite proxies `/api` in dev).

---

## Database Schema

### Entity Relationship Overview

```
Organization ─┬── User ──── Role ──── RolePermission ──── Permission
               ├── Folder ─┬── DocumentFolder ──── Document
               │            ├── FolderInvite
               │            └── ShareLink
               ├── Document ┬── DocumentInvite
               │             └── ShareLink
               ├── Category
               └── OrgExport

User ──── PasswordResetToken
User ──── EmailVerificationToken
```

### Models

| Model | Key Fields | Description |
|-------|------------|-------------|
| Organization | name, slug, storagePath, deletedAt | Tenant container |
| User | email, firstName, lastName, roleId, isActive, emailVerifiedAt | Team member |
| Role | name, isSystem, isDefault | Permission group |
| Permission | action, subject | Atomic permission (e.g. create:document) |
| RolePermission | roleId, permissionId | Many-to-many link |
| Document | uuid, originalName, storedFilename, mimeType, isPrivate, allow* flags, deletedAt | Uploaded file |
| Folder | uuid, name, parentId, isPrivate, allow* flags, deletedAt | Container for documents |
| DocumentFolder | documentId, folderId | Document-to-folder mapping |
| FolderInvite | folderId, invitedUserId, permission | User access to folder |
| DocumentInvite | documentId, invitedUserId, permission | User access to document |
| ShareLink | token, documentId/folderId, password, expiresAt | Public access link |
| Category | name, icon, color, parentId | Document classification |
| OrgExport | status, filePath, expiresAt | Bulk data export |
| PasswordResetToken | token, userId, expiresAt | Password reset flow |
| EmailVerificationToken | token, userId, expiresAt | Email verification flow |

---

## License

[Source-Available Non-Commercial & No-SaaS License](LICENSE) &copy; 2026 MOURCHID Mohamed Kamal

See [LICENSE](LICENSE) for full terms.
