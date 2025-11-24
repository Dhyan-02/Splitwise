// src/controllers/userController.js
import { supabase } from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { sendMail } from '../services/mailer.js';

export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Check for duplicate username
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, password_hash, full_name }])
      .select('username, email, full_name, created_at');

    if (error) throw error;

    // Generate JWT token
    const token = generateToken({ username, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: data[0],
      token
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('username, email, password_hash, full_name')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({ username: user.username, email: user.email });

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
        full_name: user.full_name
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, email, full_name, created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, email, full_name, created_at')
      .eq('username', req.user.username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Password reset (email via SMTP)
const RESET_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Debug function to check email in database
const debugCheckEmail = async (email) => {
  console.log('\n[DEBUG] 🔍 DATABASE QUERY FOR EMAIL:');
  console.log('  Query: SELECT username, email FROM users WHERE email = ?');
  console.log('  Email:', email);
  
  try {
    const { data: user, error: userError, count } = await supabase
      .from('users')
      .select('username, email, full_name, created_at', { count: 'exact' })
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.log('  ❌ Database Query Error:', userError.message);
      console.log('  Error Code:', userError.code);
      console.log('  Error Details:', userError);
      return { found: false, error: userError, user: null };
    }

    if (!user) {
      console.log('  ❌ RESULT: Email NOT FOUND in database');
      console.log('  Status: User does not exist with this email address');
      return { found: false, error: null, user: null };
    }

    console.log('  ✅ RESULT: Email FOUND in database');
    console.log('  User Details:');
    console.log('    Username:', user.username);
    console.log('    Email:', user.email);
    console.log('    Full Name:', user.full_name || '(not set)');
    console.log('    Created At:', user.created_at || '(not set)');
    return { found: true, error: null, user };
  } catch (err) {
    console.log('  ❌ Exception during database query:', err.message);
    return { found: false, error: err, user: null };
  }
};

export const forgotPassword = async (req, res, next) => {
  let emailStatus = { found: false, sent: false, error: null };
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('[forgotPassword] 📥 FORGOT PASSWORD REQUEST RECEIVED');
    console.log('='.repeat(80));
    
    const { email } = req.body;
    console.log('[forgotPassword] Email from request:', email);
    
    if (!email) {
      console.log('[forgotPassword] ❌ Email is missing in request body');
      return res.status(400).json({ error: 'Email is required' });
    }

    // DEBUG: Query database for email
    const dbResult = await debugCheckEmail(email);
    emailStatus.found = dbResult.found;
    
    if (dbResult.error) {
      console.error('[forgotPassword] ❌ Database query failed:', dbResult.error);
      throw dbResult.error;
    }

    // Always return success to avoid user enumeration
    if (!dbResult.found || !dbResult.user) {
      console.log('\n[forgotPassword] ⚠️  EMAIL NOT IN DATABASE');
      console.log('[forgotPassword] ✅ Returning generic success message (security feature)');
      console.log('[forgotPassword] 📊 FINAL STATUS:');
      console.log('  Email Found in DB: ❌ NO');
      console.log('  Email Sent: ❌ NO (user not found)');
      console.log('='.repeat(80) + '\n');
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const user = dbResult.user;
    console.log('\n[forgotPassword] ✅ USER FOUND IN DATABASE');
    console.log('[forgotPassword] User:', user.username, '(' + user.email + ')');

    console.log('\n[forgotPassword] 🔑 GENERATING RESET TOKEN...');
    console.log('  RESET_SECRET configured:', !!RESET_SECRET);
    console.log('  APP_URL:', APP_URL);
    
    // Short-lived token
    const token = jwt.sign({ username: user.username, email: user.email, type: 'reset' }, RESET_SECRET, { expiresIn: '15m' });
    const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    
    console.log('[forgotPassword] ✅ Reset link generated');
    console.log('  Reset Link:', resetLink);
    console.log('  Token Length:', token.length, 'characters');
    console.log('  Token Expires: 15 minutes from now');

    console.log('\n[forgotPassword] 📧 ATTEMPTING TO SEND EMAIL...');
    console.log('  To:', user.email);
    console.log('  Subject: Reset your TripSync password');
    
    try {
      const emailResult = await sendMail({
        to: user.email,
        subject: 'Reset your TripSync password',
        html: `
          <p>Hello @${user.username},</p>
          <p>Click the link below to reset your password (valid for 15 minutes):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
      
      emailStatus.sent = true;
      console.log('\n[forgotPassword] ✅✅✅ EMAIL SENT SUCCESSFULLY ✅✅✅');
      console.log('  Message ID:', emailResult?.messageId);
      console.log('  Server Response:', emailResult?.response);
      console.log('  Accepted Recipients:', emailResult?.accepted);
      console.log('  Rejected Recipients:', emailResult?.rejected);
      
    } catch (emailError) {
      emailStatus.error = emailError;
      emailStatus.sent = false;
      console.error('\n[forgotPassword] ❌❌❌ FAILED TO SEND EMAIL ❌❌❌');
      console.error('  Error Message:', emailError.message);
      console.error('  Error Code:', emailError.code);
      console.error('  Error Command:', emailError.command);
      if (emailError.response) {
        console.error('  Server Response:', emailError.response);
      }
      if (emailError.responseCode) {
        console.error('  Response Code:', emailError.responseCode);
      }
      if (emailError.stack) {
        console.error('  Stack Trace:', emailError.stack);
      }
      // Don't throw here - we still want to return success to avoid user enumeration
      // But log the error for debugging
    }

    console.log('\n[forgotPassword] 📊 FINAL STATUS SUMMARY:');
    console.log('  Email Found in DB: ' + (emailStatus.found ? '✅ YES' : '❌ NO'));
    console.log('  Email Sent: ' + (emailStatus.sent ? '✅ YES' : '❌ NO'));
    if (emailStatus.error) {
      console.log('  Error: ❌ ' + emailStatus.error.message);
    }
    console.log('='.repeat(80) + '\n');

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('\n[forgotPassword] ❌ UNHANDLED ERROR:');
    console.error('  Error:', err.message);
    console.error('  Stack:', err.stack);
    console.log('[forgotPassword] 📊 FINAL STATUS:');
    console.log('  Email Found in DB: ' + (emailStatus.found ? '✅ YES' : '❌ NO'));
    console.log('  Email Sent: ❌ NO (error occurred)');
    console.log('='.repeat(80) + '\n');
    next(err);
  }
};

// Debug endpoint to check email in database (for testing only)
export const debugCheckEmailInDB = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email query parameter is required',
        usage: 'GET /api/users/debug/check-email?email=test@example.com'
      });
    }

    console.log('\n[DEBUG ENDPOINT] 🔍 Checking email in database...');
    const result = await debugCheckEmail(email);
    
    const response = {
      email,
      foundInDatabase: result.found,
      user: result.user ? {
        username: result.user.username,
        email: result.user.email,
        full_name: result.user.full_name,
        created_at: result.user.created_at
      } : null,
      error: result.error ? {
        message: result.error.message,
        code: result.error.code
      } : null,
      timestamp: new Date().toISOString()
    };

    if (result.found) {
      console.log('[DEBUG ENDPOINT] ✅ Email found in database');
    } else {
      console.log('[DEBUG ENDPOINT] ❌ Email NOT found in database');
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });

    let payload;
    try {
      payload = jwt.verify(token, RESET_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    if (payload?.type !== 'reset' || !payload?.username) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const password_hash = await hashPassword(new_password);
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('username', payload.username);
    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};