// src/components/trips/PlacesTab.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaImage } from 'react-icons/fa';
import { placesAPI } from '../../services/api';
import { AddPlaceModal } from './AddPlaceModal';

export const PlacesTab = ({ tripId }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPlaces();
  }, [tripId]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const response = await placesAPI.getTripPlaces(tripId);
      // Sort by visited_time ascending and normalize coords as numbers when possible
      const normalized = (response.data || []).map(p => {
        const latNum = p.latitude === null || p.latitude === undefined ? null : Number(p.latitude);
        const lngNum = p.longitude === null || p.longitude === undefined ? null : Number(p.longitude);
        return { ...p, latitude: isNaN(latNum) ? null : latNum, longitude: isNaN(lngNum) ? null : lngNum };
      }).sort((a, b) => new Date(a.visited_time) - new Date(b.visited_time));
      setPlaces(normalized);
    } catch (error) {
      toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (placeId) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;

    try {
      await placesAPI.delete(placeId);
      toast.success('Place deleted');
      loadPlaces();
    } catch (error) {
      toast.error('Failed to delete place');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading places...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Places Visited</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus className="h-4 w-4" />
          <span>Add Place</span>
        </button>
      </div>

      {places.length === 0 ? (
        <div className="card text-center py-12">
          <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No places added yet. Add one to start tracking!</p>
        </div>
      ) : (
        // Vertical timeline layout
        <div className="relative">
          {/* center timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -ml-px w-px bg-gradient-to-b from-primary-200 via-gray-300 to-primary-200 dark:from-primary-900 dark:via-gray-700 dark:to-primary-900" />
          {/* mobile timeline line */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-10">
            {places.map((place, idx) => {
              const hasPhoto = !!place.photo_url;
              const coordText =
                place.latitude !== null && place.longitude !== null
                  ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
                  : null;
              const isLeft = idx % 2 === 0;
              return (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative md:w-1/2 ${isLeft ? 'md:pr-10 md:pl-0 md:mr-auto md:text-right' : 'md:pl-10 md:pr-0 md:ml-auto'} pl-12 md:pl-0`}
                >
                  {/* Timeline dot (center on md, left on mobile) */}
                  <div className={`absolute top-2 ${isLeft ? 'md:right-[-7px]' : 'md:left-[-7px]'} md:inset-y-auto left-4 h-3 w-3 rounded-full bg-primary-600 ring-4 ring-white dark:ring-gray-800 shadow flex items-center justify-center`}>
                    <span className="sr-only">{idx + 1}</span>
                  </div>

                  <div className={`card overflow-hidden ${isLeft ? '' : ''}`}>
                    <div className="md:flex md:items-stretch">
                      <div className={`md:w-1/3 ${hasPhoto ? '' : 'md:w-1/4'}`}>
                        {hasPhoto ? (
                          <img
                            src={place.photo_url}
                            alt={place.name}
                            className="w-full h-48 md:h-full object-cover rounded-lg md:rounded-none md:rounded-l-lg"
                          />
                        ) : (
                          <div className="w-full h-48 md:h-full bg-gray-200 dark:bg-gray-700 rounded-lg md:rounded-none md:rounded-l-lg flex items-center justify-center">
                            <FaImage className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className={`md:w-2/3 ${isLeft ? 'md:pl-6' : 'md:pr-6'} mt-4 md:mt-0`}>
                        <div className={`flex ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-start justify-between`}>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{place.name}</h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(place.visited_time).toLocaleString()}</span>
                        </div>
                        {place.description && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{place.description}</p>
                        )}
                        {coordText && (
                          <div className={`mt-3 inline-flex items-center text-sm text-gray-600 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 ${isLeft ? '' : 'md:self-end'}`}>
                            <FaMapMarkerAlt className="h-4 w-4 mr-2 text-primary-600" />
                            {coordText}
                          </div>
                        )}
                        <div className={`mt-4 ${isLeft ? '' : 'md:text-right'}`}>
                          <button
                            onClick={() => handleDelete(place.id)}
                            className="text-red-600 hover:text-red-700 text-sm inline-flex items-center"
                          >
                            <FaTrash className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <AddPlaceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadPlaces}
        tripId={tripId}
      />
    </div>
  );
};
