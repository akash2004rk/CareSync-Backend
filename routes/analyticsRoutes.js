import express from 'express';
import { getAdminAnalytics, getDoctorAnalytics, getPublicStats } from '../controllers/analyticsController.js';
import { protect, admin, doctor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/admin', protect, admin, getAdminAnalytics);
router.get('/doctor', protect, doctor, getDoctorAnalytics);

export default router;
