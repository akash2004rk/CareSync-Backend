import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    recordType: {
      type: String, // e.g., "Prescription", "Lab Report", "Scan"
      default: 'Prescription',
    },
    uploadedBy: {
      type: String,
      enum: ['doctor', 'patient'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
