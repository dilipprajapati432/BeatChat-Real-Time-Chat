import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', authMiddleware, messageController.getActiveConversations);
router.delete('/chat/:partnerId', authMiddleware, messageController.clearChat);
router.get('/:receiverId', authMiddleware, messageController.getConversation);
router.delete('/:id', authMiddleware, messageController.deleteMessage);
router.put('/:id', authMiddleware, messageController.editMessage);
router.post('/:id/react', authMiddleware, messageController.toggleReaction);
router.post('/:id/star', authMiddleware, messageController.toggleStar);
router.post('/:id/pin', authMiddleware, messageController.togglePin);
router.post('/batch-delete', authMiddleware, messageController.batchDelete);

export default router;