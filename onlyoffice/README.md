# ONLYOFFICE Document Server — Omni Doc

Standalone ONLYOFFICE Document Server for previewing Office documents (docx, xlsx, pptx, etc.) within Omni Doc.

## Setup

```bash
cd onlyoffice
cp .env.example .env    # set ONLYOFFICE_JWT_SECRET (same value in main .env)
docker compose up -d
```

The server is available at `http://localhost:8088` (HTTP) or `https://localhost:8443` (HTTPS, self-signed).

## Production (Dokploy / Traefik)

Deploy as a separate Compose application in Dokploy and assign a domain (e.g. `office.yourdomain.com`). Both the main app and ONLYOFFICE must share the `dokploy-network`.

Set in the main app's `.env`:

```
ONLYOFFICE_URL=https://office.yourdomain.com
ONLYOFFICE_JWT_SECRET=same-secret-here
```

## How it works

1. User opens a docx/xlsx/pptx in Omni Doc
2. Frontend loads the ONLYOFFICE JS API from `ONLYOFFICE_URL`
3. ONLYOFFICE fetches the file from Omni Doc's download endpoint (callback URL)
4. Document renders in the browser via ONLYOFFICE editor in view-only mode
