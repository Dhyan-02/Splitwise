// src/controllers/paymentsController.js
import { supabase } from '../services/supabaseClient.js';

// Helper function to calculate settlements (extracted logic from settlementController)
const calculateSettlements = async (trip_id) => {
  // Get all expenses for the trip
  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', trip_id);
  if (expError) throw expError;

  // Get all trip members
  const { data: members, error: memError } = await supabase
    .from('trip_members')
    .select('username')
    .eq('trip_id', trip_id);
  if (memError) throw memError;

  const memberUsernames = new Set((members || []).map(m => m.username));
  if (memberUsernames.size === 0) return [];

  // Filter expenses to only include those where payer and all participants are trip members
  const validExpenses = expenses.filter(expense => {
    if (!memberUsernames.has(expense.payer_username)) return false;
    if (expense.participants && expense.participants.length > 0) {
      return expense.participants.every(p => memberUsernames.has(p));
    }
    return true;
  });

  // Calculate balances
  const balances = {};
  Array.from(memberUsernames).forEach(username => {
    balances[username] = { paid: 0, owes: 0, net: 0 };
  });

  validExpenses.forEach(expense => {
    const { payer_username, amount, participants } = expense;
    if (!participants || participants.length === 0) return;
    
    const sharePerPerson = amount / participants.length;
    if (balances[payer_username]) {
      balances[payer_username].paid += amount;
    }
    participants.forEach(participant => {
      if (balances[participant]) {
        balances[participant].owes += sharePerPerson;
      }
    });
  });

  Object.keys(balances).forEach(username => {
    balances[username].net = balances[username].paid - balances[username].owes;
  });

  // Subtract completed payments
  const { data: completedPayments } = await supabase
    .from('payments')
    .select('from_username, to_username, amount, status')
    .eq('trip_id', trip_id)
    .eq('status', 'completed');
  (completedPayments || []).forEach(p => {
    const debtor = p.from_username;
    const creditor = p.to_username;
    const amt = parseFloat(p.amount) || 0;
    if (balances[debtor]) balances[debtor].net += amt;
    if (balances[creditor]) balances[creditor].net -= amt;
  });

  // Calculate settlements
  const settlements = [];
  const creditors = [];
  const debtors = [];

  Object.keys(balances).forEach(username => {
    const net = balances[username].net;
    if (net > 0.01) {
      creditors.push({ username, amount: net });
    } else if (net < -0.01) {
      debtors.push({ username, amount: Math.abs(net) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.username,
        to: creditor.username,
        amount: parseFloat(settleAmount.toFixed(2))
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return settlements;
};

export const syncPendingPaymentsForTrip = async (trip_id, actorUsername, options = {}) => {
  const { resetCompleted = false } = options;
  const settlements = await calculateSettlements(trip_id);

  let deleteBuilder = supabase
    .from('payments')
    .delete()
    .eq('trip_id', trip_id);

  if (!resetCompleted) {
    deleteBuilder = deleteBuilder.eq('status', 'pending');
  }

  const { error: deleteErr } = await deleteBuilder;
  if (deleteErr) throw deleteErr;

  if (!settlements.length) {
    return { created: 0 };
  }

  const insertPayload = settlements.map(settlement => ({
    trip_id,
    from_username: settlement.from,
    to_username: settlement.to,
    amount: settlement.amount,
    status: 'pending',
    created_by: actorUsername || settlement.from,
  }));

  const { data, error: insertErr } = await supabase
    .from('payments')
    .insert(insertPayload)
    .select('id');
  if (insertErr) throw insertErr;

  return { created: data?.length || 0 };
};

// List payments for a trip - auto-creates payment records from settlements
export const listTripPayments = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const username = req.user.username;

    // Verify access to trip via group
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
      .maybeSingle();
    if (tripErr) throw tripErr;
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();
    if (!membership) return res.status(403).json({ error: 'Forbidden' });

    await syncPendingPaymentsForTrip(trip_id, username);

    const { data: allPayments, error: finalError } = await supabase
      .from('payments')
      .select('*')
      .eq('trip_id', trip_id)
      .order('created_at', { ascending: false });
    if (finalError) throw finalError;

    res.json(allPayments || []);
  } catch (err) {
    next(err);
  }
};

// Create a payment record (from settlement instructions). Anyone can request; only receiver can mark done.
export const createPayment = async (req, res, next) => {
  try {
    const { trip_id, from_username, to_username, amount } = req.body;
    const requester = req.user.username;

    if (!trip_id || !from_username || !to_username || !amount) {
      return res.status(400).json({ error: 'trip_id, from_username, to_username, amount are required' });
    }

    // Access checks
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
      .maybeSingle();
    if (tripErr) throw tripErr;
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', requester)
      .maybeSingle();
    if (!membership) return res.status(403).json({ error: 'Forbidden' });

    // Ensure both parties are trip members
    const { data: members } = await supabase
      .from('trip_members')
      .select('username')
      .eq('trip_id', trip_id);
    const set = new Set((members || []).map(m => m.username));
    if (!set.has(from_username) || !set.has(to_username)) {
      return res.status(400).json({ error: 'Both users must be trip members' });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([{ trip_id, from_username, to_username, amount: parseFloat(amount), status: 'pending', created_by: requester }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    next(err);
  }
};

// Mark payment as completed - only receiver can complete
export const completePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.user.username;

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if ((payment.to_username || '').trim().toLowerCase() !== (username || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Only the receiver can mark as completed' });
    }

    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;

    try {
      await syncPendingPaymentsForTrip(payment.trip_id, username);
    } catch (syncErr) {
      console.error('Failed to sync payments after completion:', syncErr);
    }

    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

export const resetTripPayments = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const username = req.user.username;
    const mode = (req.body?.mode || 'soft').toLowerCase();
    const resetCompleted = mode === 'hard';

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
      .maybeSingle();
    if (tripErr) throw tripErr;
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', trip.group_id)
      .eq('username', username)
      .maybeSingle();
    if (!membership) return res.status(403).json({ error: 'Forbidden' });

    const result = await syncPendingPaymentsForTrip(trip_id, username, { resetCompleted });
    res.json({
      message: resetCompleted
        ? 'Hard reset: pending payments rebuilt and completed payments cleared'
        : 'Soft reset: pending payments rebuilt and completed payments preserved',
      ...result,
    });
  } catch (err) {
    next(err);
  }
};



