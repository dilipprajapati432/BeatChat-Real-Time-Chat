import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // Optional, if reporting a specific message
    reason: {
        type: String,
        required: true,
        enum: ['Spam', 'Harassment', 'Inappropriate Content', 'Other']
    },
    description: { type: String },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'reviewed', 'resolved', 'dismissed']
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);
