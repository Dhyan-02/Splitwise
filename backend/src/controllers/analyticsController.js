// src/controllers/analyticsController.js
import { supabase } from '../services/supabaseClient.js';

export const getTripAnalytics = async (req, res, next) => {
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

    // Get all expenses
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

    // Calculate total spent per user
    const spendingPerUser = {};
    memberUsernames.forEach(username => {
      spendingPerUser[username] = 0;
    });

    expenses.forEach(expense => {
      spendingPerUser[expense.payer_username] = 
        (spendingPerUser[expense.payer_username] || 0) + parseFloat(expense.amount);
    });

    // Calculate spending by category
    const spendingByCategory = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      spendingByCategory[category] = 
        (spendingByCategory[category] || 0) + parseFloat(expense.amount);
    });

    // Prepare chart data
    const userChartData = Object.keys(spendingPerUser).map(username => ({
      name: username,
      value: parseFloat(spendingPerUser[username].toFixed(2))
    }));

    const categoryChartData = Object.keys(spendingByCategory).map(category => ({
      name: category,
      value: parseFloat(spendingByCategory[category].toFixed(2))
    }));

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      summary: {
        total_expenses: parseFloat(totalSpent.toFixed(2)),
        total_expenses_count: expenses.length,
        average_expense: expenses.length > 0 
          ? parseFloat((totalSpent / expenses.length).toFixed(2)) 
          : 0
      },
      spending_per_user: spendingPerUser,
      spending_by_category: spendingByCategory,
      chart_data: {
        users: userChartData,
        categories: categoryChartData
      }
    });
  } catch (err) {
    next(err);
  }
};
