// src/components/trips/ExpensesTab.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaDollarSign } from 'react-icons/fa';
import { expensesAPI, groupsAPI, tripsAPI } from '../../services/api';
import { AddExpenseModal } from './AddExpenseModal';

export const ExpensesTab = ({ tripId }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadExpenses();
    loadMembers();
  }, [tripId]);

  const loadMembers = async () => {
    try {
      const tripRes = await tripsAPI.getById(tripId);
      const groupId = tripRes.data.groups?.id || tripRes.data.group_id;
      if (groupId) {
        const membersRes = await groupsAPI.getMembers(groupId);
        setMembers(membersRes.data);
      }
    } catch (error) {
      console.error('Failed to load members', error);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getTripExpenses(tripId);
      setExpenses(response.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await expensesAPI.delete(expenseId);
      toast.success('Expense deleted');
      loadExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (loading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total: <span className="font-semibold text-primary-600">Rs {totalExpenses.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus className="h-4 w-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="card text-center py-12">
            <FaDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No expenses yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {expense.description || 'No description'}
                  </h3>
                  <span className="text-xl font-bold text-primary-600">
                    Rs {parseFloat(expense.amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Paid by: <span className="font-medium">{expense.payer_username}</span></p>
                  <p>
                    Participants: {expense.participants.join(', ')}
                  </p>
                  {expense.category && (
                    <span className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs">
                      {expense.category}
                    </span>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(expense.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {expense.payer_username === JSON.parse(localStorage.getItem('user'))?.username && (
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AddExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadExpenses}
        tripId={tripId}
        members={members}
      />
    </div>
  );
};
