import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

// @desc    Get admin analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = await Appointment.countDocuments({ date: today });
  
  const completedAppointments = await Appointment.find({ status: 'completed' });
  
  // Dynamic Real Revenue Calculation
  const docProfiles = await DoctorProfile.find({});
  const feeMap = {};
  docProfiles.forEach(doc => feeMap[doc.userId.toString()] = doc.consultationFee);
  
  let revenue = 0;
  completedAppointments.forEach(appt => {
    revenue += (feeMap[appt.doctorId.toString()] || 500);
  });

  // 7-day appointment chart data
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = await Promise.all(last7Days.map(async (date) => {
    const count = await Appointment.countDocuments({ date });
    return { date, appointments: count };
  }));

  // Status distribution
  const pending = await Appointment.countDocuments({ status: 'pending' });
  const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
  const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
  const completed = completedAppointments.length;

  res.json({
    stats: {
      totalPatients,
      totalDoctors,
      todayAppointments,
      revenue,
    },
    chartData,
    statusDistribution: [
      { name: 'Pending', value: pending },
      { name: 'Confirmed', value: confirmed },
      { name: 'Cancelled', value: cancelled },
      { name: 'Completed', value: completed },
    ],
  });
};

// @desc    Get doctor analytics
// @route   GET /api/analytics/doctor
// @access  Private (Doctor)
const getDoctorAnalytics = async (req, res) => {
  const doctorId = req.user._id;

  const appointments = await Appointment.find({ doctorId });
  
  // Total unique patients
  const uniquePatientIds = [...new Set(appointments.map(a => a.patientId.toString()))];
  const totalPatients = uniquePatientIds.length;

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today).length;

  // Pending reports (completed but missing prescription)
  // or generally pending/confirmed ones
  const pendingReports = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length;

  res.json({
    totalPatients,
    todayAppointments,
    pendingReports,
  });
};

// @desc    Get public analytics for landing page
// @route   GET /api/analytics/public
// @access  Public
const getPublicStats = async (req, res) => {
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  res.json({
    totalPatients,
    totalDoctors,
    successRate: 98 // System-wide constant metric
  });
};

export { getAdminAnalytics, getDoctorAnalytics, getPublicStats };
