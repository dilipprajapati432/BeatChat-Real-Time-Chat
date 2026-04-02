import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', sparse: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  clientId: { type: String, index: true, sparse: true },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }]
});

export default mongoose.model('Message', messageSchema);