// src/controllers/settlementController.js
import { supabase } from '../services/supabaseClient.js';

export const getTripSettlements = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const username = req.user.username;

    // Verify access to trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('group_id')
      .eq('id', trip_id)
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

    // Get all expenses for the trip
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', trip_id);

    if (expError) throw expError;

    // Get all group members
    const { data: members, error: memError } = await supabase
      .from('group_members')
      .select('username')
      .eq('group_id', trip.group_id);

    if (memError) throw memError;
    const memberUsernames = members.map(m => m.username);

    // Calculate balances: how much each person owes/paid
    const balances = {};
    memberUsernames.forEach(username => {
      balances[username] = { paid: 0, owes: 0, net: 0 };
    });

    // Process each expense
    expenses.forEach(expense => {
      const { payer_username, amount, participants } = expense;
      const sharePerPerson = amount / participants.length;

      // Add to paid amount
      balances[payer_username].paid += amount;

      // Add to owes amount for each participant
      participants.forEach(participant => {
        balances[participant].owes += sharePerPerson;
      });
    });

    // Calculate net balance (positive = others owe them, negative = they owe others)
    Object.keys(balances).forEach(username => {
      balances[username].net = balances[username].paid - balances[username].owes;
    });

    // Calculate settlements (who owes whom)
    const settlements = [];
    const creditors = [];
    const debtors = [];

    // Separate creditors and debtors
    Object.keys(balances).forEach(username => {
      const net = balances[username].net;
      if (net > 0.01) {
        creditors.push({ username, amount: net });
      } else if (net < -0.01) {
        debtors.push({ username, amount: Math.abs(net) });
      }
    });

    // Sort by amount (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Calculate optimal settlements
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

    res.json({
      balances,
      settlements,
      summary: {
        total_expenses: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
        total_expenses_count: expenses.length
      }
    });
  } catch (err) {
    next(err);
  }
};
