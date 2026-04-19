import express from 'express';
import {
  uploadMedicalRecord,
  getMedicalRecords,
  deleteMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../utils/multerConfig.js';

const router = express.Router();

router.use(protect); // All medical record routes are protected

router.get('/', getMedicalRecords);
router.post('/', upload.single('file'), uploadMedicalRecord);
router.delete('/:id', deleteMedicalRecord);

export default router;
