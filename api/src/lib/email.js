'use strict';

const { Resend } = require('resend');
const config = require('../config');

let resend = null;
if (config.resendApiKey) {
  resend = new Resend(config.resendApiKey);
} else {
  console.warn('[email] RESEND_API_KEY not set — emails will be logged to console only.');
}

// ponytail: shared HTML email wrapper — consistent branding across all emails
function wrap(content) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <!-- Header -->
  <tr><td style="background:#18181b;padding:24px 32px;">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Omni Doc</h1>
  </td></tr>
  <!-- Content -->
  <tr><td style="padding:32px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;background:#fafafa;">
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
      <strong>The Omni Doc Team</strong>
    </p>
    <p style="margin:0;font-size:12px;color:#a1a1aa;">
      Omni Doc is a secure document management platform that helps teams organize, share, and collaborate on files effortlessly.
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#d4d4d8;">
      You received this email because your address is associated with an Omni Doc account. If you didn't expect this, you can safely ignore it.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function button(url, label) {
  return `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;margin:8px 0;">${label}</a>`;
}

// --- Registration verification ---
async function sendVerificationEmail(to, token) {
  const url = `${config.appUrl}/verify-email?token=${token}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#18181b;">Welcome to Omni Doc!</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      We're excited to have you on board. Omni Doc helps you organize, manage, and securely share your documents — all in one place.
    </p>
    <p style="margin:0 0 4px;color:#52525b;font-size:15px;">
      To get started, please verify your email address:
    </p>
    <p style="margin:16px 0;">${button(url, 'Verify my email')}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">
      Or copy this link: <a href="${url}" style="color:#2563eb;word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#a1a1aa;">This link expires in 24 hours.</p>
  `);

  if (!resend) { console.log(`[email] Verification for ${to}: ${url}`); return; }
  try {
    await resend.emails.send({ from: config.emailFrom, to, subject: 'Welcome to Omni Doc — Verify your email', html });
  } catch (err) { console.error('[email] Verification failed:', err.message); }
}

// --- Invited user (needs to set password) ---
async function sendInviteEmail(to, token, inviterName, orgName) {
  const url = `${config.appUrl}/verify-email?token=${token}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#18181b;">You've been invited!</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Omni Doc.
    </p>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      Omni Doc is a secure document management platform where your team can upload, organize, and share files with ease. Here's what you can do:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#52525b;font-size:14px;line-height:1.8;">
      <li>Upload and preview documents (PDF, images, Office files)</li>
      <li>Organize files in folders with drag-and-drop simplicity</li>
      <li>Share documents securely with teammates or via public links</li>
      <li>Control access with granular roles and permissions</li>
    </ul>
    <p style="margin:0 0 4px;color:#52525b;font-size:15px;">
      Click below to verify your email and set your password:
    </p>
    <p style="margin:16px 0;">${button(url, 'Accept invitation')}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">
      Or copy this link: <a href="${url}" style="color:#2563eb;word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#a1a1aa;">This link expires in 24 hours.</p>
  `);

  if (!resend) { console.log(`[email] Invite for ${to}: ${url}`); return; }
  try {
    await resend.emails.send({ from: config.emailFrom, to, subject: `${inviterName} invited you to ${orgName} on Omni Doc`, html });
  } catch (err) { console.error('[email] Invite failed:', err.message); }
}

// --- Password reset ---
async function sendPasswordResetEmail(to, token) {
  const url = `${config.appUrl}/reset-password?token=${token}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#18181b;">Reset your password</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      We received a request to reset your password. If you made this request, click the button below:
    </p>
    <p style="margin:16px 0;">${button(url, 'Reset password')}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">
      Or copy this link: <a href="${url}" style="color:#2563eb;word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#a1a1aa;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  `);

  if (!resend) { console.log(`[email] Reset for ${to}: ${url}`); return; }
  try {
    await resend.emails.send({ from: config.emailFrom, to, subject: 'Reset your password — Omni Doc', html });
  } catch (err) { console.error('[email] Reset failed:', err.message); }
}

// --- Public email share (external recipients) ---
async function sendShareEmail({ to, shareUrl, itemName, itemType, senderName, expiresAt }) {
  const expiryText = expiresAt
    ? `This link expires on <strong>${new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</strong>.`
    : 'This link does not expire.';

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#18181b;">A ${itemType} has been shared with you</h2>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      <strong>${senderName}</strong> has shared a ${itemType} with you:
    </p>
    <div style="margin:0 0 16px;padding:16px;background:#f4f4f5;border-radius:8px;border:1px solid #e4e4e7;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">${itemName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#71717a;">Shared ${itemType}</p>
    </div>
    <p style="margin:16px 0;">${button(shareUrl, `View ${itemType}`)}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">
      Or copy this link: <a href="${shareUrl}" style="color:#2563eb;word-break:break-all;">${shareUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#a1a1aa;">${expiryText}</p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;">
    <h3 style="margin:0 0 8px;font-size:16px;color:#18181b;">What is Omni Doc?</h3>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
      Omni Doc is a secure document management platform that helps teams organize, share, and collaborate on files.
      It supports document preview, role-based access, folder organization, and secure sharing — all from your browser.
    </p>
  `);

  if (!resend) { console.log(`[email] Share email to ${Array.isArray(to) ? to.join(', ') : to}: ${shareUrl}`); return; }
  try {
    const recipients = Array.isArray(to) ? to : [to];
    for (const recipient of recipients) {
      await resend.emails.send({
        from: config.emailFrom,
        to: recipient,
        subject: `${senderName} shared a ${itemType} with you — Omni Doc`,
        html,
      });
    }
  } catch (err) { console.error('[email] Share email failed:', err.message); }
}

module.exports = { sendVerificationEmail, sendInviteEmail, sendPasswordResetEmail, sendShareEmail };
