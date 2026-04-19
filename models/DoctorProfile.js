import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // Format: HH:mm
  endTime: { type: String, required: true }, // Format: HH:mm
  isBooked: { type: Boolean, default: false },
});

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      default: 500,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    experience: {
      type: Number,
      default: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    availableSlots: [slotSchema],
  },
  {
    timestamps: true,
  }
);

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
