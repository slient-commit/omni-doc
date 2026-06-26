'use strict';

const { Resend } = require('resend');
const config = require('../config');

let resend = null;
if (config.resendApiKey) {
  resend = new Resend(config.resendApiKey);
} else {
  console.warn('[email] RESEND_API_KEY not set — emails will be logged to console only.');
}

async function sendVerificationEmail(to, token) {
  const url = `${config.appUrl}/verify-email?token=${token}`;
  if (!resend) {
    console.log(`[email] Verification email for ${to}: ${url}`);
    return;
  }
  try {
    await resend.emails.send({
      from: config.emailFrom,
      to,
      subject: 'Verify your email — Omni Doc',
      html: `
        <h2>Welcome to Omni Doc</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${url}">${url}</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send verification email:', err.message);
  }
}

async function sendPasswordResetEmail(to, token) {
  const url = `${config.appUrl}/reset-password?token=${token}`;
  if (!resend) {
    console.log(`[email] Password reset email for ${to}: ${url}`);
    return;
  }
  try {
    await resend.emails.send({
      from: config.emailFrom,
      to,
      subject: 'Reset your password — Omni Doc',
      html: `
        <h2>Password reset</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}">${url}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send password reset email:', err.message);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
