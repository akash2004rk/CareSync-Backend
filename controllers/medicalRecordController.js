import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';

// @desc    Upload a new medical record
// @route   POST /api/medical-records
// @access  Private
export const uploadMedicalRecord = async (req, res) => {
  try {
    const { recordType, patientId, appointmentId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const recordData = {
      patientId: req.user.role === 'doctor' ? patientId : req.user._id,
      fileUrl: req.file.path,
      recordType: recordType || 'Lab Report',
      uploadedBy: req.user.role === 'doctor' ? 'doctor' : 'patient',
    };

    if (req.user.role === 'doctor') {
      recordData.doctorId = req.user._id;
      if (appointmentId) recordData.appointmentId = appointmentId;
    }

    const record = await MedicalRecord.create(recordData);

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user medical records
// @route   GET /api/medical-records
// @access  Private
export const getMedicalRecords = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query = { patientId: req.user._id };
    } else if (req.user.role === 'doctor') {
      if (req.query.patientId) {
        // Check if doctor has an appointment with this patient
        const hasAppointment = await Appointment.findOne({
          doctorId: req.user._id,
          patientId: req.query.patientId
        });

        // Also check if the doctor uploaded any records for this patient directly
        const hasUploadedRecord = await MedicalRecord.findOne({
          doctorId: req.user._id,
          patientId: req.query.patientId
        });

        if (!hasAppointment && !hasUploadedRecord) {
          return res.status(403).json({ message: 'Not authorized to view this patient\'s records' });
        }
        query = { patientId: req.query.patientId };
      } else {
        // Show records uploaded by this doctor
        query = { doctorId: req.user._id };
      }
    } else if (req.user.role === 'admin') {
      if (req.query.patientId) {
        query = { patientId: req.query.patientId };
      } else {
        query = {};
      }
    }

    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'name')
      .populate('patientId', 'name')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
// @access  Private
export const deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Only owner (patient), the doctor who uploaded it, or admin can delete
    const isPatientOwner = record.patientId.toString() === req.user._id.toString();
    const isDoctorUploader = record.doctorId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatientOwner && !isDoctorUploader && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Record removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
