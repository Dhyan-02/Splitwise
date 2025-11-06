// src/components/trips/SettlementsTab.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaArrowRight, FaDollarSign } from 'react-icons/fa';
import { settlementsAPI } from '../../services/api';

export const SettlementsTab = ({ tripId }) => {
  const [settlements, setSettlements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettlements();
  }, [tripId]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const response = await settlementsAPI.getTripSettlements(tripId);
      setSettlements(response.data);
    } catch (error) {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settlements...</div>;
  }

  if (!settlements) {
    return <div className="text-center py-8">No settlement data available</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Settlements</h2>

      {/* Summary */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Rs {settlements.summary.total_expenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Number of Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {settlements.summary.total_expenses_count}
            </p>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Balances</h3>
        <div className="space-y-3">
          {Object.entries(settlements.balances).map(([username, balance]) => (
            <div
              key={username}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paid: Rs {balance.paid.toFixed(2)} | Owes: Rs {balance.owes.toFixed(2)}
                </p>
              </div>
              <div className={`text-lg font-bold ${
                balance.net > 0 
                  ? 'text-green-600' 
                  : balance.net < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {balance.net > 0 ? '+' : ''}Rs {balance.net.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Instructions */}
      {settlements.settlements.length > 0 ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Settlement Instructions
          </h3>
          <div className="space-y-3">
            {settlements.settlements.map((settlement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                    <FaDollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {settlement.from}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">owes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Rs {settlement.amount.toFixed(2)}
                  </span>
                  <FaArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {settlement.to}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <FaDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">All expenses are settled!</p>
        </div>
      )}
    </div>
  );
};
