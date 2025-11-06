// src/pages/TripDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { tripsAPI } from '../services/api';
import { ExpensesTab } from '../components/trips/ExpensesTab';
import { MembersTab } from '../components/trips/MembersTab';
import { PlacesTab } from '../components/trips/PlacesTab';
import { AnalyticsTab } from '../components/trips/AnalyticsTab';
import { SettlementsTab } from '../components/trips/SettlementsTab';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';

const tabs = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'members', label: 'Members' },
  { id: 'places', label: 'Places' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settlements', label: 'Settlements' },
];

export const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {trip.name}
        </h1>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
        {activeTab === 'settlements' && <SettlementsTab tripId={id} />}
      </motion.div>
    </div>
  );
};
