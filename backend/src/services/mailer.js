// src/services/mailer.js
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = (process.env.SMTP_SECURE || 'false') === 'true';
const FROM_NAME = process.env.FROM_NAME || 'TripSync';
// IMPORTANT: For Gmail, FROM_EMAIL must match SMTP_USER or email will be rejected
const FROM_EMAIL_ENV = process.env.FROM_EMAIL;
const FROM_EMAIL = FROM_EMAIL_ENV || SMTP_USER;

// Check for mismatch (Gmail requires FROM_EMAIL to match SMTP_USER)
if (FROM_EMAIL_ENV && FROM_EMAIL_ENV !== SMTP_USER && SMTP_HOST.includes('gmail.com')) {
  console.warn('[mailer] ⚠️  WARNING: FROM_EMAIL does not match SMTP_USER!');
  console.warn('  SMTP_USER:', SMTP_USER);
  console.warn('  FROM_EMAIL:', FROM_EMAIL_ENV);
  console.warn('  Gmail will reject emails if FROM_EMAIL differs from SMTP_USER.');
  console.warn('  Using SMTP_USER as FROM_EMAIL to avoid rejection.');
}

// Debug: Log SMTP configuration (mask password)
console.log('[mailer] SMTP Configuration:');
console.log('  SMTP_HOST:', SMTP_HOST);
console.log('  SMTP_PORT:', SMTP_PORT);
console.log('  SMTP_USER:', SMTP_USER || '(NOT SET)');
console.log('  SMTP_PASS:', SMTP_PASS ? '***SET***' : '(NOT SET)');
console.log('  SMTP_SECURE:', SMTP_SECURE);
console.log('  FROM_EMAIL:', FROM_EMAIL || '(NOT SET)');
if (SMTP_HOST.includes('gmail.com')) {
  console.log('  ⚠️  Using SMTP_USER as FROM_EMAIL (Gmail requirement)');
}

if (!SMTP_USER || !SMTP_PASS) {
  console.error('[mailer] ❌ ERROR: SMTP credentials are not set! Password reset emails will fail.');
  console.error('  Please set SMTP_USER and SMTP_PASS in your .env file');
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[mailer] ❌ SMTP connection verification failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Command:', error.command);
    if (error.response) {
      console.error('  Server Response:', error.response);
    }
  } else {
    console.log('[mailer] ✅ SMTP connection verified successfully');
  }
});

export const sendMail = async ({ to, subject, html }) => {
  console.log('[mailer] 📧 Attempting to send email...');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  
  // For Gmail, FROM_EMAIL must match SMTP_USER or email will be rejected
  const actualFromEmail = (SMTP_HOST.includes('gmail.com') && FROM_EMAIL !== SMTP_USER) 
    ? SMTP_USER 
    : FROM_EMAIL;
  
  const fromAddress = `${FROM_NAME} <${actualFromEmail}>`;
  console.log('  From:', fromAddress);
  if (SMTP_HOST.includes('gmail.com') && actualFromEmail !== FROM_EMAIL) {
    console.log('  ⚠️  Using SMTP_USER as FROM_EMAIL (Gmail requirement)');
  }
  
  try {
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
    };
    
    console.log('[mailer] Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html?.length || 0,
    });
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('[mailer] ✅ Email sent successfully!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    
    return info;
  } catch (error) {
    console.error('[mailer] ❌ Failed to send email:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Command:', error.command);
    if (error.response) {
      console.error('  Server Response:', error.response);
    }
    if (error.responseCode) {
      console.error('  Response Code:', error.responseCode);
    }
    throw error;
  }
};


