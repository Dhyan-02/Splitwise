// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaUsers, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authAPI } from '../services/api';

export const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      toast.success('Login successful!');
      setErrorMessage('');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Invalid credentials';
      toast.error(message);
      setShowInvalid(true);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      toast.error('Please enter your email first.');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword({ email: forgotEmail.trim() });
      toast.success('If the email exists, a reset link has been sent.');
      setForgotOpen(false);
      setForgotEmail('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full"
      >
        <div className="text-center mb-6">
          <FaUsers className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign up
          </Link>
        </p>

        <div className="mt-2 text-center">
          <button onClick={() => setForgotOpen(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</button>
        </div>
      </motion.div>

      {showInvalid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invalid credentials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">The username or password you entered is incorrect.</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setShowInvalid(false)}>Close</button>
              <button className="btn-primary flex-1" onClick={() => { setShowInvalid(false); setForgotOpen(true); }}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reset Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Enter your email to receive reset instructions.</p>
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="input-field mt-3" placeholder="you@example.com" />
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setForgotOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={forgotLoading}
                onClick={handleForgotSubmit}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
