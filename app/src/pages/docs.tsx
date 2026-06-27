import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import {
  FolderOpen, ArrowRight, ChevronRight, ArrowUp,
  Server, KeyRound, Shield, FileText, FolderClosed, Share2,
  Trash2, Users, Building2, Heart, Rocket,
  Database, Lock, Mail, Archive, BookOpen,
} from 'lucide-react';

// ponytail: lucide doesn't export Github icon — inline SVG (same as landing)
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/* ─── Table of contents ─── */
const TOC = [
  { id: 'architecture', label: 'Architecture', icon: Server },
  { id: 'authentication', label: 'Authentication', icon: KeyRound },
  { id: 'permissions', label: 'Permission System', icon: Shield },
  { id: 'api-auth', label: 'API — Auth', icon: KeyRound },
  { id: 'api-documents', label: 'API — Documents', icon: FileText },
  { id: 'api-folders', label: 'API — Folders', icon: FolderClosed },
  { id: 'api-sharing', label: 'API — Sharing & Invites', icon: Share2 },
  { id: 'api-trash', label: 'API — Trash', icon: Trash2 },
  { id: 'api-users', label: 'API — Users', icon: Users },
  { id: 'api-roles', label: 'API — Roles', icon: Shield },
  { id: 'api-organization', label: 'API — Organization', icon: Building2 },
  { id: 'api-health', label: 'API — Health', icon: Heart },
  { id: 'frontend', label: 'Frontend Pages', icon: BookOpen },
  { id: 'storage', label: 'File Storage', icon: Archive },
  { id: 'emails', label: 'Email Notifications', icon: Mail },
  { id: 'trash', label: 'Soft Delete & Trash', icon: Trash2 },
  { id: 'org-lifecycle', label: 'Organization Lifecycle', icon: Building2 },
  { id: 'zip', label: 'ZIP Import & Export', icon: Archive },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'deployment', label: 'Deployment', icon: Rocket },
  { id: 'schema', label: 'Database Schema', icon: Database },
];

