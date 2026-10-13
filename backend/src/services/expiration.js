import Listing from '../models/Listing.js';
import Reservation from '../models/Reservation.js';
import { audit } from './audit.js';

export async function expireDueListings() {
  const now = new Date();
  const due = await Listing.find({
    status: { $in: ['available', 'reserved'] },
    deadline: { $lte: now }
  }).select('_id');

  for (const candidate of due) {
    const listing = await Listing.findOneAndUpdate(
      { _id: candidate._id, status: { $in: ['available', 'reserved'] }, deadline: { $lte: now } },
      { $set: { status: 'expired' } },
      { new: true }
    ).select('_id');
    if (!listing) continue;

    const result = await Reservation.updateMany(
      { listing: listing._id, status: { $in: ['reserved', 'assigned'] } },
      { $set: { status: 'cancelled', cancelledAt: now } }
    );
    await audit(null, 'listing.expired', 'listing', listing.id, {
      reservationsCancelled: result.modifiedCount
    });
  }
}
