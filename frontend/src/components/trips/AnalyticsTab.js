// src/components/trips/AnalyticsTab.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsAPI } from '../../services/api';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

const formatTickLabel = (name = '') => {
  if (!name) return '';
  return name.length > 8 ? `${name.slice(0, 8)}…` : name;
};

export const AnalyticsTab = ({ tripId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [tripId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getTripAnalytics(tripId);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Trip Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Rs {analytics.summary.total_expenses.toFixed(2)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Number of Expenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.summary.total_expenses_count}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Expense</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Rs {analytics.summary.average_expense.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Spending by User */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by User
        </h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.chart_data.users}
                margin={{ top: 10, right: 12, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatTickLabel}
                  angle={45}
                  textAnchor="start"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} width={45} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Spending by Category */}
      {analytics.chart_data.categories.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[320px]">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.chart_data.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // hide labels to avoid overflow on small screens; rely on legend + tooltip
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.chart_data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
