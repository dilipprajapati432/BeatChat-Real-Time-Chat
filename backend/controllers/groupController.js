import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Helper to generate unique numeric group code
const generateGroupCode = async () => {
    let code;
    let exists = true;
    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const group = await Group.findOne({ groupCode: code });
        if (!group) exists = false;
    }
    return code;
};

export const createGroup = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;
        if (!name) return res.status(400).json({ error: 'Group name is required' });

        const uniqueMembers = [...new Set([...(members || []), req.user.id])];
        const groupCode = await generateGroupCode();

        const group = new Group({
            name,
            description,
            admin: req.user.id,
            members: uniqueMembers,
            groupCode,
            isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true
        });

        await group.save();
        await group.populate('members', 'name avatar email');
        await group.populate('admin', 'name avatar');

        res.status(201).json(group);
    } catch (err) {
        next(err);
    }
};

export const getMyGroups = async (req, res, next) => {
    try {
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'name avatar email')
            .populate('admin', 'name avatar')
            .sort({ updatedAt: -1 });

        // Backfill missing group codes for older groups
        for (let group of groups) {
            if (!group.groupCode) {
                group.groupCode = await generateGroupCode();
                await group.save();
            }
        }

        const groupsWithLastMessage = await Promise.all(groups.map(async (group) => {
            const lastMsg = await Message.findOne({ groupId: group._id })
                .sort({ timestamp: -1 })
                .select('text timestamp')
                .populate('senderId', 'name');

            return {
                ...group.toObject(),
                lastMessage: lastMsg ? {
                    text: lastMsg.text,
                    timestamp: lastMsg.timestamp,
                    senderName: lastMsg.senderId?.name
                } : null
            };
        }));

        res.json(groupsWithLastMessage);
    } catch (err) {
        next(err);
    }
};

export const addMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });

        if (!group.members.includes(req.user.id) && group.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only group members can invite others' });
        }

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
        }

        await group.populate('members', 'name avatar email');
        res.json(group);
    } catch (err) {
        next(err);
    }
};

export const leaveGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        group.members = group.members.filter(m => m.toString() !== req.user.id);
        await group.save();

        res.json({ message: 'Successfully left the group', groupId: group._id });
    } catch (err) {
        next(err);
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });

        const isSelf = userId === req.user.id;
        const isAdmin = group.admin.toString() === req.user.id;

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();
        await group.populate('members', 'name avatar email');

        const io = req.app.get('io');
        if (io) {
            io.to(`group_${req.params.id}`).emit('groupUpdated', group);
            io.emit('userRemovedFromGroup', { groupId: group._id, userId: userId });
        }

        res.json({ message: 'Member removed', groupId: group._id, userId });
    } catch (err) {
        next(err);
    }
};

export const transferAdmin = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });

        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the admin can assign a new admin' });
        }

        if (!group.members.includes(userId)) {
            return res.status(400).json({ error: 'New admin must be a group member' });
        }

        group.admin = userId;
        await group.save();
        await group.populate('members', 'name username avatar');
        await group.populate('admin', 'name username avatar');

        const io = req.app.get('io');
        if (io) {
            io.to(`group_${group._id}`).emit('groupUpdated', group);
        }

        res.json(group);
    } catch (err) {
        next(err);
    }
};

export const getGroupMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (!group.members.includes(req.user.id)) return res.status(403).json({ error: 'Not a member' });

        const messages = await Message.find({ groupId: id })
            .populate('senderId', 'name avatar')
            .populate('receiverId', 'name avatar')
            .sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        next(err);
    }
};

export const joinGroupByCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        const group = await Group.findOne({ groupCode: code });

        if (!group) return res.status(404).json({ error: 'Group not found with this code' });

        if (group.members.includes(req.user.id)) {
            return res.status(400).json({ error: 'You are already a member' });
        }

        if (group.isPublic) {
            group.members.push(req.user.id);
            await group.save();
            await group.populate('members', 'name avatar email');
            return res.json({ message: 'Successfully joined group', group });
        } else {
            if (group.joinRequests.includes(req.user.id)) {
                return res.status(400).json({ error: 'Request already sent' });
            }
            group.joinRequests.push(req.user.id);
            await group.save();
            return res.json({ message: 'Join request sent to admin', pending: true });
        }
    } catch (err) {
        next(err);
    }
};

export const handleJoinRequest = async (req, res, next) => {
    try {
        const { userId, action } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admin can handle requests' });
        }

        if (action === 'accept') {
            if (!group.members.includes(userId)) {
                group.members.push(userId);
            }
        }

        group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
        await group.save();
        await group.populate('members', 'name avatar email');
        await group.populate('joinRequests', 'name avatar email');

        res.json(group);
    } catch (err) {
        next(err);
    }
};

export const updateGroup = async (req, res, next) => {
    try {
        const { name, description, avatar } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admin can edit group details' });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (avatar !== undefined) group.avatar = avatar;
        if (req.body.isPublic !== undefined) group.isPublic = req.body.isPublic;

        group.updatedAt = Date.now();
        await group.save();
        await group.populate('members', 'name avatar email');
        await group.populate('joinRequests', 'name avatar email');

        const io = req.app.get('io');
        if (io) {
            io.to(`group_${req.params.id}`).emit('groupUpdated', group);
        }

        res.json(group);
    } catch (err) {
        next(err);
    }
};

export const deleteGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admin can delete the group' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`group_${req.params.id}`).emit('groupDeleted', { groupId: req.params.id });
        }

        await Message.deleteMany({ groupId: req.params.id });
        await Group.deleteOne({ _id: req.params.id });

        res.json({ message: 'Group and its messages deleted successfully', groupId: req.params.id });
    } catch (err) {
        next(err);
    }
};
