import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import sendEmail from '../utils/emailConfig.js';
import Notification from '../models/Notification.js';

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Check if slot is available
    const slotIndex = doctorProfile.availableSlots.findIndex(
      (slot) => slot.date === date && slot.startTime === timeSlot && !slot.isBooked
    );

    if (slotIndex === -1) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      timeSlot,
      reason,
    });

    if (appointment) {
      // Mark slot as booked
      doctorProfile.availableSlots[slotIndex].isBooked = true;
      await doctorProfile.save();

      // Notify Doctor via DB
      await Notification.create({
        userId: doctorId,
        message: `New appointment booked by ${req.user.name} for ${date} at ${timeSlot}`,
        relatedAppointmentId: appointment._id,
      });

      // Send Emails
      const doctorUser = await User.findById(doctorId);
      await sendEmail({
        email: req.user.email,
        subject: 'Appointment Booked Successfully',
        message: `Your appointment with Dr. ${doctorUser.name} is scheduled for ${date} at ${timeSlot}.`,
      });

      await sendEmail({
        email: doctorUser.email,
        subject: 'New Appointment Booking',
        message: `You have a new booking from ${req.user.name} on ${date} at ${timeSlot}.`,
      });

      res.status(201).json(appointment);
    } else {
      res.status(400).json({ message: 'Invalid appointment data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Appointment creation failed' });
  }
};

// @desc    Get user appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  let appointments;

  if (req.user.role === 'admin') {
    appointments = await Appointment.find({})
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email');
  } else if (req.user.role === 'doctor') {
    appointments = await Appointment.find({ doctorId: req.user._id })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email');
  } else {
    appointments = await Appointment.find({ patientId: req.user._id })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email');
  }

  res.json(appointments);
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.status = req.body.status || appointment.status;
      const updatedAppointment = await appointment.save();

      // Notify Patient
      const patientUser = await User.findById(appointment.patientId);
      await Notification.create({
        userId: appointment.patientId,
        message: `Your appointment status has been updated to: ${req.body.status}`,
        relatedAppointmentId: appointment._id,
      });

      await sendEmail({
        email: patientUser.email,
        subject: 'Appointment Status Updated',
        message: `Your appointment on ${appointment.date} is now ${req.body.status}.`,
      });

      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Status update failed' });
  }
};

// @desc    Upload prescription
// @route   POST /api/appointments/:id/prescription
// @access  Private (Doctor only)
const uploadPrescription = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.prescriptionFile = req.file ? req.file.path : appointment.prescriptionFile;
      appointment.diagnosisNotes = req.body.diagnosisNotes || appointment.diagnosisNotes;
      appointment.status = 'completed';
      
      const updatedAppointment = await appointment.save();

      // Notify Patient
      await Notification.create({
        userId: appointment.patientId,
        message: `Dr. ${req.user.name} has uploaded your prescription.`,
        relatedAppointmentId: appointment._id,
      });

      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Prescription upload failed' });
  }
};

export {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  uploadPrescription,
};
