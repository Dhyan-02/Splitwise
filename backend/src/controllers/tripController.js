// src/controllers/tripController.js
import { supabase } from '../services/supabaseClient.js';

export const createTrip = async (req, res, next) => {
  try {
    const { group_id, name, location, start_date, end_date, description } = req.body;
    const username = req.user.username;

    // Verify user is a member of the group
    const { data: membership, error: memError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    if (memError) throw memError;
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { data, error } = await supabase
      .from('trips')
      .insert([{ group_id, name, location, start_date, end_date, description }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: 'Trip created successfully', trip: data[0] });
  } catch (err) {
    next(err);
  }
};

export const getGroupTrips = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const username = req.user.username;

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('group_id', group_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.user.username;

    // Get trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, groups(*)')
      .eq('id', id)
      .single();

    if (tripError) throw tripError;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Also include group_id directly for easier access
    const tripWithGroupId = {
      ...trip,
      group_id: trip.group_id
    };

    res.json(tripWithGroupId);
  } catch (err) {
    next(err);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.user.username;
    const updates = req.body;

    // Get trip and verify membership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', id)
      .single();

    if (tripError) throw tripError;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: 'Trip updated successfully', trip: data[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.user.username;

    // Get trip and verify membership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', id)
      .single();

    if (tripError) throw tripError;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    next(err);
  }
};
