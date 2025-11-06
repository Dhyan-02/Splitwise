// src/controllers/expenseController.js
import { supabase } from '../services/supabaseClient.js';

export const addExpense = async (req, res, next) => {
  try {
    const { trip_id, amount, description, category, participants } = req.body;
    const payer_username = req.user.username;

    // Verify user has access to trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
      .maybeSingle();

    if (tripError) throw tripError;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', payer_username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Verify all participants are members
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('username')
      .eq('group_id', trip.group_id);

    const memberUsernames = allMembers.map(m => m.username);
    const invalidParticipants = participants.filter(p => !memberUsernames.includes(p));

    if (invalidParticipants.length > 0) {
      return res.status(400).json({
        error: `Invalid participants: ${invalidParticipants.join(', ')}`
      });
    }

    // Insert expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([{ trip_id, payer_username, amount, description, category, participants }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Expense added', expense: expense[0] });
  } catch (err) {
    next(err);
  }
};

export const getTripExpenses = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const username = req.user.username;

    // Verify access to trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
      .maybeSingle();

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

    // Get expenses
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', trip_id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { expense_id } = req.params;
    const username = req.user.username;

    // Get expense
    const { data: expense, error: expError } = await supabase
      .from('expenses')
      .select('trip_id, payer_username')
      .eq('id', expense_id)
      .maybeSingle();

    if (expError) throw expError;
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Get trip to verify membership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', expense.trip_id)
      .maybeSingle();

    if (tripError) throw tripError;

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Only payer can delete
    if (expense.payer_username !== username) {
      return res.status(403).json({ error: 'Only the payer can delete this expense' });
    }

    const { error } = await supabase.from('expenses').delete().eq('id', expense_id);
    if (error) throw error;

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};