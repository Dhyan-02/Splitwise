// src/pages/GroupDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaPlus, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import { groupsAPI, tripsAPI } from '../services/api';
import QRCode from 'react-qr-code';
import { CreateTripModal } from '../components/CreateTripModal';
import { JoinGroupModal } from '../components/JoinGroupModal';

export const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [trips, setTrips] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [copyingInvite, setCopyingInvite] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await groupsAPI.getById(id);
      setGroup(groupRes.data);
      setIsMember(groupRes.data.is_member);

      if (groupRes.data.is_member) {
        const [tripsRes, membersRes] = await Promise.all([
          tripsAPI.getGroupTrips(id).catch(() => ({ data: [] })),
          groupsAPI.getMembers(id).catch(() => ({ data: [] }))
        ]);
        setTrips(tripsRes.data || []);
        setMembers(membersRes.data || []);
      } else {
        setShowJoinModal(true);
      }
    } catch (error) {
      toast.error('Failed to load group data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    loadGroupData();
  };

  const handleTripCreated = () => {
    loadGroupData();
    setShowTripModal(false);
  };

  const buildInviteUrl = (token) => {
    const url = new URL(`${window.location.origin}/invite/${token}`);
    if (nickname) url.searchParams.set('nickname', nickname);
    return url.toString();
  };

  const handleCopyInvite = async () => {
    try {
      setCopyingInvite(true);
      const res = await groupsAPI.createInvite(id);
      const token = res.data.token;
      const inviteUrl = buildInviteUrl(token);
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied to clipboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invite');
    } finally {
      setCopyingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!group && !showJoinModal) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Group not found or you don't have access</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <FaArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      {group && (
        <>
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {group.name}
                </h1>
                {group.has_password && (
                  <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm">
                    Password Protected
                  </span>
                )}
              </div>
              {isMember && (
                <button
                  onClick={() => setShowTripModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaPlus className="h-4 w-4" />
                  <span>New Trip</span>
                </button>
              )}
              {isMember && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:ml-3 mt-3 sm:mt-0">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Nickname (optional)"
                    className="input-field sm:w-56"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="btn-secondary"
                    disabled={copyingInvite}
                  >
                    {copyingInvite ? 'Copying…' : 'Copy Invite Link'}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <FaUsers className="h-4 w-4 mr-1" />
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </div>
          </div>

          {/* Members Section */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Members</h2>
            {members.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No members found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.username} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                        {(member.full_name || member.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {member.full_name || member.username}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{member.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite QR (members only) */}
          {isMember && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Invite via QR</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Share this QR to let friends join quickly.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  {/* QR code value will be built dynamically on click; show latest created if any */}
                  {/* For a live QR, we request a fresh token */}
                  <LiveInviteQR groupId={id} nickname={nickname} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Tip: add a nickname to prefill their signup.</p>
                </div>
              </div>
            </div>
          )}

          {/* Trips Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trips</h2>
            {trips.length === 0 ? (
              <div className="card text-center py-12">
                <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No trips yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {trip.name}
                    </h3>
                    {trip.location && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <FaMapMarkerAlt className="h-4 w-4 mr-1" />
                        {trip.location}
                      </div>
                    )}
                    {trip.start_date && (
                      <p className="text-xs text-gray-500">
                        {new Date(trip.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CreateTripModal
        isOpen={showTripModal}
        onClose={() => setShowTripModal(false)}
        onSuccess={handleTripCreated}
        groups={group ? [group] : []}
        selectedGroupId={id}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          navigate('/dashboard');
        }}
        onSuccess={handleJoinSuccess}
        groupId={id}
      />
    </div>
  );
};

// Helper component to render a fresh QR code by fetching a new invite token
const LiveInviteQR = ({ groupId, nickname }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const buildUrl = (token) => {
    const u = new URL(`${window.location.origin}/invite/${token}`);
    if (nickname) u.searchParams.set('nickname', nickname);
    return u.toString();
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await groupsAPI.createInvite(groupId);
      setUrl(buildUrl(res.data.token));
    } catch (e) {
      // ignore; GroupDetail toasts on copy flow
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // refresh when nickname changes to encode it in URL
  }, [groupId, nickname]);

  return (
    <div className="flex flex-col items-center">
      {url ? (
        <QRCode value={url} size={160} fgColor="#0f172a" bgColor="#ffffff" />
      ) : (
        <div className="h-[160px] w-[160px] flex items-center justify-center text-xs text-gray-500">
          Generating QR…
        </div>
      )}
      <button onClick={refresh} className="btn-secondary mt-3" disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh QR'}
      </button>
      {url && (
        <p className="mt-2 text-xs break-all max-w-xs text-gray-500 dark:text-gray-400">
          {url}
        </p>
      )}
    </div>
  );
};
