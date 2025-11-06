// src/components/trips/MembersTab.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaUsers } from 'react-icons/fa';
import { groupsAPI } from '../../services/api';

export const MembersTab = ({ tripId, trip }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [trip]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const groupId = trip?.groups?.id || trip?.group_id;
      if (!groupId) {
        toast.error('Group ID not found');
        return;
      }
      const response = await groupsAPI.getMembers(groupId);
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Group Members</h2>
      {members.length === 0 ? (
        <div className="card text-center py-12">
          <FaUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <motion.div
              key={member.username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {(member.full_name || member.username).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {member.full_name || member.username}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{member.username}
                  </p>
                  {member.email && (
                    <p className="text-xs text-gray-500">{member.email}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
