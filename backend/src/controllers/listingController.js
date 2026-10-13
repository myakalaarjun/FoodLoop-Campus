import Listing from '../models/Listing.js';
import Reservation from '../models/Reservation.js';
import { audit } from '../services/audit.js';
import { scoreMatch } from '../services/matching.js';
import { expireDueListings } from '../services/expiration.js';

export async function listListings(req, res) {
  await expireDueListings();
  const filter = {};
  if (req.user.role === 'donor') filter.donor = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  else if (req.user.role !== 'donor' && req.user.role !== 'admin') filter.status = 'available';
  if (req.user.role === 'recipient') filter.deadline = { $gt: new Date() };
  const donorFields = req.user.role === 'volunteer' ? 'name email phone organization.name' : 'name organization.name';
  const listings = await Listing.find(filter).populate('donor', donorFields);
  const results = req.user.role === 'recipient'
    ? listings.map(listing => ({ ...listing.toJSON(), match: scoreMatch(listing, req.user) }))
      .sort((a, b) => b.match.score - a.match.score)
    : listings;
  res.json({ success: true, listings: results });
}

export async function createListing(req, res) {
  if (new Date(req.body.deadline) <= new Date(req.body.pickupStart) || new Date(req.body.pickupStart) <= new Date()) {
    return res.status(400).json({ success: false, message: 'Pickup must start in the future and the deadline must be after pickup starts.' });
  }
  const listing = await Listing.create({ ...req.body, quantityAvailable: req.body.quantity, donor: req.user._id });
  await audit(req.user, 'listing.created', 'listing', listing.id, { title: listing.title });
  res.status(201).json({ success: true, listing });
}

export async function updateListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
  if (String(listing.donor) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the listing donor may edit it.' });
  if (listing.status !== 'available' || listing.quantityAvailable !== listing.quantity) {
    return res.status(409).json({ success: false, message: 'Listings with active reservations cannot be edited.' });
  }
  const fields = ['title', 'description', 'category', 'quantity', 'unit', 'allergens', 'handlingInstructions', 'pickupLocation', 'pickupStart', 'deadline'];
  for (const field of fields) if (req.body[field] !== undefined) listing[field] = req.body[field];
  if (new Date(listing.deadline) <= new Date(listing.pickupStart) || new Date(listing.pickupStart) <= new Date()) {
    return res.status(400).json({ success: false, message: 'Pickup must start in the future and the deadline must be after pickup starts.' });
  }
  listing.quantityAvailable = listing.quantity;
  await listing.save();
  await audit(req.user, 'listing.updated', 'listing', listing.id);
  res.json({ success: true, listing });
}

export async function cancelListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
  if (req.user.role !== 'admin' && String(listing.donor) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the donor or an administrator may cancel it.' });
  }
  if (listing.status === 'claimed') return res.status(409).json({ success: false, message: 'A claimed listing cannot be cancelled.' });
  const active = await Reservation.find({ listing: listing._id, status: { $in: ['reserved', 'assigned'] } });
  await Promise.all(active.map(reservation => {
    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    return reservation.save();
  }));
  listing.status = 'cancelled';
  await listing.save();
  await audit(req.user, 'listing.cancelled', 'listing', listing.id, { reservationsCancelled: active.length });
  res.json({ success: true, listing });
}
