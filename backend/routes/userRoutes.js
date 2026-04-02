import express from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/block/:userId', authMiddleware, userController.blockUser);
router.post('/unblock/:userId', authMiddleware, userController.unblockUser);
router.post('/hide/:userId', authMiddleware, userController.hideChat);
router.post('/unhide/:userId', authMiddleware, userController.unhideChat);
router.get('/hidden', authMiddleware, userController.getHiddenChats);
router.get('/blocked', authMiddleware, userController.getBlockedUsers);
router.post('/add-contact/:userId', authMiddleware, userController.addContact);
router.get('/contacts', authMiddleware, userController.getContacts);
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/invite/:userId', userController.getPublicProfile);

export default router;
