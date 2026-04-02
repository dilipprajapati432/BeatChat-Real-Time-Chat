import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, // unique username
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' }, // Frontend handles default if empty
  phone: { type: String, default: '' },
  deletedChats: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: Date.now }
  }],
  hiddenChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // New field for hidden chats
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Added contacts field
  isVerified: { type: Boolean, default: false },
  isDeactivated: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpires: { type: Date },
  pendingEmail: { type: String }, // For email change verification
  pendingEmailCode: { type: String },
  lastSeen: { type: Date, default: Date.now }
});

// Security: Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;