// src/controllers/groupController.js
import { supabase } from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';

export const createGroup = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const created_by = req.user.username;

    let password_hash = null;
    if (password) password_hash = await hashPassword(password);

    const { data, error } = await supabase
      .from('groups')
      .insert([{ name, password_hash, created_by }])
      .select();

    if (error) throw error;

    // Add creator as member
    await supabase.from('group_members').insert([{ group_id: data[0].id, username: created_by }]);

    res.status(201).json({ message: 'Group created', group: data[0] });
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { group_id, password } = req.body;
    const username = req.user.username;

    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .eq('id', group_id)
      .maybeSingle();

    if (gErr) throw gErr;
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.password_hash) {
      if (!password) {
        return res.status(400).json({ error: 'Password required for this group' });
      }
      const isValid = await comparePassword(password, group.password_hash);
      if (!isValid) return res.status(403).json({ error: 'Invalid password' });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    if (existingMember) {
      return res.status(400).json({ error: 'User already a member of this group' });
    }

    const { error } = await supabase.from('group_members').insert([{ group_id, username }]);

    if (error) throw error;

    res.status(200).json({
      message: 'Joined group successfully',
      group: { id: group.id, name: group.name },
    });
  } catch (err) {
    next(err);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const username = req.user.username;

    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*), joined_at')
      .eq('username', username);

    if (error) throw error;

    // Format response
    const groups = data.map(item => {
      const { password_hash, ...groupInfo } = item.groups;
      return {
        ...groupInfo,
        joined_at: item.joined_at,
        has_password: !!password_hash
      };
    });

    res.json(groups);
  } catch (err) {
    next(err);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const username = req.user.username;

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    // Get group info (even if not a member, so they can see it to join)
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (gErr) throw gErr;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Don't return password_hash in response
    const { password_hash, ...groupInfo } = group;

    res.json({
      ...groupInfo,
      is_member: !!membership,
      has_password: !!password_hash
    });
  } catch (err) {
    next(err);
  }
};

export const getGroupMembers = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const username = req.user.username;

    // Verify user is a member
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
      .from('group_members')
      .select('username, joined_at, users(username, email, full_name)')
      .eq('group_id', group_id);

    if (error) throw error;

    // Format response
    const members = data.map(item => ({
      username: item.username,
      joined_at: item.joined_at,
      ...item.users
    }));

    res.json(members);
  } catch (err) {
    next(err);
  }
};

// Generate invite token for a group (members only)
export const generateInvite = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const username = req.user.username;

    // Verify requester is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Only group members can create invite links' });
    }

    const payload = { group_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
      expiresIn: '7d',
      subject: 'group_invite'
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

// Join a group using an invite token (requires authenticated user)
export const joinByInvite = async (req, res, next) => {
  try {
    const { token } = req.body;
    const username = req.user.username;

    if (!token) return res.status(400).json({ error: 'Invite token is required' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      if (decoded.sub !== 'group_invite') {
        return res.status(400).json({ error: 'Invalid invite token' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    const group_id = decoded.group_id;

    // Ensure group exists
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', group_id)
      .maybeSingle();

    if (gErr) throw gErr;
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .maybeSingle();

    if (existingMember) {
      return res.status(200).json({ message: 'Already a member', group });
    }

    const { error } = await supabase.from('group_members').insert([{ group_id, username }]);
    if (error) {
      // If concurrent requests hit, handle unique violation gracefully
      if (error.code === '23505') {
        return res.status(200).json({ message: 'Already a member', group });
      }
      throw error;
    }
    const { error } = await supabase.from('group_members').insert([{ group_id, username }]);
    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ message: 'Already a member', group: { id: group_id } });
      }
      throw error;
    }

    res.status(200).json({ message: 'Joined group via invite', group });
  } catch (err) {
    next(err);
  }
};