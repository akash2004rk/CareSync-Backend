import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
  setDoctorSlots,
  addDoctorByAdmin,
  deleteDoctorByAdmin,
  getAdminDoctors,
  verifyDoctor,
} from '../controllers/doctorController.js';
import { protect, doctor, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/profile', protect, doctor, getDoctorProfile);
router.get('/:id', getDoctorById);
router.put('/profile/:id', protect, doctor, updateDoctorProfile);
router.put('/slots', protect, doctor, setDoctorSlots);
router.get('/admin/all', protect, admin, getAdminDoctors);
router.post('/admin/add', protect, admin, addDoctorByAdmin);
router.delete('/admin/:id', protect, admin, deleteDoctorByAdmin);
router.put('/admin/:id/verify', protect, admin, verifyDoctor);

export default router;
