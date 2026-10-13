import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['donor', 'recipient', 'volunteer', 'admin'], required: true },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  organization: {
    name: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    capacity: { type: Number, min: 0, default: 0 },
    dietaryNeeds: [{ type: String, trim: true }],
    pickupAvailability: [{ type: String, trim: true }],
    verified: { type: Boolean, default: false }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', userSchema);
