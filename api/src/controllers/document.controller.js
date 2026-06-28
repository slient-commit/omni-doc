'use strict';

const documentService = require('../services/document.service');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'File is required' } });
    }
    const doc = await documentService.upload({
      file: req.file,
      documentDate: req.body.documentDate || new Date().toISOString(),
      categoryId: req.body.categoryId,
      folderId: req.body.folderId,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
      isPrivate: req.body.isPrivate,
      allowEdit: req.body.allowEdit,
      allowDelete: req.body.allowDelete,
      allowMove: req.body.allowMove,
      allowCopy: req.body.allowCopy,
      metadata: req.body.metadata,
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const docs = await documentService.list({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      folderId: req.query.folderId,
      categoryId: req.query.categoryId,
      search: req.query.search,
      createdById: req.query.createdById,
      sharedWithMe: req.query.sharedWithMe === 'true',
    });
    res.json(docs);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const doc = await documentService.getById({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.json(doc);
  } catch (err) { next(err); }
}

async function download(req, res, next) {
  try {
    const { absolutePath, originalName } = await documentService.getDownloadInfo({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    if (req.query.preview === 'true') {
      // ponytail: inline display for preview — browser renders instead of downloading
      const mimeType = require('path').extname(originalName);
      const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.txt': 'text/plain', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
      res.setHeader('Content-Type', mimeMap[mimeType.toLowerCase()] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
      require('fs').createReadStream(absolutePath).pipe(res);
    } else {
      res.download(absolutePath, originalName);
    }
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const doc = await documentService.update({
      id: req.params.id,
      ...req.body,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(doc);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await documentService.softDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function hardDelete(req, res, next) {
  try {
    const result = await documentService.hardDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function restore(req, res, next) {
  try {
    const result = await documentService.restore({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function move(req, res, next) {
  try {
    const result = await documentService.move({
      id: req.params.id,
      folderIds: req.body.folderIds,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function copyToFolder(req, res, next) {
  try {
    const result = await documentService.copyToFolder({
      id: req.params.id,
      targetFolderId: req.body.targetFolderId || null,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function uploadZip(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'ZIP file is required' } });
    const { extractZip } = require('../services/zip-upload.service');
    const result = await extractZip({
      zipPath: req.file.path,
      parentFolderId: req.body.folderId || null,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
      isPrivate: req.body.isPrivate,
      allowEdit: req.body.allowEdit,
      allowDelete: req.body.allowDelete,
      allowMove: req.body.allowMove,
      allowCopy: req.body.allowCopy,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// ponytail: serves a self-contained HTML page with ONLYOFFICE editor — iframe this from the frontend
async function officeViewer(req, res, next) {
  try {
    const config = require('../config');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');

    if (!config.onlyofficeUrl || !config.onlyofficeJwtSecret) {
      return res.status(501).send('ONLYOFFICE is not configured');
    }

    const doc = await documentService.getById({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    const ext = doc.originalName.split('.').pop()?.toLowerCase() || '';
    const typeMap = {
      docx: 'word', doc: 'word', odt: 'word', rtf: 'word', txt: 'word',
      xlsx: 'cell', xls: 'cell', ods: 'cell', csv: 'cell',
      pptx: 'slide', ppt: 'slide', odp: 'slide',
    };
    const documentType = typeMap[ext];
    if (!documentType) {
      return res.status(400).send('File type not supported by ONLYOFFICE');
    }

    const fileToken = jwt.sign(
      { userId: req.user.id, organizationId: req.user.organizationId },
      config.jwtSecret,
      { expiresIn: '1h' },
    );

    const keySource = `${doc.uuid}${new Date(doc.updatedAt).getTime()}`;
    const documentKey = crypto.createHash('md5').update(keySource).digest('hex');

    const downloadUrl = `${config.appUrl}/api/documents/${doc.uuid}/download?token=${fileToken}`;
    const callbackUrl = `${config.appUrl}/api/documents/${doc.uuid}/onlyoffice-callback?token=${fileToken}`;

    const editorConfig = {
      document: {
        fileType: ext,
        key: documentKey,
        title: doc.originalName,
        url: downloadUrl,
        permissions: { edit: false, download: true, print: true },
      },
      documentType,
      editorConfig: {
        mode: 'view',
        callbackUrl,
        lang: 'en',
        customization: {
          forcesave: false,
          compactHeader: true,
          toolbarNoTabs: true,
          hideRightMenu: true,
        },
      },
    };

    const onlyofficeToken = jwt.sign(editorConfig, config.onlyofficeJwtSecret);
    editorConfig.token = onlyofficeToken;

    const apiUrl = `${config.onlyofficeUrl}/web-apps/apps/api/documents/api.js?shardkey=${encodeURIComponent(documentKey)}`;

    // ponytail: self-contained HTML — loads ONLYOFFICE api.js and mounts the editor
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${doc.originalName}</title>
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#f5f5f5}
#editor{height:100%}
#error{display:none;height:100%;align-items:center;justify-content:center;font-family:system-ui;color:#666;text-align:center;padding:2rem}
#error h3{margin:0 0 .5rem;color:#333}
#error p{margin:0;font-size:.875rem}
</style>
</head><body>
<div id="editor"></div>
<div id="error"><div><h3>Preview unavailable</h3><p id="errMsg">Could not load the document editor.</p></div></div>
<script src="${apiUrl}" onerror="showError('Cannot reach ONLYOFFICE Document Server')"></script>
<script>
function showError(msg){
  document.getElementById('editor').style.display='none';
  var el=document.getElementById('error');el.style.display='flex';
  if(msg)document.getElementById('errMsg').textContent=msg;
}
if(typeof DocsAPI!=='undefined'){
  try{
    new DocsAPI.DocEditor('editor',${JSON.stringify(editorConfig)});
  }catch(e){showError(e.message)}
}else if(!document.querySelector('script[onerror]')){showError()}
</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { next(err); }
}

// ponytail: ONLYOFFICE callback — called server-to-server when editing completes
// Status codes: 1=editing, 2=ready to save, 4=close no changes, 6=force save, 7=error
async function onlyofficeCallback(req, res, next) {
  try {
    const { status, url } = req.body;

    // Status 2 (save after close) or 6 (force save) — download edited file
    if ((status === 2 || status === 6) && url) {
      const fs = require('fs');
      const https = require('https');
      const http = require('http');
      const config = require('../config');
      const prisma = require('../lib/prisma');
      const { resolveFilePath } = require('../lib/filePath');
      const { resolveDocId, idOrUuidDoc } = require('../lib/resolveId');

      const resolvedId = await resolveDocId(req.params.id);
      if (!resolvedId) return res.json({ error: 0 });

      const doc = await prisma.document.findUnique({
        where: { id: resolvedId },
        include: { organization: { select: { storagePath: true } } },
      });
      if (!doc) return res.json({ error: 0 });

      const absolutePath = resolveFilePath(doc.organization.storagePath, doc.filePath);

      // Download the edited file from ONLYOFFICE
      const client = url.startsWith('https') ? https : http;
      await new Promise((resolve, reject) => {
        client.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: ${response.statusCode}`));
            return;
          }
          const ws = fs.createWriteStream(absolutePath);
          response.pipe(ws);
          ws.on('finish', resolve);
          ws.on('error', reject);
        }).on('error', reject);
      });

      // Update timestamp so the document key changes (bust ONLYOFFICE cache)
      await prisma.document.update({
        where: { id: doc.id },
        data: { updatedAt: new Date() },
      });
    }

    res.json({ error: 0 });
  } catch (err) {
    console.error('[onlyoffice-callback]', err.message);
    res.json({ error: 0 }); // ponytail: always return 0 — retries cause infinite loops
  }
}

module.exports = { upload, list, getById, download, update, softDelete, hardDelete, restore, move, copyToFolder, uploadZip, officeViewer, onlyofficeCallback };
