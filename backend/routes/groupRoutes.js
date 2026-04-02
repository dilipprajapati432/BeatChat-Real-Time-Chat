import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, groupController.createGroup);
router.get('/', authMiddleware, groupController.getMyGroups);
router.put('/:id/add', authMiddleware, groupController.addMember);
router.put('/:id/leave', authMiddleware, groupController.leaveGroup);
router.put('/:id/remove', authMiddleware, groupController.removeMember);
router.put('/:id/admin', authMiddleware, groupController.transferAdmin);
router.get('/:id/messages', authMiddleware, groupController.getGroupMessages);
router.post('/join-by-code', authMiddleware, groupController.joinGroupByCode);
router.put('/:id/requests/handle', authMiddleware, groupController.handleJoinRequest);
router.put('/:id', authMiddleware, groupController.updateGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

export default router;
