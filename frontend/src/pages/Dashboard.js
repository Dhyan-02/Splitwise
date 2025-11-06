// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaUsers, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';
import { groupsAPI, tripsAPI } from '../services/api';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { CreateTripModal } from '../components/CreateTripModal';
import { JoinGroupModal } from '../components/JoinGroupModal';

export const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, tripsData] = await Promise.all([
        groupsAPI.getMyGroups(),
        getAllTrips()
      ]);
      setGroups(groupsRes.data);
      setTrips(tripsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getAllTrips = async () => {
    try {
      const groupsRes = await groupsAPI.getMyGroups();
      const allTrips = [];
      for (const group of groupsRes.data) {
        try {
          const tripsRes = await tripsAPI.getGroupTrips(group.id);
          allTrips.push(...tripsRes.data.map(trip => ({ ...trip, group_name: group.name })));
        } catch (err) {
          // Skip groups with no trips
        }
      }
      return allTrips;
    } catch (error) {
      return [];
    }
  };

  const handleGroupCreated = () => {
    loadData();
    setShowGroupModal(false);
  };

  const handleTripCreated = () => {
    loadData();
    setShowTripModal(false);
    setSelectedGroupId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <FaPlus className="h-4 w-4" />
            <span>New Group</span>
          </button>
          <button
            onClick={() => setShowTripModal(true)}
            className="btn-secondary flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <FaPlus className="h-4 w-4" />
            <span>New Trip</span>
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <FaUsers className="h-4 w-4" />
            <span>Join Group</span>
          </button>
        </div>
      </div>

      {/* Groups Section */}
      <div className="mb-8 px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Groups</h2>
        {groups.length === 0 ? (
          <div className="card text-center py-12">
            <FaUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No groups yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                    {group.name}
                  </h3>
                  {group.has_password && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      Protected
                    </span>
                  )}
                </div>
                <Link
                  to={`/groups/${group.id}`}
                  className="mt-auto text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Details →
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trips Section */}
      <div className="px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Trips</h2>
        {trips.length === 0 ? (
          <div className="card text-center py-12">
            <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No trips yet. Create one to track expenses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
              >
                <Link to={`/trips/${trip.id}`}>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
                    {trip.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                    {trip.group_name}
                  </p>
                  {trip.location && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <FaMapMarkerAlt className="h-4 w-4 mr-1" />
                      {trip.location}
                    </div>
                  )}
                  {trip.start_date && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaCalendar className="h-4 w-4 mr-1" />
                      {new Date(trip.start_date).toLocaleDateString()}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSuccess={handleGroupCreated}
      />

      <CreateTripModal
        isOpen={showTripModal}
        onClose={() => {
          setShowTripModal(false);
          setSelectedGroupId(null);
        }}
        onSuccess={handleTripCreated}
        groups={groups}
        selectedGroupId={selectedGroupId}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};
