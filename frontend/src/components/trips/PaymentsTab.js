// src/components/trips/PaymentsTab.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaRupeeSign,
  FaClock,
} from 'react-icons/fa';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const PaymentsTab = ({ tripId }) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { user } = useAuth();
  const currentUser = user?.username;

  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        })
      : '—';

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      // This endpoint auto-creates payment records from settlements
      const response = await paymentsAPI.listTrip(tripId);
      const allPayments = response.data || [];
      setPendingPayments(allPayments.filter(p => p.status === 'pending'));
      setCompletedPayments(allPayments.filter(p => p.status === 'completed'));
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleMarkReceived = async (paymentId) => {
    try {
      setSaving(paymentId);
      // Only complete the existing payment (receiver verification happens on backend)
      await paymentsAPI.complete(paymentId);
      toast.success('Payment marked as received!');
      // Reload payments to refresh the list
      await loadPayments();
      // Optionally refresh settlements if the SettlementsTab is open
      // This would require a shared state or refetch mechanism
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark payment as received');
    } finally {
      setSaving(null);
    }
  };

  const overview = useMemo(() => {
    const pendingTotal = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completedTotal = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      pendingCount: pendingPayments.length,
      pendingTotal: formatAmount(pendingTotal),
      completedCount: completedPayments.length,
      completedTotal: formatAmount(completedTotal),
    };
  }, [pendingPayments, completedPayments]);

  const getInitial = (username = '') =>
    username.trim()?.charAt(0)?.toUpperCase() || '?';

  const PaymentStatusBadge = ({ status }) => {
    const base =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (status === 'pending') {
      return (
        <span className={`${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300`}>
          <FaHourglassHalf className="mr-1" /> Pending
        </span>
      );
    }
    return (
      <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`}>
        <FaCheckCircle className="mr-1" /> Completed
      </span>
    );
  };

  const PaymentCard = ({ payment, status }) => (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 sm:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200 flex items-center justify-center text-sm font-semibold">
            {getInitial(payment.from_username)}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              @{payment.from_username}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">pays</p>
          </div>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center text-sm font-semibold">
            {getInitial(payment.to_username)}
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            @{payment.to_username}
          </p>
        </div>
        <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
          <FaRupeeSign className="mr-1" />
          {Number(payment.amount || 0).toFixed(2)}
        </div>
      </div>

      {status === 'completed' && payment.completed_at && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
          <FaClock /> {formatDateTime(payment.completed_at)}
        </p>
      )}

      {status === 'pending' && currentUser === payment.to_username && (
        <button
          onClick={() => handleMarkReceived(payment.id)}
          disabled={saving === payment.id}
          className="btn-primary btn-sm mt-4 w-full justify-center"
        >
          {saving === payment.id ? 'Marking…' : '✓ Mark as Received'}
        </button>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading payments...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 dark:border-yellow-900/40 dark:from-yellow-900/30 dark:to-yellow-900/10">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">Pending Payments</p>
          <p className="mt-2 text-2xl font-bold text-yellow-900 dark:text-yellow-50">
            {overview.pendingTotal}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-200">
            {overview.pendingCount} payment{overview.pendingCount === 1 ? '' : 's'} outstanding
          </p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-100 p-4 dark:border-green-900/40 dark:from-green-900/30 dark:to-green-900/10">
          <p className="text-sm text-green-800 dark:text-green-200">Completed Payments</p>
          <p className="mt-2 text-2xl font-bold text-green-900 dark:text-green-50">
            {overview.completedTotal}
          </p>
          <p className="text-xs text-green-700 dark:text-green-200">
            {overview.completedCount} cleared recently
          </p>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaHourglassHalf className="mr-2 text-yellow-500" /> Pending Payments
        </h3>
        {pendingPayments.length === 0 ? (
          <div className="text-center py-6 text-gray-600 dark:text-gray-400">
            No pending payments.
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">From</th>
                    <th className="py-2 pr-4">To</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-0">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingPayments.map(payment => (
                    <tr key={payment.id} className="align-middle">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200 flex items-center justify-center text-sm font-semibold">
                            {getInitial(payment.from_username)}
                          </div>
                          <span className="truncate" title={`@${payment.from_username}`}>
                            @{payment.from_username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center text-sm font-semibold">
                            {getInitial(payment.to_username)}
                          </div>
                          <span className="truncate" title={`@${payment.to_username}`}>
                            @{payment.to_username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <PaymentStatusBadge status="pending" />
                      </td>
                      <td className="py-3 pr-0">
                        {currentUser === payment.to_username ? (
                          <button
                            onClick={() => handleMarkReceived(payment.id)}
                            disabled={saving === payment.id}
                            className="btn-primary btn-sm flex items-center shadow-sm hover:shadow-md"
                          >
                            <FaCheckCircle className="mr-1" />{' '}
                            {saving === payment.id ? 'Marking...' : 'Mark Received'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Receiver action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {pendingPayments.map(payment => (
                <PaymentCard key={payment.id} payment={payment} status="pending" />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Completed Payments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
           Completed Payments
        </h3>
        {completedPayments.length === 0 ? (
          <div className="text-center py-6 text-gray-600 dark:text-gray-400">
            No completed payments yet.
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">From</th>
                    <th className="py-2 pr-4">To</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {completedPayments.map(payment => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200 flex items-center justify-center text-sm font-semibold">
                            {getInitial(payment.from_username)}
                          </div>
                          <span className="truncate" title={`@${payment.from_username}`}>
                            @{payment.from_username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center text-sm font-semibold">
                            {getInitial(payment.to_username)}
                          </div>
                          <span className="truncate" title={`@${payment.to_username}`}>
                            @{payment.to_username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="py-3 pr-0 text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(payment.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {completedPayments.map(payment => (
                <PaymentCard key={payment.id} payment={payment} status="completed" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};



