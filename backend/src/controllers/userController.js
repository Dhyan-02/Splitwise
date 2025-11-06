// src/controllers/userController.js
import { supabase } from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../middleware/auth.js';

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