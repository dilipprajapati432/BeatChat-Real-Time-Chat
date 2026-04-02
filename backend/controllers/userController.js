import User from '../models/User.js';

export const blockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        if (!user.blockedUsers.includes(userId)) {
            user.blockedUsers.push(userId);
            await user.save();
        }

        res.json({ message: 'User blocked', blockedUsers: user.blockedUsers });
    } catch (err) {
        next(err);
    }
};

export const unblockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.blockedUsers = user.blockedUsers.filter(id => id?.toString() !== userId);
        await user.save();

        res.json({ message: 'User unblocked', blockedUsers: user.blockedUsers });
    } catch (err) {
        next(err);
    }
};

export const hideChat = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.hiddenChats.includes(userId)) {
            user.hiddenChats.push(userId);
            await user.save();
        }

        res.json({ message: 'Chat hidden', hiddenChats: user.hiddenChats });
    } catch (err) {
        next(err);
    }
};

export const unhideChat = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.hiddenChats = user.hiddenChats.filter(id => id?.toString() !== userId);
        await user.save();

        res.json({ message: 'Chat unhidden', hiddenChats: user.hiddenChats });
    } catch (err) {
        next(err);
    }
};

export const getHiddenChats = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('hiddenChats', 'name avatar email username');
        if (!user) return res.json([]);
        res.json(user.hiddenChats || []);
    } catch (err) {
        next(err);
    }
};

export const getBlockedUsers = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('blockedUsers', 'name avatar email');
        if (!user) return res.json([]);
        res.json(user.blockedUsers || []);
    } catch (err) {
        next(err);
    }
};

export const addContact = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot add yourself as a contact' });
        }

        if (!user.contacts.includes(userId)) {
            user.contacts.push(userId);
            await user.save();
        }

        res.json({ message: 'Contact added successfully', contacts: user.contacts });
    } catch (err) {
        next(err);
    }
};

export const getContacts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('contacts', 'name avatar email username');
        if (!user) return res.json([]);
        res.json(user.contacts || []);
    } catch (err) {
        next(err);
    }
};

export const searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) return res.json([]);

        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special chars

        const users = await User.find({
            $or: [
                { name: { $regex: escaped, $options: 'i' } },
                { username: { $regex: escaped, $options: 'i' } },
                { email: { $regex: `^${escaped}$`, $options: 'i' } }, // case-insensitive exact
                { phone: q.trim() }  // exact phone
            ],
            _id: { $ne: req.user.id }
            // Removed isVerified: true constraint for development ease
        }).select('name username avatar email phone').limit(20);

        res.json(users);
    } catch (err) {
        next(err);
    }
};

export const getPublicProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select('name avatar username');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};
