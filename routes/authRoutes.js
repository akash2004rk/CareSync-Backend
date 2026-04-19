import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  getPatients,
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/me', getUserProfile);
router.get('/patients', protect, admin, getPatients);

export default router;
