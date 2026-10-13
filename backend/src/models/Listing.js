import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 60, default: 'Food' },
  quantity: { type: Number, required: true, min: 1 },
  quantityAvailable: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, maxlength: 30, default: 'meals' },
  allergens: [{ type: String, trim: true }],
  handlingInstructions: { type: String, trim: true, maxlength: 1000, default: '' },
  pickupLocation: { type: String, required: true, trim: true, maxlength: 250 },
  pickupStart: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['available', 'reserved', 'claimed', 'cancelled', 'expired'], default: 'available', index: true }
}, { timestamps: true });

listingSchema.index({ status: 1, deadline: 1, createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
