// src/components/trips/ExpensesTab.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaRupeeSign } from 'react-icons/fa';
import { expensesAPI, tripsAPI, paymentsAPI } from '../../services/api';
import { AddExpenseModal } from './AddExpenseModal';

const formatINR = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return '₹0.00';
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
};

const SafeJSONUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const Avatar = ({ name = '', size = 44 }) => {
  const initials = (name || 'U').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(236,72,153,0.95))'
      }}
      aria-hidden
    >
      <span style={{ fontSize: Math.round(size / 2.4) }}>{initials}</span>
    </div>
  );
};

export const ExpensesTab = ({ tripId }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetExpense, setTargetExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // changed to allow multiple open details
  const [expandedIds, setExpandedIds] = useState([]);

  const currentUser = useMemo(() => SafeJSONUser(), []);

  const loadMembers = useCallback(async () => {
    try {
      const membersRes = await tripsAPI.getMembers(tripId);
      setMembers(membersRes?.data || []);
    } catch (error) {
      console.error('Failed to load members', error);
    }
  }, [tripId]);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getTripExpenses(tripId);
      setExpenses(response?.data || []);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadExpenses();
    loadMembers();
  }, [loadExpenses, loadMembers]);

  const openDeleteConfirm = (expense) => {
    setTargetExpense(expense);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!targetExpense) return;
    try {
      setDeleting(true);
      await expensesAPI.delete(targetExpense.id);
      toast.success('Expense deleted');
      setConfirmOpen(false);
      setTargetExpense(null);
      await loadExpenses();
      try {
        await paymentsAPI.reset(tripId, { mode: 'soft' });
      } catch (error) {
        console.error('Failed to sync payments after expense delete', error);
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const totalExpenses = useMemo(
    () =>
      expenses.reduce((sum, e) => {
        const amt = parseFloat(e?.amount || 0);
        return sum + (Number.isFinite(amt) ? amt : 0);
      }, 0),
    [expenses]
  );

  // toggle a single expense id inside expandedIds
  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">Expenses</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold text-primary-600">{formatINR(totalExpenses)}</span>
            </p>
          </div>

          {/* Desktop action - hidden on xs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              aria-label="Add expense"
            >
              <FaPlus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {expenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <FaRupeeSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No expenses yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenses.map((expense) => {
            const isOwner = expense?.payer_username === currentUser?.username;
            const amount = parseFloat(expense?.amount || 0);
            const isExpanded = expandedIds.includes(expense.id);

            return (
              <motion.article
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="relative overflow-visible bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-5 flex flex-col gap-3"
                aria-labelledby={`expense-${expense.id}-title`}
                style={{ borderLeft: '4px solid rgba(99,102,241,0.95)' }} // left accent
              >
                {/* subtle colored overlay top-left (decorative) */}
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.08))' }} aria-hidden />

                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <Avatar name={expense.payer_username} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 id={`expense-${expense.id}-title`} className="text-md font-semibold text-gray-900 dark:text-white truncate">
                      {expense.description || 'No description'}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Paid by <span className="font-medium text-gray-800 dark:text-gray-200">{expense.payer_username}</span>
                      <span className="mx-2 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{(expense.participants && expense.participants.length) || 0} participants</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-primary-600">{formatINR(amount)}</div>
                    <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                      {expense.timestamp ? new Date(expense.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className={`mt-2 text-sm text-gray-600 dark:text-gray-400 ${isExpanded ? 'block' : 'hidden'} sm:block`} id={`expense-${expense.id}-details`}>
                  <p className="mb-1"><span className="font-medium">Participants:</span> {(expense.participants && expense.participants.join(', ')) || '—'}</p>
                  {expense.category && (
                    <div className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200">
                      {expense.category}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {expense.timestamp ? new Date(expense.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                  </div>
                </div>

                {/* Mobile details toggle (now independent per card) */}
                <div className="sm:hidden mt-2">
                  <button
                    onClick={() => toggleExpanded(expense.id)}
                    className="text-xs text-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-200 rounded"
                    aria-expanded={isExpanded}
                    aria-controls={`expense-${expense.id}-details`}
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>
                </div>

                {/* Delete button placed at right-bottom corner of card */}
                {isOwner && (
                  <button
                    onClick={() => openDeleteConfirm(expense)}
                    aria-label={`Delete expense ${expense.description || ''}`}
                    title="Delete"
                    className="absolute right-3 bottom-3 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 transition"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <FaTrash className="h-4 w-4 text-red-600" />
                  </button>
                )}
              </motion.article>
            );
          })}
        </div>
      )}

      {/* AddExpenseModal */}
      <AddExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadExpenses}
        tripId={tripId}
        members={members}
      />

      {/* Floating Add button for mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button
          onClick={() => setShowModal(true)}
          aria-label="Add expense"
          className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
        >
          <FaPlus className="h-5 w-5" />
        </button>
      </div>

      {/* Confirm delete modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Expense</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this expense? This action cannot be undone.</p>

            {targetExpense && (
              <div className="mt-3 text-sm text-gray-800 dark:text-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium">{targetExpense.description || 'No description'}</span>
                  <span className="font-semibold text-primary-600">{formatINR(parseFloat(targetExpense.amount || 0))}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Paid by {targetExpense.payer_username}</p>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setTargetExpense(null);
                }}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
