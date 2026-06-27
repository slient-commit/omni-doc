<p align="center">
  <img src="app/public/logo/logo.svg" alt="Omni Doc" width="48" height="48" />
</p>

<h1 align="center">Omni Doc</h1>

<p align="center">
  A self-hosted document management platform built for teams.<br />
  Upload, organize, preview, and share files with fine-grained access control.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="DOCS.md">Full Documentation</a> &middot;
  <a href="LICENSE">License</a>
</p>

---

## Features

- **File explorer interface** — grid/list views, breadcrumbs, context menus, drag-like UX
- **Granular permissions** — 27 permission types across custom roles; per-item edit/delete/move/copy flags
- **Privacy controls** — make any file or folder private; cascades to subfolders
- **Flexible sharing** — invite org users (view/edit), create password-protected public links with expiry, or email a share link
- **Multi-tenant** — isolated orgs with their own users, roles, storage, and settings
- **Document preview** — inline preview for PDF, images, video, audio, and text files
- **ZIP import/export** — upload a ZIP to extract folder structures; export your entire org as a downloadable ZIP
- **Soft-delete & trash** — configurable retention period with automatic cleanup via daily cron
- **Organization lifecycle** — soft-delete with recovery period before permanent removal
- **Transactional emails** — verification, invite, password reset, and share notifications via Resend

## Tech Stack

| Layer | Stack |
|-------|-------|
| **API** | Express.js, Prisma ORM, MySQL |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Email** | Resend |
| **Deployment** | Docker Compose (nginx + Node.js) |

## Quick Start

```bash
git clone https://github.com/slient-commit/omni-doc.git
cd omni-doc
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, etc.
docker compose up --build
```

The app is served at **http://localhost:8080** (API at `/api`).

> MySQL is external — point `DATABASE_URL` to your MySQL instance. Migrations run automatically on startup.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | MySQL connection string |
| `JWT_SECRET` | Yes | — | JWT signing key |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiry |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `RESEND_API_KEY` | No | — | Resend API key for emails |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Sender email address |
| `APP_URL` | No | `http://localhost:5173` | Frontend URL (used in emails) |
| `STORAGE_PATH` | No | `../../uploads` | File storage directory |
| `TRASH_RETENTION_DAYS` | No | `30` | Days before trash is purged |
| `ORG_RETENTION_DAYS` | No | `30` | Days before deleted orgs are purged |
| `ZIP_EXPIRY_HOURS` | No | `24` | Hours until export ZIPs expire |

## Project Structure

```
omni-doc/
├── api/                   # Express REST API
│   ├── prisma/            # Schema & migrations
│   ├── src/
│   │   ├── config/        # Environment config
│   │   ├── controllers/   # Request handlers
│   │   ├── lib/           # Shared utilities (upload, email, auth, visibility)
│   │   ├── middleware/     # Auth, permissions, validation, error handling
│   │   ├── routes/        # Route definitions
│   │   └── services/      # Business logic
│   └── Dockerfile
├── app/                   # React frontend
│   ├── src/
│   │   ├── components/    # UI components, dialogs, file explorer
│   │   ├── contexts/      # Auth context
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── lib/           # API client, formatters, utilities
│   │   ├── pages/         # Route pages
│   │   └── types/         # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Local Development

**API** (Node.js >= 14):
```bash
cd api && npm install
cp .env.example .env       # set DATABASE_URL
npm run dev                # http://localhost:3000
```

**App** (Node.js >= 20.9):
```bash
cd app && npm install
npm run dev                # http://localhost:5173
```

See [Full Documentation](DOCS.md) for API reference, permission system details, and architecture.

## License

[Source-Available Non-Commercial & No-SaaS License](LICENSE) &copy; 2026 MOURCHID Mohamed Kamal
