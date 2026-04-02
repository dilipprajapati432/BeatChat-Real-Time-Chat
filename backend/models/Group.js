import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' }, // URL to Cloudinary
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    groupCode: { type: String, unique: true, required: true },
    isPublic: { type: Boolean, default: true },
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Group', groupSchema);
