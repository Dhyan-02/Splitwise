// src/components/trips/SpendingTab.js
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { settlementsAPI } from '../../services/api';

export const SpendingTab = ({ tripId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpending = async () => {
      try {
        setLoading(true);
        const res = await settlementsAPI.getTripSettlements(tripId);
        const balances = res.data?.balances || {};

        const rows = Object.entries(balances).map(([username, b]) => {
          const paid = b.paid ?? 0;
          const owes = b.owes ?? 0;
          const net = paid - owes;
          const shouldReceive = Math.max(net, 0);
          const shouldPay = Math.max(-net, 0);
          const finalExpense = owes; // final share owed by user
          return {
            username,
            paid: Number(paid.toFixed(2)),
            owes: Number(owes.toFixed(2)),
            net: Number(net.toFixed(2)),
            shouldReceive: Number(shouldReceive.toFixed(2)),
            shouldPay: Number(shouldPay.toFixed(2)),
            action: net >= 0 ? 'Received' : 'Paid',
            actionAmount: Math.abs(net),
            finalExpense: Number(finalExpense.toFixed(2)),
          };
        });

        setData(rows);
      } catch (e) {
        toast.error('Failed to load spending data');
      } finally {
        setLoading(false);
      }
    };

    loadSpending();
  }, [tripId]);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-300">
        Loading spending data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-300">
        No spending data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Spending Overview
      </h2>

      {/* --- Chart Section --- */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Final Expense by Member
        </h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Legend />
                <Bar
                  dataKey="finalExpense"
                  name="Final Expense"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Desktop Table --- */}
      <div className="hidden sm:block card overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Breakdown
        </h3>
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Paid</th>
              <th className="py-2 pr-4">Owes</th>
              <th className="py-2 pr-4">Net</th>
              <th className="py-2 pr-4">Gave / Received</th>
              <th className="py-2 pr-0">Final Expense</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row) => (
              <tr key={row.username}>
                <td className="py-2 pr-4 font-semibold">{row.username}</td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">
                  ₹{row.paid.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">
                  ₹{row.owes.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`py-2 pr-4 ${
                    row.net >= 0 ? 'text-green-600' : 'text-red-500'
                  } font-medium`}
                >
                  {row.net >= 0 ? '+' : '-'}₹
                  {Math.abs(row.net).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-200">
                  {row.action}: ₹
                  {row.actionAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-2 pr-0 text-gray-800 dark:text-gray-100 font-semibold">
                  ₹
                  {row.finalExpense.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile Cards --- */}
      <div className="sm:hidden grid grid-cols-1 gap-4">
        {data.map((row) => (
          <div
            key={row.username}
            className="rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {row.username}
              </h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Final: ₹
                {row.finalExpense.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span>Paid</span>
                <span className="font-medium">₹{row.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Owes</span>
                <span className="font-medium">₹{row.owes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className={row.net >= 0 ? 'text-green-600' : 'text-red-500'}>Net</span>
                <span className={row.net >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                  {row.net >= 0 ? '+' : '-'}₹{Math.abs(row.net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{row.action}</span>
                <span className="font-medium">₹{row.actionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
