import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  
  // Verification details
  otpCode: { type: String, required: true },
  
  // TTL Index: This document will automatically be deleted 15 minutes after insertion
  createdAt: { type: Date, default: Date.now, expires: 900 }
});

// Security: Hash password before save
pendingUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const PendingUser = mongoose.models.PendingUser || mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;
