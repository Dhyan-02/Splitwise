// src/components/trips/AddPlaceModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { placesAPI } from '../../services/api';

export const AddPlaceModal = ({ isOpen, onClose, onSuccess, tripId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        trip_id: tripId,
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null
      };
      
      await placesAPI.add(data, photoFile);
      toast.success('Place added successfully!');
      setFormData({ name: '', description: '', location: '' });
      setPhotoFile(null);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add place');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode to a human-readable location name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
          .then((r) => r.json())
          .then((j) => {
            const display = j?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData((prev) => ({ ...prev, location: display }));
          })
          .catch(() => {
            setFormData((prev) => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          })
          .finally(() => setLocating(false));
        toast.success('Location name captured');
      },
      (err) => {
        setLocating(false);
        const msg = err.code === 1 ? 'Permission denied for location' : 'Failed to get current location';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Place</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Place Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter place name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field flex-1"
                    placeholder="e.g., Marine Drive, Mumbai"
                  />
                  <button type="button" onClick={getCurrentLocation} className="btn-secondary whitespace-nowrap">
                    {locating ? 'Getting…' : 'Use current'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="input-field"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Adding...' : 'Add Place'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
