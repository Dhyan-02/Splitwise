// src/pages/TripDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { tripsAPI } from '../services/api';
import { ExpensesTab } from '../components/trips/ExpensesTab';
import { MembersTab } from '../components/trips/MembersTab';
import { PlacesTab } from '../components/trips/PlacesTab';
import { AnalyticsTab } from '../components/trips/AnalyticsTab';
import { SpendingTab } from '../components/trips/SpendingTab';
import { SettlementsTab } from '../components/trips/SettlementsTab';
import { PaymentsTab } from '../components/trips/PaymentsTab';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendar, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'members', label: 'Members' },
  { id: 'places', label: 'Places' },
  { id: 'settlements', label: 'Settlements' },
  { id: 'payments', label: 'Payments' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'spending', label: 'Spending' },
];

export const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getById(id);
      setTrip(response.data);
    } catch (error) {
      toast.error('Failed to load trip');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    if (confirmValue !== trip.name) return;
    try {
      setDeleting(true);
      await tripsAPI.delete(id);
      toast.success('Trip deleted');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete trip');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmValue('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <FaArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {trip.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Created by <span className="font-medium">@{trip.created_by}</span></p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {trip.location && (
                <div className="flex items-center">
                  <FaMapMarkerAlt className="h-4 w-4 mr-1" />
                  {trip.location}
                </div>
              )}
              {trip.start_date && (
                <div className="flex items-center">
                  <FaCalendar className="h-4 w-4 mr-1" />
                  {new Date(trip.start_date).toLocaleDateString()}
                  {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
                </div>
              )}
            </div>
            {trip.description && (
              <p className="mt-4 text-gray-700 dark:text-gray-300">{trip.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {user && trip.created_by === user.username && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                <FaTrash className="h-4 w-4 mr-2" />
                Delete Trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav
          className="relative flex overflow-x-auto no-scrollbar rounded-lg bg-gray-100 dark:bg-gray-800 p-1"
          role="tablist"
          aria-label="Trip sections"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative">
                {active && (
                  <motion.div
                    layoutId="tabActiveBg"
                    className="absolute inset-0 rounded-md bg-white dark:bg-gray-900 shadow"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={active}
                  className={`relative z-10 whitespace-nowrap px-4 py-2 m-1 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors ${
                    active
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'expenses' && <ExpensesTab tripId={id} />}
        {activeTab === 'members' && <MembersTab tripId={id} trip={trip} />}
        {activeTab === 'places' && <PlacesTab tripId={id} />}
        {activeTab === 'analytics' && <AnalyticsTab tripId={id} />}
        {activeTab === 'spending' && <SpendingTab tripId={id} />}
        {activeTab === 'settlements' && <SettlementsTab tripId={id} />}
        {activeTab === 'payments' && <PaymentsTab tripId={id} />}
      </motion.div>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Trip</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. Please type the trip name to confirm:
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{trip?.name}</p>
            <input
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              className="input-field mt-3"
              placeholder="Type trip name exactly"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setConfirmOpen(false); setConfirmValue(''); }} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleDeleteTrip}
                disabled={deleting || confirmValue !== (trip?.name || '')}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
