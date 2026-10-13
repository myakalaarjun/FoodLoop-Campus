import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { audit } from '../services/audit.js';

export async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
}

export async function updateUser(req, res) {
  if (String(req.params.id) === String(req.user._id) && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Administrators cannot change their own role.' });
  }
  if (String(req.params.id) === String(req.user._id) && req.body.active === false) {
    return res.status(400).json({ success: false, message: 'Administrators cannot deactivate their own account.' });
  }
  const updates = {};
  if (typeof req.body.active === 'boolean') updates.active = req.body.active;
  if (['donor', 'recipient', 'volunteer', 'admin'].includes(req.body.role)) updates.role = req.body.role;
  if (Object.hasOwn(req.body, 'role') && !updates.role) return res.status(400).json({ success: false, message: 'Invalid role.' });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  await audit(req.user, 'user.updated', 'user', user.id, updates);
  res.json({ success: true, user });
}

export async function verifyOrganization(req, res) {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'recipient' },
    { $set: { 'organization.verified': Boolean(req.body.verified) } },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ success: false, message: 'Recipient organization not found.' });
  await audit(req.user, 'organization.verification_changed', 'user', user.id, { verified: user.organization.verified });
  res.json({ success: true, user });
}

export async function monitorListings(_req, res) {
  const listings = await Listing.find().populate('donor', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, listings });
}
