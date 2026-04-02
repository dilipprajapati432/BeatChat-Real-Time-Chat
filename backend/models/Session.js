import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, index: true },
  deviceOs: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  ip: { type: String, default: 'Unknown' },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export default Session;
