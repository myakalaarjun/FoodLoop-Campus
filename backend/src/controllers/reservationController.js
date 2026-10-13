import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import Listing from '../models/Listing.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import { audit } from '../services/audit.js';
import { scoreMatch } from '../services/matching.js';
import { expireDueListings } from '../services/expiration.js';

export async function createReservation(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number.' });
  if (!req.user.organization?.verified) return res.status(403).json({ success: false, message: 'Your organization must be verified before reserving food.' });
  if (req.user.organization.capacity < quantity) return res.status(400).json({ success: false, message: 'Requested quantity exceeds your organization pickup capacity.' });
  const candidate = await Listing.findOne({
    _id: req.params.listingId,
    status: 'available',
    deadline: { $gt: new Date() },
    quantityAvailable: { $gte: quantity }
  });
  if (!candidate) return res.status(409).json({ success: false, message: 'Listing is unavailable or has insufficient quantity.' });
  if (!scoreMatch(candidate, req.user).eligible) {
    return res.status(400).json({ success: false, message: 'This listing does not meet your dietary, pickup, capacity, or deadline requirements.' });
  }
  const listing = await Listing.findOneAndUpdate(
    { _id: req.params.listingId, status: 'available', deadline: { $gt: new Date() }, quantityAvailable: { $gte: quantity } },
    { $inc: { quantityAvailable: -quantity } },
    { new: true }
  );
  if (!listing) return res.status(409).json({ success: false, message: 'Listing is unavailable or has insufficient quantity.' });

  let reservation;
  let pickupCode;
  try {
    const activeReservation = await Reservation.findOne({
      listing: listing._id, recipient: req.user._id, status: { $in: ['reserved', 'assigned'] }
    });
    if (activeReservation) {
      await Listing.updateOne({ _id: listing._id }, { $inc: { quantityAvailable: quantity } });
      return res.status(409).json({ success: false, message: 'You already have an active reservation for this listing.' });
    }
    pickupCode = crypto.randomInt(100000, 1000000).toString();
    reservation = await Reservation.create({
      listing: listing._id,
      recipient: req.user._id,
      quantity,
      pickupCodeHash: await bcrypt.hash(pickupCode, 12)
    });
  } catch (error) {
    await Listing.updateOne({ _id: listing._id }, { $inc: { quantityAvailable: quantity } });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'You already have an active reservation for this listing.' });
    throw error;
  }
  if (listing.quantityAvailable === 0) {
    listing.status = 'reserved';
    await listing.save();
  }
  await audit(req.user, 'reservation.created', 'reservation', reservation.id, { listing: listing.id, quantity });
  res.set('Cache-Control', 'no-store');
  res.status(201).json({ success: true, reservation, pickupCode });
}

export async function listReservations(req, res) {
  await expireDueListings();
  const filter = {};
  if (req.user.role === 'recipient') filter.recipient = req.user._id;
  if (req.user.role === 'donor') {
    const listings = await Listing.find({ donor: req.user._id }).select('_id');
    filter.listing = { $in: listings.map(item => item._id) };
  }
  if (req.user.role === 'volunteer') filter.$or = [{ volunteer: req.user._id }, { status: 'reserved' }];
  if (req.query.status) filter.status = req.query.status;
  const reservations = await Reservation.find(filter)
    .populate({ path: 'listing', populate: { path: 'donor', select: 'name organization.name' } })
    .populate('recipient', 'name organization.name')
    .populate('volunteer', 'name');
  res.json({ success: true, reservations });
}

export async function listVolunteers(_req, res) {
  const volunteers = await User.find({ role: 'volunteer', active: true }).select('name email');
  res.json({ success: true, volunteers });
}

export async function assignVolunteer(req, res) {
  await expireDueListings();
  let volunteerId;
  const statuses = ['reserved'];
  if (req.user.role === 'volunteer') {
    volunteerId = req.user._id;
  } else {
    if (req.user.role === 'donor') {
      const target = await Reservation.findById(req.params.id).populate('listing', 'donor');
      if (!target) return res.status(404).json({ success: false, message: 'Reservation not found.' });
      if (String(target.listing.donor) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'You can only assign volunteers to your own listings.' });
      }
    }
    const volunteer = await User.findOne({ _id: req.body.volunteerId, role: 'volunteer', active: true });
    if (!volunteer) return res.status(400).json({ success: false, message: 'An active volunteer account is required.' });
    volunteerId = volunteer._id;
    statuses.push('assigned');
  }
  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: { $in: statuses } },
    { $set: { volunteer: volunteerId, status: 'assigned' } },
    { new: true }
  );
  if (!reservation) return res.status(409).json({ success: false, message: 'Reservation is unavailable for assignment.' });
  await audit(req.user, 'reservation.assigned', 'reservation', reservation.id, { volunteer: reservation.volunteer });
  res.json({ success: true, reservation });
}

export async function verifyPickup(req, res) {
  await expireDueListings();
  const reservation = await Reservation.findById(req.params.id).select('+pickupCodeHash').populate('listing', 'donor');
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
  const donor = String(reservation.listing.donor) === String(req.user._id);
  const assignedVolunteer = String(reservation.volunteer) === String(req.user._id);
  if (!donor && !assignedVolunteer && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the listing donor, assigned volunteer, or an administrator can verify pickup.' });
  }
  if (!['reserved', 'assigned'].includes(reservation.status)) return res.status(409).json({ success: false, message: 'Reservation cannot be handed over in its current state.' });
  if (!(await bcrypt.compare(String(req.body.pickupCode ?? ''), reservation.pickupCodeHash))) {
    return res.status(400).json({ success: false, message: 'Pickup code is incorrect.' });
  }
  const verifiedReservation = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: { $in: ['reserved', 'assigned'] } },
    { $set: { status: 'picked_up', pickedUpAt: new Date() } },
    { new: true }
  );
  if (!verifiedReservation) return res.status(409).json({ success: false, message: 'Reservation has already changed state.' });
  const listing = await Listing.findById(reservation.listing._id);
  if (listing && listing.quantityAvailable === 0) {
    const pending = await Reservation.exists({ listing: listing._id, status: { $in: ['reserved', 'assigned'] }, _id: { $ne: reservation._id } });
    if (!pending) {
      listing.status = 'claimed';
      await listing.save();
    }
  } else if (listing && listing.status === 'reserved') {
    listing.status = 'available';
    await listing.save();
  }
  await audit(req.user, 'reservation.picked_up', 'reservation', reservation.id);
  res.json({ success: true, message: 'Handover verified.', reservation: verifiedReservation });
}

export async function cancelReservation(req, res) {
  await expireDueListings();
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
  if (req.user.role !== 'admin' && String(reservation.recipient) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the recipient may cancel this reservation.' });
  }
  if (!['reserved', 'assigned'].includes(reservation.status)) return res.status(409).json({ success: false, message: 'Reservation cannot be cancelled in its current state.' });
  const cancelledReservation = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: { $in: ['reserved', 'assigned'] } },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true }
  );
  if (!cancelledReservation) return res.status(409).json({ success: false, message: 'Reservation has already changed state.' });
  const listing = await Listing.findById(reservation.listing);
  if (listing && !['cancelled', 'expired'].includes(listing.status)) {
    listing.quantityAvailable += reservation.quantity;
    listing.status = 'available';
    await listing.save();
  }
  await audit(req.user, 'reservation.cancelled', 'reservation', reservation.id);
  res.json({ success: true, reservation: cancelledReservation });
}
