import Report from '../models/Report.js';

export const reportUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { reason, description } = req.body;

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot report yourself' });
        }

        // Check for duplicate pending report from this user to that user in last 24h
        const recentReport = await Report.findOne({
            reporter: req.user.id,
            reportedUser: userId,
            status: 'pending',
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentReport) {
            return res.status(429).json({ error: 'You have already reported this user recently.' });
        }

        const report = new Report({
            reporter: req.user.id,
            reportedUser: userId,
            reason,
            description
        });

        await report.save();
        res.status(201).json({ message: 'User reported successfully' });
    } catch (err) {
        next(err);
    }
};

export const reportMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { reason, description, reportedUserId } = req.body;

        const report = new Report({
            reporter: req.user.id,
            reportedUser: reportedUserId,
            reportedMessage: messageId,
            reason,
            description
        });

        await report.save();
        res.status(201).json({ message: 'Message reported successfully' });
    } catch (err) {
        next(err);
    }
};
