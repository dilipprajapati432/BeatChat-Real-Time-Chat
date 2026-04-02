import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();


router.get('/:targetId', authMiddleware, async (req, res, next) => {
  try {
    const { targetId } = req.params;
    const { type } = req.query;
    const userId = req.user.id;

    let messages = [];
    let title = 'Chat Export';

    if (type === 'group') {
      const group = await Group.findById(targetId);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      title = `Group Chat Export - ${group.name}`;
      messages = await Message.find({ groupId: targetId })
        .sort({ timestamp: 1 })
        .populate('senderId', 'name');
    } else {
      const partner = await User.findById(targetId);
      if (!partner) return res.status(404).json({ error: 'User not found' });

      title = `Chat Export with ${partner.name}`;
      messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId }
        ]
      })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name');
    }

    let output = `${title}\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `-------------------------------------------\n\n`;

    messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.senderId ? msg.senderId.name : 'Unknown User';
      output += `[${time}] ${sender}: ${msg.text}\n`;
    });

    res.setHeader('Content-Disposition', `attachment; filename="chat-export-${targetId}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(output);

  } catch (err) {
    next(err);
  }
});

export default router;
