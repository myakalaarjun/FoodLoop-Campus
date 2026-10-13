import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function tokenCookie(res, token) {
  res.cookie('foodloopToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
}

export async function register(req, res) {
  const { name, email, password, role, organization } = req.body;
  if (role === 'admin') return res.status(403).json({ success: false, message: 'Administrator accounts cannot self-register.' });
  const recipientOrganization = role === 'recipient' ? {
    name: organization.name,
    description: organization.description || '',
    capacity: organization.capacity,
    dietaryNeeds: organization.dietaryNeeds || [],
    pickupAvailability: organization.pickupAvailability || [],
    verified: false
  } : undefined;
  const user = await User.create({ name, email, password, role, organization: recipientOrganization });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  tokenCookie(res, token);
  res.status(201).json({ success: true, user });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !user.active || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  tokenCookie(res, token);
  res.json({ success: true, user: user.toJSON() });
}

export function logout(_req, res) {
  res.clearCookie('foodloopToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ success: true, message: 'Signed out.' });
}

export function me(req, res) {
  res.json({ success: true, user: req.user });
}

export async function updateProfile(req, res) {
  for (const field of ['name', 'phone']) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  if (req.user.role === 'recipient' && req.body.organization) {
    const fields = ['name', 'description', 'capacity', 'dietaryNeeds', 'pickupAvailability'];
    for (const field of fields) {
      if (req.body.organization[field] !== undefined) req.user.set(`organization.${field}`, req.body.organization[field]);
    }
  }
  await req.user.save();
  res.json({ success: true, user: req.user });
}
