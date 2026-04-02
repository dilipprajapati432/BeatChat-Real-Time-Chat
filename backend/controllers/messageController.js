import Message from '../models/Message.js';
import User from '../models/User.js';

export const getActiveConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find all messages where I am sender or receiver to get distinct partners
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).select('senderId receiverId');

    const partnerIds = new Set();
    messages.forEach(msg => {
      const sId = msg.senderId?.toString();
      const rId = msg.receiverId?.toString();
      if (sId && sId !== userId) partnerIds.add(sId);
      if (rId && rId !== userId) partnerIds.add(rId);
    });

    // Filter based on deletedChats
    const activePartners = [];
    for (const partnerId of partnerIds) {
      const deletedEntry = user.deletedChats.find(dc => dc.partnerId?.toString() === partnerId);

      if (!deletedEntry) {
        activePartners.push(partnerId);
      } else {
        // Check if there is a message AFTER deletedAt
        const hasNewMessage = await Message.exists({
          $or: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId }
          ],
          timestamp: { $gt: deletedEntry.deletedAt }
        });

        if (hasNewMessage) {
          activePartners.push(partnerId);
        }
      }
    }

    const users = await User.find({ _id: { $in: activePartners } }).select('name avatar email username lastSeen');
    
    // Get last message and unread count for each partner
    const usersWithLastMessage = await Promise.all(users.map(async (u) => {
      const [lastMsg, unreadCount] = await Promise.all([
        Message.findOne({
          $or: [
            { senderId: userId, receiverId: u._id },
            { senderId: u._id, receiverId: userId }
          ]
        })
        .sort({ timestamp: -1 })
        .select('text timestamp'),
        
        Message.countDocuments({
          senderId: u._id,
          receiverId: userId,
          status: { $ne: 'seen' }
        })
      ]);

      return {
        ...u.toObject(),
        unreadCount,
        lastMessage: lastMsg ? {
          text: lastMsg.text,
          timestamp: lastMsg.timestamp
        } : null
      };
    }));

    res.json(usersWithLastMessage);
  } catch (err) {
    next(err);
  }
};

export const clearChat = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingEntryIndex = user.deletedChats.findIndex(dc => dc?.partnerId?.toString() === partnerId);
    if (existingEntryIndex > -1) {
      user.deletedChats[existingEntryIndex].deletedAt = Date.now();
    } else {
      user.deletedChats.push({ partnerId, deletedAt: Date.now() });
    }

    await user.save();
    res.json({ message: 'Chat cleared successfully', deletedChats: user.deletedChats });
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user.id;

    // Check if user has cleared this chat
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const deletedChatEntry = user.deletedChats.find(dc => dc?.partnerId?.toString() === receiverId);
    const deleteTimestamp = deletedChatEntry ? deletedChatEntry.deletedAt : new Date(0);

    const recentMessages = await Message.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId }
      ],
      timestamp: { $gt: deleteTimestamp },
      deletedBy: { $ne: userId }
    })
      .sort({ timestamp: -1 })
      .limit(5000);

    res.json(recentMessages.reverse()); // Send back in chronological order
  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Message.deleteOne({ _id: id });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Text required' });

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    res.json({ message: 'Message updated', data: message });
  } catch (err) {
    next(err);
  }
};

export const toggleReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const reactions = message.reactions;
    let userPreviousEmoji = null;

    reactions.forEach(r => {
      const idx = r.users.indexOf(userId);
      if (idx > -1) {
        userPreviousEmoji = r.emoji;
        r.users.splice(idx, 1);
      }
    });

    if (userPreviousEmoji !== emoji) {
      // User is either adding or swapping
      let targetEntry = reactions.find(r => r.emoji === emoji);
      if (targetEntry) {
        targetEntry.users.push(userId);
      } else {
        reactions.push({ emoji, users: [userId] });
      }
    }

    // Cleanup: Remove empty emoji entries
    message.reactions = reactions.filter(r => r.users.length > 0);

    await message.save();
    res.json({ message: 'Reaction toggled', reactions: message.reactions });
  } catch (err) {
    next(err);
  }
};

export const batchDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Message IDs required' });
    }
    // Only delete messages where the user is the sender
    await Message.deleteMany({ 
      _id: { $in: ids }, 
      senderId: req.user.id 
    });
    res.json({ message: 'Messages deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const toggleStar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const index = message.starredBy.indexOf(userId);
    if (index > -1) {
      message.starredBy.splice(index, 1);
    } else {
      message.starredBy.push(userId);
    }

    await message.save();
    res.json({ message: 'Star toggled', starredBy: message.starredBy });
  } catch (err) {
    next(err);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Authorization check for pinning can be added here (e.g. only in certain chats or by certain users)
    message.isPinned = !message.isPinned;
    await message.save();
    res.json({ message: 'Pin status toggled', isPinned: message.isPinned });
  } catch (err) {
    next(err);
  }
};