/* ─── Reusable bits ─── */
function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group mb-6 scroll-mt-20 border-b pb-3 text-xl font-bold tracking-tight sm:text-2xl">
      <a href={`#${id}`} className="rounded-sm text-foreground no-underline hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {children}
      </a>
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-8 text-base font-semibold">{children}</h3>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top">
                  {j === 0 ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{cell}</code> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border bg-card">
      {title && (
        <div className="border-b bg-muted/50 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed"><code>{children}</code></pre>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>;
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mb-6 space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
          <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Main docs page ─── */
export default function DocsPage() {
  const location = useLocation();
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(false);

  // ponytail: intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );
    for (const { id } of TOC) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // scroll to hash on mount
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/welcome" className="flex items-center gap-2 rounded-sm text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <FolderOpen className="size-5 text-primary" />
            <span className="font-semibold">Omni Doc</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/welcome" className="rounded-sm px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Home
            </Link>
            <a
              href="https://github.com/slient-commit/omni-doc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="inline-flex items-center gap-1.5 rounded-sm px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <GithubIcon className="size-4" /> GitHub
            </a>
            <Link to="/register" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile TOC */}
      <div className="border-b lg:hidden">
        <div className="mx-auto max-w-7xl px-6">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            aria-expanded={tocOpen}
            aria-label="Table of contents"
            className="flex w-full items-center justify-between py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span>On this page</span>
            <ChevronRight className={`size-4 transition-transform ${tocOpen ? 'rotate-90' : ''}`} />
          </button>
          {tocOpen && (
            <nav className="pb-4">
              <ul className="space-y-0.5">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setTocOpen(false)}
                      className={`flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        activeId === item.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-10">
        {/* Sidebar TOC — desktop */}
        <aside className="hidden lg:block">
          <nav className="sticky top-[calc(3.5rem+1px)] h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r py-8 pl-6 pr-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
            <ul className="space-y-0.5">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`flex min-h-[36px] items-center gap-2 rounded-md px-2.5 text-[13px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      activeId === item.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <item.icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 max-w-3xl flex-1 px-6 py-10 sm:px-10 lg:px-8">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Documentation</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Complete reference for the Omni Doc document management platform.
            </p>
          </div>

          {/* ─── Architecture ─── */}
          <SectionHeading id="architecture">Architecture</SectionHeading>
          <Paragraph>
            Omni Doc is a monorepo with two Docker services communicating over an internal network.
          </Paragraph>
          <Table
            headers={['Service', 'Tech', 'Role']}
            rows={[
              ['omni-doc-api', 'Express.js + Prisma + MySQL', 'REST API, file storage, email, cron jobs'],
              ['omni-doc-app', 'React 19 + Vite + TypeScript', 'SPA served via nginx, proxies /api to the API'],
            ]}
          />
          <CodeBlock title="Request Flow">{`Browser → nginx (port 80/8080)
  ├── /api/* → omni-doc-api:3000
  └── /*    → React SPA (client-side routing)`}</CodeBlock>
          <SubHeading>Key Libraries</SubHeading>
          <BulletList items={[
            <><strong>Prisma</strong> — ORM and migration management</>,
            <><strong>Multer</strong> — multipart file upload handling</>,
            <><strong>Archiver / Unzipper</strong> — ZIP export and import</>,
            <><strong>Resend</strong> — transactional email delivery</>,
            <><strong>Helmet</strong> — security headers</>,
            <><strong>express-rate-limit</strong> — API rate limiting</>,
            <><strong>TanStack Query</strong> — frontend data fetching and caching</>,
            <><strong>shadcn/ui</strong> — UI component library</>,
          ]} />

          {/* ─── Authentication ─── */}
          <SectionHeading id="authentication">Authentication</SectionHeading>
          <Paragraph>
            JWT-based authentication with email verification. Tokens are sent as a Bearer header or as a query parameter
            (fallback for iframe/image preview loads).
          </Paragraph>
          <SubHeading>Flow</SubHeading>
          <BulletList items={[
            <><strong>Register</strong> — creates an organization + owner user, sends verification email</>,
            <><strong>Verify email</strong> — activates the account via token link</>,
            <><strong>Login</strong> — returns a JWT token (default expiry: 7 days)</>,
            <><strong>Password reset</strong> — token-based flow via email</>,
          ]} />

          {/* ─── Permission System ─── */}
          <SectionHeading id="permissions">Permission System</SectionHeading>
          <Paragraph>
            Each organization has roles with configurable permissions. Roles are assigned to users.
            There are <strong>27 permissions</strong> across 8 subjects.
          </Paragraph>
          <Table
            headers={['Subject', 'Actions']}
            rows={[
              ['document', 'create, read, update, delete'],
              ['folder', 'create, read, update, delete'],
              ['category', 'create, read, update, delete'],
              ['user', 'create, read, update, delete'],
              ['role', 'create, read, update, delete'],
              ['organization', 'manage'],
              ['share_link', 'create, read, delete'],
              ['invite', 'create, read, delete'],
            ]}
          />
          <SubHeading>Per-Item Permissions</SubHeading>
          <Paragraph>
            Documents and folders have owner-controlled flags. Item owners always bypass these.
          </Paragraph>
          <Table
            headers={['Flag', 'Effect']}
            rows={[
              ['allowEdit', 'Non-owners can edit (if they also have the role permission)'],
              ['allowDelete', 'Non-owners can delete'],
              ['allowMove', 'Non-owners can move'],
              ['allowCopy', 'Non-owners can copy'],
            ]}
          />
          <SubHeading>Privacy</SubHeading>
          <BulletList items={[
            <>Documents and folders have an <code className="rounded bg-muted px-1 py-0.5 text-xs">isPrivate</code> flag</>,
            'Private items are visible only to the owner and invited users',
            'Setting a folder to private cascades to all sub-items',
            'Private items are excluded from non-owner item counts',
          ]} />
          <SubHeading>System Roles</SubHeading>
          <BulletList items={[
            <><strong>Owner</strong> — created with the organization; has all permissions; cannot be deleted or reassigned</>,
            <><strong>Default role</strong> — auto-assigned to new members via invite</>,
          ]} />

          {/* ─── API: Auth ─── */}
          <SectionHeading id="api-auth">API — Auth</SectionHeading>
          <Paragraph>All endpoints prefixed with <code className="rounded bg-muted px-1 py-0.5 text-xs">/api</code>. Auth endpoints are public.</Paragraph>
          <Table
            headers={['Method', 'Path', 'Description']}
            rows={[
              ['POST', '/auth/register', 'Create organization + owner account'],
              ['POST', '/auth/login', 'Authenticate, returns JWT'],
              ['POST', '/auth/verify-email', 'Verify email via token'],
              ['POST', '/auth/forgot-password', 'Send password reset email'],
              ['POST', '/auth/reset-password', 'Reset password via token'],
            ]}
          />
          <SubHeading>Register</SubHeading>
          <CodeBlock title="POST /auth/register">{`{
  "email": "admin@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Inc"
}`}</CodeBlock>
          <SubHeading>Login</SubHeading>
          <CodeBlock title="POST /auth/login">{`{
  "email": "admin@example.com",
  "password": "securepassword"
}

// Response:
{ "token": "eyJ...", "user": { ... } }`}</CodeBlock>

          {/* ─── API: Documents ─── */}
          <SectionHeading id="api-documents">API — Documents</SectionHeading>
          <Paragraph>
            Authenticated endpoints. The <code className="rounded bg-muted px-1 py-0.5 text-xs">:id</code> parameter accepts both numeric ID and UUID.
          </Paragraph>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['POST', '/documents', 'create:document', 'Upload file (multipart/form-data)'],
              ['GET', '/documents', 'read:document', 'List documents (folderId, search, myDocuments, sharedWithMe)'],
              ['POST', '/documents/upload-zip', 'create:document + create:folder', 'Upload ZIP to extract folder structure'],
              ['GET', '/documents/:id', 'read:document', 'Get document details'],
              ['GET', '/documents/:id/download', 'read:document', 'Download file (?preview=true for inline)'],
              ['PATCH', '/documents/:id', 'update:document', 'Update metadata'],
              ['DELETE', '/documents/:id', 'delete:document', 'Soft delete (move to trash)'],
              ['DELETE', '/documents/:id/permanent', 'delete:document', 'Permanently delete + remove file'],
              ['POST', '/documents/:id/restore', 'update:document', 'Restore from trash'],
              ['POST', '/documents/:id/move', 'update:document', 'Move to folder'],
              ['POST', '/documents/:id/copy', 'update:document', 'Copy to folder'],
            ]}
          />
          <SubHeading>Upload</SubHeading>
          <CodeBlock title="POST /documents (multipart/form-data)">{`file: (binary)
folderId: "optional-folder-uuid"
isPrivate: "false"
allowEdit: "true"
allowDelete: "true"
allowMove: "true"
allowCopy: "true"`}</CodeBlock>

          {/* ─── API: Folders ─── */}
          <SectionHeading id="api-folders">API — Folders</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['POST', '/folders', 'create:folder', 'Create folder'],
              ['GET', '/folders', 'read:folder', 'List folders (?parentId=uuid)'],
              ['GET', '/folders/:id', 'read:folder', 'Get folder details + children count'],
              ['GET', '/folders/:id/ancestors', 'read:folder', 'Get breadcrumb ancestry path'],
              ['PATCH', '/folders/:id', 'update:folder', 'Update folder'],
              ['DELETE', '/folders/:id', 'delete:folder', 'Soft delete (recursive)'],
              ['DELETE', '/folders/:id/permanent', 'delete:folder', 'Permanently delete (recursive)'],
              ['POST', '/folders/:id/restore', 'update:folder', 'Restore from trash'],
              ['POST', '/folders/:id/move', 'update:folder', 'Move to parent folder'],
              ['POST', '/folders/:id/copy', 'create:folder', 'Duplicate folder tree'],
            ]}
          />
          <SubHeading>Create Folder</SubHeading>
          <CodeBlock title="POST /folders">{`{
  "name": "Project Files",
  "parentId": "optional-parent-uuid",
  "isPrivate": false,
  "allowEdit": true,
  "allowDelete": true,
  "allowMove": true,
  "allowCopy": true
}`}</CodeBlock>

          {/* ─── API: Sharing ─── */}
          <SectionHeading id="api-sharing">API — Sharing & Invites</SectionHeading>
          <SubHeading>Document & Folder Invites</SubHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['POST', '/documents/:id/invite', 'update:document', 'Invite org user to document'],
              ['DELETE', '/documents/:id/invite/:inviteId', 'update:document', 'Remove document invite'],
              ['POST', '/folders/:id/invite', 'update:folder', 'Invite org user to folder'],
              ['DELETE', '/folders/:id/invite/:inviteId', 'update:folder', 'Remove folder invite'],
            ]}
          />
          <CodeBlock title="Invite body">{`{
  "userId": 5,
  "permission": "view"   // or "edit"
}`}</CodeBlock>
          <SubHeading>Share Links</SubHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['POST', '/share-links', 'update:document', 'Create public share link'],
              ['GET', '/share-links', 'read:document', 'List your share links'],
              ['DELETE', '/share-links/:id', 'update:document', 'Delete share link'],
              ['POST', '/share-links/email', 'create:share_link', 'Email a share link'],
            ]}
          />
          <CodeBlock title="POST /share-links">{`{
  "documentId": "doc-uuid",
  "password": "optional",
  "expiresAt": "2026-12-31T23:59:59Z"
}`}</CodeBlock>
          <SubHeading>Public Access (no auth)</SubHeading>
          <Table
            headers={['Method', 'Path', 'Rate Limit', 'Description']}
            rows={[
              ['GET', '/shared/:token', '20/min', 'Get shared item metadata'],
              ['GET', '/shared/:token/download', '20/min', 'Download shared file'],
            ]}
          />
          <Paragraph>
            Password-protected links require a <code className="rounded bg-muted px-1 py-0.5 text-xs">?password=xxx</code> query parameter.
          </Paragraph>

          {/* ─── API: Trash ─── */}
          <SectionHeading id="api-trash">API — Trash</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['GET', '/trash', 'delete:document + delete:folder', 'List all soft-deleted items'],
              ['DELETE', '/trash/empty', 'delete:document + delete:folder', 'Permanently delete all trash'],
            ]}
          />

          {/* ─── API: Users ─── */}
          <SectionHeading id="api-users">API — Users</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['GET', '/users', 'read:user', 'List organization users'],
              ['POST', '/users/invite', 'create:user', 'Invite new user (sends email)'],
              ['PATCH', '/users/:id', 'update:user', 'Update user (name, role, status)'],
              ['DELETE', '/users/:id', 'delete:user', 'Deactivate user'],
            ]}
          />
          <CodeBlock title="POST /users/invite">{`{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleId": 2
}`}</CodeBlock>

          {/* ─── API: Roles ─── */}
          <SectionHeading id="api-roles">API — Roles & Permissions</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['GET', '/roles', 'read:role', 'List organization roles'],
              ['GET', '/roles/permissions', 'read:role', 'List all available permissions'],
              ['GET', '/roles/my-permissions', '—', 'Get current user\'s permissions'],
              ['POST', '/roles', 'create:role', 'Create custom role'],
              ['PATCH', '/roles/:id', 'update:role', 'Update role name/description/permissions'],
              ['DELETE', '/roles/:id', 'delete:role', 'Delete role (not system roles)'],
            ]}
          />
          <CodeBlock title="POST /roles">{`{
  "name": "Editor",
  "description": "Can edit documents and folders",
  "permissionIds": [1, 2, 3, 5, 6, 7]
}`}</CodeBlock>

          {/* ─── API: Organization ─── */}
          <SectionHeading id="api-organization">API — Organization</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Permission', 'Description']}
            rows={[
              ['GET', '/organization', '—', 'Get current org details'],
              ['PATCH', '/organization', 'manage:organization', 'Update org name'],
              ['DELETE', '/organization', '—', 'Soft delete org (owner only)'],
              ['POST', '/organization/recover', '—', 'Recover deleted org'],
              ['POST', '/organization/export', 'manage:organization', 'Request org data export (ZIP)'],
              ['GET', '/organization/exports', 'manage:organization', 'List exports'],
              ['GET', '/organization/exports/:id/download', '—', 'Download export ZIP'],
            ]}
          />

          {/* ─── API: Health ─── */}
          <SectionHeading id="api-health">API — Health</SectionHeading>
          <Table
            headers={['Method', 'Path', 'Description']}
            rows={[
              ['GET', '/health', 'Liveness check'],
              ['GET', '/health/ready', 'Readiness check (pings database)'],
            ]}
          />

          {/* ─── Frontend Pages ─── */}
          <SectionHeading id="frontend">Frontend Pages</SectionHeading>
          <Table
            headers={['Path', 'Page', 'Description']}
            rows={[
              ['/welcome', 'Landing', 'Marketing page with features and deploy instructions'],
              ['/login', 'Login', 'Email + password authentication'],
              ['/register', 'Register', 'Create org + owner account'],
              ['/forgot-password', 'Forgot Password', 'Request password reset email'],
              ['/reset-password', 'Reset Password', 'Set new password via token'],
              ['/verify-email', 'Verify Email', 'Confirm email address'],
              ['/', 'Dashboard', 'File explorer — grid/list view with context menus'],
              ['/my-documents', 'My Documents', 'Documents created by current user'],
              ['/shared', 'Shared with Me', 'Documents/folders shared via invites'],
              ['/trash', 'Trash', 'Soft-deleted items with restore/permanent delete'],
              ['/documents/:id', 'Document Viewer', 'Preview or download a document'],
              ['/settings', 'General Settings', 'Organization name, export, delete org'],
              ['/settings/users', 'User Management', 'List, invite, edit, deactivate users'],
              ['/settings/roles', 'Role Management', 'Create/edit roles with permission checkboxes'],
              ['/shared/:token', 'Shared Link', 'Public access to shared document/folder'],
            ]}
          />

          {/* ─── File Storage ─── */}
          <SectionHeading id="storage">File Storage</SectionHeading>
          <Paragraph>Files are stored on disk under the configured storage path.</Paragraph>
          <CodeBlock title="Storage layout">{`uploads/
└── {org.storagePath}/
    └── {uuid}.{ext}`}</CodeBlock>
          <BulletList items={[
            'Filenames are UUID-generated to prevent collisions',
            'Original filename is preserved in the database',
            'Path traversal is guarded at the API level',
            <>A Docker volume (<code className="rounded bg-muted px-1 py-0.5 text-xs">omni-doc-uploads</code>) persists files across container restarts</>,
          ]} />
          <SubHeading>Allowed File Types</SubHeading>
          <BulletList items={[
            <><strong>Documents</strong> — PDF, Word, Excel, PowerPoint, text, CSV</>,
            <><strong>Images</strong> — JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO</>,
            <><strong>Video</strong> — MP4, WebM, OGG, AVI, MOV, MKV</>,
            <><strong>Audio</strong> — MP3, WAV, OGG, AAC, FLAC, MIDI</>,
            <><strong>Archives</strong> — ZIP, TAR, GZIP, 7Z, RAR, BZIP2</>,
          ]} />

          {/* ─── Email ─── */}
          <SectionHeading id="emails">Email Notifications</SectionHeading>
          <Paragraph>
            Transactional emails sent via Resend with branded HTML templates.
          </Paragraph>
          <Table
            headers={['Email', 'Trigger']}
            rows={[
              ['Email Verification', 'User registers or is invited'],
              ['Password Reset', 'User requests password reset'],
              ['User Invite', 'Admin invites a new user'],
              ['Share Notification', 'User emails a share link'],
            ]}
          />

          {/* ─── Soft Delete ─── */}
          <SectionHeading id="trash">Soft Delete & Trash</SectionHeading>
          <BulletList items={[
            <><strong>Soft delete</strong> — sets deletedAt; item disappears from normal views</>,
            <><strong>Folder soft delete</strong> — cascades to all children and contained documents</>,
            <><strong>Restore</strong> — clears deletedAt; item reappears in its original location</>,
            <><strong>Permanent delete</strong> — removes DB record and physical file from disk</>,
            <><strong>Auto-cleanup</strong> — daily cron (midnight UTC) permanently deletes items older than TRASH_RETENTION_DAYS (default: 30)</>,
          ]} />

          {/* ─── Org Lifecycle ─── */}
          <SectionHeading id="org-lifecycle">Organization Lifecycle</SectionHeading>
          <BulletList items={[
            <><strong>Create</strong> — on registration, an org is created with a generated storagePath and slug</>,
            <><strong>Soft delete</strong> — owner can delete the org; sets deletedAt, all users lose access</>,
            <><strong>Recovery</strong> — within ORG_RETENTION_DAYS (default: 30), the owner can recover the org</>,
            <><strong>Permanent delete</strong> — after the retention period, the daily cron removes the org and all data</>,
          ]} />

          {/* ─── ZIP ─── */}
          <SectionHeading id="zip">ZIP Import & Export</SectionHeading>
          <SubHeading>Import (Upload ZIP)</SubHeading>
          <BulletList items={[
            'Upload a .zip file to POST /documents/upload-zip',
            'Extracts the archive preserving folder structure',
            'Creates folders and documents matching the ZIP hierarchy',
            'Requires both create:document and create:folder permissions',
          ]} />
          <SubHeading>Export (Download ZIP)</SubHeading>
          <BulletList items={[
            'Request an export via POST /organization/export',
            'The API packages all org documents into a ZIP asynchronously',
            'Status tracked via OrgExport model (pending → processing → ready → failed)',
            'Download the ready ZIP from GET /organization/exports/:id/download',
            'Exports auto-expire after ZIP_EXPIRY_HOURS (default: 24)',
          ]} />

          {/* ─── Security ─── */}
          <SectionHeading id="security">Security</SectionHeading>
          <BulletList items={[
            <><strong>Helmet</strong> — sets security headers (CSP, HSTS, etc.)</>,
            <><strong>Rate limiting</strong> — global limit on all endpoints; stricter on public share routes (20/min)</>,
            <><strong>CORS</strong> — configurable allowed origins</>,
            <><strong>Path traversal guard</strong> — file path resolution validates against the storage root</>,
            <><strong>MIME whitelist</strong> — only allowed file types can be uploaded</>,
            <><strong>Error sanitization</strong> — 500 errors return generic messages; details only in development</>,
            <><strong>JWT auth</strong> — stateless authentication with configurable expiry</>,
            <><strong>Permission middleware</strong> — every protected route checks role permissions via database</>,
            <><strong>Per-item authorization</strong> — owner bypass + per-item flags checked before mutations</>,
            <><strong>Input validation</strong> — express-validator on all route inputs</>,
          ]} />

          {/* ─── Deployment ─── */}
          <SectionHeading id="deployment">Deployment</SectionHeading>
          <SubHeading>Docker Compose (recommended)</SubHeading>
          <CodeBlock title="Terminal">{`cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, RESEND_API_KEY, APP_URL
docker compose up --build`}</CodeBlock>
          <Paragraph>
            Two services: <strong>omni-doc-api</strong> (Node.js Express, port 3000 internal) and <strong>omni-doc-app</strong> (nginx + React build).
            Migrations run automatically on API startup.
          </Paragraph>
          <SubHeading>Environment Variables</SubHeading>
          <Table
            headers={['Variable', 'Required', 'Default', 'Description']}
            rows={[
              ['DATABASE_URL', 'Yes', '—', 'MySQL connection string'],
              ['JWT_SECRET', 'Yes', '—', 'JWT signing key'],
              ['JWT_EXPIRES_IN', 'No', '7d', 'JWT token expiry'],
              ['CORS_ORIGIN', 'No', '*', 'Allowed CORS origins'],
              ['RESEND_API_KEY', 'No', '—', 'Resend API key for emails'],
              ['EMAIL_FROM', 'No', 'onboarding@resend.dev', 'Sender email address'],
              ['APP_URL', 'No', 'http://localhost:5173', 'Frontend URL (used in emails)'],
              ['STORAGE_PATH', 'No', '../../uploads', 'File storage directory'],
              ['TRASH_RETENTION_DAYS', 'No', '30', 'Days before trash is purged'],
              ['ORG_RETENTION_DAYS', 'No', '30', 'Days before deleted orgs are purged'],
              ['ZIP_EXPIRY_HOURS', 'No', '24', 'Hours until export ZIPs expire'],
            ]}
          />
          <SubHeading>Local Development</SubHeading>
          <CodeBlock title="Terminal">{`# Terminal 1 — API
cd api && npm install && npm run dev

# Terminal 2 — App
cd app && npm install && npm run dev`}</CodeBlock>

          {/* ─── Schema ─── */}
          <SectionHeading id="schema">Database Schema</SectionHeading>
          <CodeBlock title="Entity Relationships">{`Organization ─┬── User ──── Role ──── RolePermission ──── Permission
               ├── Folder ─┬── DocumentFolder ──── Document
               │            ├── FolderInvite
               │            └── ShareLink
               ├── Document ┬── DocumentInvite
               │             └── ShareLink
               ├── Category
               └── OrgExport

User ──── PasswordResetToken
User ──── EmailVerificationToken`}</CodeBlock>
          <Table
            headers={['Model', 'Key Fields', 'Description']}
            rows={[
              ['Organization', 'name, slug, storagePath, deletedAt', 'Tenant container'],
              ['User', 'email, firstName, lastName, roleId, isActive', 'Team member'],
              ['Role', 'name, isSystem, isDefault', 'Permission group'],
              ['Permission', 'action, subject', 'Atomic permission (e.g. create:document)'],
              ['RolePermission', 'roleId, permissionId', 'Many-to-many link'],
              ['Document', 'uuid, originalName, mimeType, isPrivate, allow* flags', 'Uploaded file'],
              ['Folder', 'uuid, name, parentId, isPrivate, allow* flags', 'Document container'],
              ['DocumentFolder', 'documentId, folderId', 'Document-to-folder mapping'],
              ['FolderInvite', 'folderId, invitedUserId, permission', 'User access to folder'],
              ['DocumentInvite', 'documentId, invitedUserId, permission', 'User access to document'],
              ['ShareLink', 'token, documentId/folderId, password, expiresAt', 'Public access link'],
              ['Category', 'name, icon, color, parentId', 'Document classification'],
              ['OrgExport', 'status, filePath, expiresAt', 'Bulk data export'],
            ]}
          />

          {/* ─── License ─── */}
          <div className="mt-16 rounded-lg border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <a href="https://github.com/slient-commit/omni-doc/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary">
                Source-Available Non-Commercial &amp; No-SaaS License
              </a>
              {' '}&copy; {new Date().getFullYear()} MOURCHID Mohamed Kamal
            </p>
          </div>

          {/* Back to top */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowUp className="size-4" /> Back to top
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
