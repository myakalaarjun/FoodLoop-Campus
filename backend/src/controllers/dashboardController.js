import Listing from '../models/Listing.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { scoreMatch } from '../services/matching.js';
import { expireDueListings } from '../services/expiration.js';

function mealsRescued(reservations) {
  return reservations
    .filter(item => item.status === 'picked_up' && /^(meal|meals|serving|servings|portion|portions)$/i.test(item.listing?.unit || ''))
    .reduce((sum, item) => sum + item.quantity, 0);
}

export async function dashboard(req, res) {
  await expireDueListings();
  const { role, _id } = req.user;
  let data;
  if (role === 'donor') {
    const listings = await Listing.find({ donor: _id });
    const reservations = await Reservation.find({ listing: { $in: listings.map(item => item._id) } }).populate('listing', 'unit');
    data = {
      listings: listings.length,
      available: listings.filter(item => item.status === 'available' && item.deadline > new Date()).length,
      reserved: reservations.filter(item => ['reserved', 'assigned'].includes(item.status)).length,
      mealsRescued: mealsRescued(reservations)
    };
  } else if (role === 'recipient') {
    const [reservations, listings] = await Promise.all([
      Reservation.find({ recipient: _id }).populate('listing', 'unit'),
      Listing.find({ status: 'available', deadline: { $gt: new Date() } })
    ]);
    data = {
      activeReservations: reservations.filter(item => ['reserved', 'assigned'].includes(item.status)).length,
      pickupsCompleted: reservations.filter(item => item.status === 'picked_up').length,
      mealsReceived: mealsRescued(reservations),
      recommended: listings.map(item => ({ listing: item, match: scoreMatch(item, req.user) })).filter(item => item.match.eligible).sort((a, b) => b.match.score - a.match.score).slice(0, 5)
    };
  } else if (role === 'volunteer') {
    const reservations = await Reservation.find({ volunteer: _id }).populate('listing', 'unit');
    data = {
      activeAssignments: reservations.filter(item => item.status === 'assigned').length,
      completedPickups: reservations.filter(item => item.status === 'picked_up').length,
      mealsDelivered: mealsRescued(reservations)
    };
  } else {
    const [users, listings, reservations, auditLogs] = await Promise.all([
      User.countDocuments(),
      Listing.find(),
      Reservation.find().populate('listing', 'unit'),
      AuditLog.find().sort({ createdAt: -1 }).limit(20).populate('actor', 'name email')
    ]);
    data = {
      users,
      organizationsAwaitingVerification: await User.countDocuments({ role: 'recipient', 'organization.verified': false }),
      listings: listings.length,
      activeListings: listings.filter(item => ['available', 'reserved'].includes(item.status) && item.deadline > new Date()).length,
      reservations: reservations.length,
      mealsRescued: mealsRescued(reservations),
      auditLogs
    };
  }
  res.json({ success: true, data });
}
