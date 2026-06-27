# ONLYOFFICE Document Server — Omni Doc

Standalone ONLYOFFICE Document Server for previewing Office documents (docx, xlsx, pptx, etc.).

## Dokploy Deployment

1. Create a **separate** Compose application in Dokploy using `onlyoffice/docker-compose.yml`
2. Assign a domain (e.g. `office.yourdomain.com`) with HTTPS
3. Set this env var in the **ONLYOFFICE** Dokploy app:
   - `ONLYOFFICE_JWT_SECRET` — shared secret for signing editor tokens
4. Set these env vars in the **main omni-doc** Dokploy app:
   - `ONLYOFFICE_URL=https://office.yourdomain.com`
   - `ONLYOFFICE_JWT_SECRET=same-secret-as-above`

Both apps must share the `dokploy-network`.

## Local Development

```bash
cd onlyoffice
# Set ONLYOFFICE_JWT_SECRET as an env var, then:
docker compose up -d
```

Available at `http://localhost:8088`. Set `ONLYOFFICE_URL=http://localhost:8088` and `ONLYOFFICE_JWT_SECRET` in your root `.env`.

## How it works

1. User opens a docx/xlsx/pptx in Omni Doc
2. API returns a signed editor config with a short-lived download URL
3. Frontend loads ONLYOFFICE JS API from the ONLYOFFICE domain
4. ONLYOFFICE fetches the file from the API and renders it in view-only mode
