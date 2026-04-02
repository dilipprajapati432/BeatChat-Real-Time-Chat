import express from 'express';
import multer from 'multer';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/register', upload.single('avatar'), authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/reset-password', authController.resetPassword);

// Protected Profile Management Routes
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.post('/verify-email-change', authMiddleware, authController.verifyEmailChange);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/deactivate', authMiddleware, authController.deactivateAccount);
router.delete('/delete', authMiddleware, authController.deleteAccount);
router.get('/get-me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

export default router;