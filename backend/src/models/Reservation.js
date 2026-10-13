import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['reserved', 'assigned', 'picked_up', 'cancelled'], default: 'reserved', index: true },
  pickupCodeHash: { type: String, required: true, select: false },
  pickedUpAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null }
}, { timestamps: true });

reservationSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.pickupCodeHash;
    delete ret.__v;
    return ret;
  }
});

reservationSchema.index({ listing: 1, recipient: 1 }, {
  unique: true,
  partialFilterExpression: { status: { $in: ['reserved', 'assigned'] } }
});

export default mongoose.model('Reservation', reservationSchema);
