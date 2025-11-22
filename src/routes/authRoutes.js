import { Router } from 'express';
import {
  register,
  login,
  sendVerification,
  verifyPhone,
  skipVerification,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-verification', sendVerification);
router.post('/verify-phone', verifyPhone);
router.post('/skip-verification', skipVerification);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
