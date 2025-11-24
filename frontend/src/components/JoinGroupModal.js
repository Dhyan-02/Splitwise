// src/components/JoinGroupModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { groupsAPI } from '../services/api';

export const JoinGroupModal = ({ isOpen, onClose, onSuccess, groupId }) => {
  const [formData, setFormData] = useState({ password: '', groupId: groupId || '' });
  const [inviteInput, setInviteInput] = useState('');
  const [mode, setMode] = useState(groupId ? 'id' : 'invite'); // 'invite' | 'id'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const groupIdToJoin = groupId || formData.groupId;
    setLoading(true);

    try {
      if (!groupId && mode === 'invite') {
        // Accept either raw token or full URL
        const tokenMatch = inviteInput.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        const token = tokenMatch ? tokenMatch[0] : inviteInput.trim();
        if (!token) {
          toast.error('Please paste a valid invite token or link');
          setLoading(false);
          return;
        }
        await groupsAPI.joinByInvite(token);
        toast.success('Joined group successfully via invite!');
        setInviteInput('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const effectiveGroupId = groupIdToJoin;
        if (!effectiveGroupId) {
          toast.error('Please enter a group ID');
          setLoading(false);
          return;
        }
        await groupsAPI.join({
          group_id: effectiveGroupId,
          password: formData.password || undefined
        });
        toast.success('Joined group successfully!');
        setFormData({ password: '', groupId: '' });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join Group</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!groupId && (
                <div>
                  <div className="flex rounded-md bg-gray-100 dark:bg-gray-800 p-1 w-full">
                    <button
                      type="button"
                      onClick={() => setMode('invite')}
                      className={`flex-1 py-2 text-sm rounded-md ${mode === 'invite' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      Use Invite Link/Token
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('id')}
                      className={`flex-1 py-2 text-sm rounded-md ${mode === 'id' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      Use Group ID
                    </button>
                  </div>
                </div>
              )}

              {!groupId && mode === 'invite' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste invite link or token
                  </label>
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    className="input-field"
                    placeholder="e.g., https://app/… or eyJhbGciOiJI…"
                  />
                </div>
              )}

              {(groupId || mode === 'id') && (
                <>
                  {!groupId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Group ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.groupId}
                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                        className="input-field"
                        placeholder="Enter group ID"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group Password (if required)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field pr-10"
                        placeholder="Enter group password (leave empty if public)"
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
                </>
              )}

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};