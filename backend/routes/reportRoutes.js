import express from 'express';
import { body, validationResult } from 'express-validator';
import * as reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const validateReport = [
    body('reason').isIn(['Spam', 'Harassment', 'Inappropriate Content', 'Other']).withMessage('Invalid reason'),
    body('description').optional().trim().escape()
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.post('/user/:userId', authMiddleware, validateReport, handleValidationErrors, reportController.reportUser);
router.post('/message/:messageId', authMiddleware, validateReport, handleValidationErrors, reportController.reportMessage);

export default router;
