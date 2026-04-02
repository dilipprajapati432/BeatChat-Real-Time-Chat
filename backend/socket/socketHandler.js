import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

export default (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    // Security: Authenticate socket with JWT
    const token = socket.handshake.auth.token;
    if (!token) return socket.disconnect();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // Update status of undelivered messages to 'delivered'
      (async () => {
        try {
          const result = await Message.updateMany(
            { receiverId: userId, status: 'sent' },
            { $set: { status: 'delivered' } }
          );
        } catch (e) { console.error(e); }
      })();


      // Emit online users
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));

      // Typing event
      socket.on('typing', ({ to, isGroup }) => {
        if (isGroup) {
          socket.to(`group_${to}`).emit('typing', { from: to, isGroup: true, senderId: userId });
        } else {
          const toSocket = onlineUsers.get(to);
          if (toSocket) io.to(toSocket).emit('typing', { from: userId });
        }
      });

      // Mark messages as seen
      socket.on('markSeen', async ({ senderId }) => {
        try {
          const user = await User.findById(userId).select('privacy');
          const readReceiptsEnabled = user?.privacy?.readReceipts !== false;

          await Message.updateMany(
            { senderId: senderId, receiverId: userId, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
          );

          if (readReceiptsEnabled) {
            const senderSocket = onlineUsers.get(senderId);
            if (senderSocket) {
              io.to(senderSocket).emit('messagesSeen', { receiverId: userId });
            }
          }
        } catch (error) {
          console.error('Mark seen error:', error);
        }
      });

      // Message event
      socket.on('message', async ({ text, to, tempId, type, clientId }) => { 
        try {
          // 1. Deduplication check
          if (clientId) {
            const existing = await Message.findOne({ clientId });
            if (existing) {
              return socket.emit('messageSent', {
                tempId,
                _id: existing._id,
                status: existing.status,
                timestamp: existing.timestamp,
                receiverId: existing.receiverId,
                groupId: existing.groupId
              });
            }
          }

          // 2. Mention Parsing Helper
          const parseMentions = async (content) => {
            const mentionRegex = /@(\w+)/g;
            const matches = content.match(mentionRegex);
            if (!matches) return [];
            
            const usernames = matches.map(m => m.substring(1));
            const users = await User.find({ username: { $in: usernames } }).select('_id socketId');
            return users.map(u => u._id);
          };

          const mentionedUserIds = await parseMentions(text);

          // GROUP CHAT LOGIC
          if (type === 'group') {
            const group = await Group.findById(to);
            if (!group) return socket.emit('error', { message: 'Group not found' });

            if (!group.members.includes(userId)) return socket.emit('error', { message: 'Not a member' });

            const message = new Message({ 
              text, 
              senderId: userId, 
              groupId: to, 
              status: 'sent',
              mentions: mentionedUserIds,
              clientId
            });
            await message.save();
            await message.populate('senderId', 'name avatar');

            io.to(`group_${to}`).emit('groupMessage', {
              _id: message._id,
              text,
              senderId: userId,
              sender: message.senderId,
              groupId: to,
              timestamp: message.timestamp,
              status: 'sent',
              mentions: mentionedUserIds
            });

            // Notify mentioned users who are NOT in the active room (e.g. system-wide notification)
            mentionedUserIds.forEach(mId => {
              if (mId.toString() !== userId.toString()) {
                const mSocket = onlineUsers.get(mId.toString());
                if (mSocket) io.to(mSocket).emit('mentioned', { 
                  messageId: message._id, 
                  senderName: message.senderId.name,
                  text: text.substring(0, 50),
                  groupId: to 
                });
              }
            });

            socket.emit('messageSent', {
              tempId,
              _id: message._id,
              status: 'sent',
              timestamp: message.timestamp,
              groupId: to
            });
            return;
          }

          // DIRECT MESSAGE LOGIC
          const receiver = await User.findById(to);
          if (!receiver) return socket.emit('error', { message: 'User not found' });

          const isBlocked = receiver.blockedUsers && receiver.blockedUsers.includes(userId);
          const receiverSocket = onlineUsers.get(to);
          const status = (receiverSocket && !isBlocked) ? 'delivered' : 'sent';

          const message = new Message({ 
            text, 
            senderId: userId, 
            receiverId: to, 
            status,
            mentions: mentionedUserIds,
            clientId
          });
          await message.save();
          await message.populate('senderId', 'name username avatar');

          // UNDELETE & UNHIDE LOGIC
          const sender = await User.findById(userId);
          let senderChanged = false;
          let receiverChanged = false;

          if (sender.deletedChats.some(dc => dc.partnerId?.toString() === to.toString())) {
            sender.deletedChats = sender.deletedChats.filter(dc => dc.partnerId?.toString() !== to.toString());
            senderChanged = true;
          }
          if (sender.hiddenChats.includes(to)) {
            sender.hiddenChats = sender.hiddenChats.filter(id => id?.toString() !== to.toString());
            senderChanged = true;
          }
          if (senderChanged) await sender.save();

          if (receiver.deletedChats.some(dc => dc.partnerId?.toString() === userId.toString())) {
            receiver.deletedChats = receiver.deletedChats.filter(dc => dc.partnerId?.toString() !== userId.toString());
            receiverChanged = true;
          }
          if (receiver.hiddenChats.includes(userId)) {
            receiver.hiddenChats = receiver.hiddenChats.filter(id => id?.toString() !== userId.toString());
            receiverChanged = true;
          }
          if (receiverChanged) await receiver.save();

          if (receiverSocket && !isBlocked) {
            io.to(receiverSocket).emit('message', {
              text,
              senderId: userId,
              sender: message.senderId,
              receiverId: to,
              timestamp: message.timestamp,
              _id: message._id,
              status,
              mentions: mentionedUserIds
            });
          }

          // If mentioned (rare in DM, but possible)
          if (mentionedUserIds.includes(receiver._id) && receiverSocket) {
             // Already sent via 'message' event, but could emit specific mention event for UI highlight
             // io.to(receiverSocket).emit('mentioned', { ... });
          }

          socket.emit('messageSent', {
            tempId,
            _id: message._id,
            status,
            timestamp: message.timestamp,
            receiverId: to
          });

        } catch (error) {
          console.error('Message save error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Join Group Room
      socket.on('joinGroup', ({ groupId }) => {
        socket.join(`group_${groupId}`);
        console.log(`User ${userId} joined group_${groupId}`);
      });

      // Leave Group Room
      socket.on('leaveGroup', ({ groupId }) => {
        socket.leave(`group_${groupId}`);
      });

      // Delete Message Event
      socket.on('deleteMessage', async ({ messageId, type }) => {
        try {
          // Verify ownership
          const message = await Message.findById(messageId);
          if (message) {
            const isSender = message.senderId.toString() === userId;
            const isGroupMessage = !!message.groupId;

            if (type === 'everyone') {
              if (!isSender) return; // Only sender can delete for everyone

              // Check time limit (3 mins)
              const timeDiff = Date.now() - new Date(message.timestamp).getTime();
              if (timeDiff > 3 * 60 * 1000) {
                return socket.emit('error', { message: 'Time limit for deleting for everyone exceeded' });
              }

              // Delete from DB (or soft delete for all)
              await Message.deleteOne({ _id: messageId });

              if (isGroupMessage) {
                io.to(`group_${message.groupId}`).emit('messageDeleted', messageId);
              } else {
                // Notify receiver
                const receiverSocket = onlineUsers.get(message.receiverId.toString());
                if (receiverSocket) {
                  io.to(receiverSocket).emit('messageDeleted', messageId);
                }
              }
            } else if (type === 'me') {
              // Allow if sender OR receiver
              // For groups, usually only 'everyone' delete is broadcasted. 'me' is local.
              // But we need to support it if implemented. 
              const isReceiver = message.receiverId && message.receiverId.toString() === userId;

              if (isSender || isReceiver) { // For group check, receiverId is null, so only sender for now? or anyone?
                // Be careful with group 'delete for me' logic if it just hides.
                // Current schema has deletedChats array on User, but Message also has deletedBy?
                if (!message.deletedBy.includes(userId)) {
                  message.deletedBy.push(userId);
                  await message.save();
                }
              }
            }
          }
        } catch (error) {
          console.error("Delete socket error:", error);
        }
      });

      // Edit Message Event
      socket.on('editMessage', async ({ messageId, newText }) => {
        try {
          const message = await Message.findById(messageId);
          if (message && message.senderId.toString() === userId) {
            // Check time limit (10 mins)
            const timeDiff = Date.now() - new Date(message.timestamp).getTime();
            if (timeDiff > 10 * 60 * 1000) {
              return socket.emit('error', { message: 'Time limit for editing exceeded' });
            }

            message.text = newText;
            message.isEdited = true;
            await message.save();

            const isGroupMessage = !!message.groupId;

            if (isGroupMessage) {
              io.to(`group_${message.groupId}`).emit('messageEdited', { messageId, newText });
            } else {
              const receiverSocket = onlineUsers.get(message.receiverId.toString());
              if (receiverSocket) {
                io.to(receiverSocket).emit('messageEdited', { messageId, newText });
              }
            }
          }
        } catch (error) {
          console.error("Edit socket error:", error);
        }
      });



      // React to Message Event
      socket.on('reactMessage', async ({ messageId, emoji }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const reactions = message.reactions;
          let userPreviousEmoji = null;

          // 1. Remove user's existing reaction from ANY emoji
          reactions.forEach(r => {
            const idx = r.users.indexOf(userId);
            if (idx > -1) {
              userPreviousEmoji = r.emoji;
              r.users.splice(idx, 1);
            }
          });

          // 2. Add new reaction if it's not a toggle-off
          if (userPreviousEmoji !== emoji) {
            let targetEntry = reactions.find(r => r.emoji === emoji);
            if (targetEntry) {
              targetEntry.users.push(userId);
            } else {
              reactions.push({ emoji, users: [userId] });
            }
          }

          // 3. Cleanup empty entries
          message.reactions = reactions.filter(r => r.users.length > 0);

          await message.save();

          const updateData = { messageId, reactions: message.reactions };
          if (message.groupId) {
            io.to(`group_${message.groupId}`).emit('reactionUpdate', updateData);
          } else {
            const otherUser = message.senderId.toString() === userId ? message.receiverId : message.senderId;
            const otherSocket = onlineUsers.get(otherUser.toString());
            socket.emit('reactionUpdate', updateData); // Send to me
            if (otherSocket) io.to(otherSocket).emit('reactionUpdate', updateData); // Send to partner
          }
        } catch (error) {
          console.error("Reaction socket error:", error);
        }
      });

      // Pin / Unpin Message
      socket.on('pinMessage', async ({ messageId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          message.isPinned = !message.isPinned;
          await message.save();

          const updateData = { messageId, isPinned: message.isPinned };

          if (message.groupId) {
            io.to(`group_${message.groupId}`).emit('messagePinned', updateData);
          } else {
            // Notify both sender and receiver
            socket.emit('messagePinned', updateData);
            const otherUser = message.senderId.toString() === userId ? message.receiverId : message.senderId;
            const otherSocket = onlineUsers.get(otherUser.toString());
            if (otherSocket) io.to(otherSocket).emit('messagePinned', updateData);
          }
        } catch (error) {
          console.error("Pin message error:", error);
        }
      });

      // Star Message
      socket.on('starMessage', async ({ messageId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const index = message.starredBy.indexOf(userId);
          if (index > -1) {
            message.starredBy.splice(index, 1);
          } else {
            message.starredBy.push(userId);
          }
          await message.save();

          socket.emit('messageStarred', { messageId, starredBy: message.starredBy });
        } catch (error) {
          console.error("Star message error:", error);
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        onlineUsers.delete(userId);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        try {
          const user = await User.findById(userId).select('privacy');
          const showLastSeen = user?.privacy?.showLastSeen !== false;
          
          const now = new Date();
          await User.findByIdAndUpdate(userId, { lastSeen: now });
          
          // Notify other users of the offline status and lastSeen time (if permitted)
          io.emit('userStatusChanged', { 
            userId, 
            status: 'offline', 
            lastSeen: showLastSeen ? now : null 
          });
        } catch (err) {
          console.error('Error updating lastSeen:', err);
        }
      });

    } catch (err) {
      socket.disconnect();
    }
  });
};