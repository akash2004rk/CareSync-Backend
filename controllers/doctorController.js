import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  const { specialization, limit } = req.query;
  const filter = { isVerified: true };
  if (specialization) filter.specialization = specialization;

  const doctors = await DoctorProfile.find(filter)
    .populate('userId', 'name email profilePicture')
    .limit(limit ? parseInt(limit) : 0);

  res.json(doctors);
};

// @desc    Get doctor profile by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  const doctor = await DoctorProfile.findOne({ userId: req.params.id }).populate(
    'userId',
    'name email profilePicture'
  );

  if (doctor) {
    res.json(doctor);
  } else {
    res.status(404).json({ message: 'Doctor not found' });
  }
};

// @desc    Get logged in doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
const getDoctorProfile = async (req, res) => {
  const doctor = await DoctorProfile.findOne({ userId: req.user._id }).populate(
    'userId',
    'name email profilePicture'
  );

  if (doctor) {
    res.json(doctor);
  } else {
    res.status(404).json({ message: 'Doctor profile not found' });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
const updateDoctorProfile = async (req, res) => {
  const { id } = req.params;

  // 1. Check if req.params.id is valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Doctor ID' });
  }

  // 2. Add try-catch with proper error response
  try {
    // 3. Check req.body empty
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is empty' });
    }

    // 4. Use findByIdAndUpdate with runValidators
    const updatedDoctor = await DoctorProfile.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedDoctor) {
      res.status(200).json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Doctor profile not found' });
    }
  } catch (error) {
    console.error('Error in updateDoctorProfile:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// @desc    Set doctor availability slots
// @route   PUT /api/doctors/slots
// @access  Private (Doctor only)
const setDoctorSlots = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });

    if (doctor) {
      const incomingSlots = req.body.slots || [];
      
      // 1. Identify existing booked slots
      const alreadyBooked = doctor.availableSlots.filter(s => s.isBooked);
      
      // 2. Filter incoming slots to avoid duplicates with booked ones
      // and ensure they aren't trying to 'unbook' a slot through this endpoint
      const newAvailable = incomingSlots.filter(ins => 
        !alreadyBooked.some(bs => bs.date === ins.date && bs.startTime === ins.startTime)
      ).map(s => ({ ...s, isBooked: false }));

      // 3. Combine: Keep all strictly booked ones + the new set of available ones
      doctor.availableSlots = [...alreadyBooked, ...newAvailable];
      
      const updatedDoctor = await doctor.save();
      res.json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Doctor profile not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update slots' });
  }
};

// @desc    Admin adds a new doctor (register + create profile)
// @route   POST /api/doctors/admin/add
// @access  Private (Admin)
const addDoctorByAdmin = async (req, res) => {
  const { name, email, password, specialization, consultationFee, experience } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const user = await User.create({ name, email, password, role: 'doctor' });

  if (user) {
    await DoctorProfile.create({
      userId: user._id,
      specialization: specialization || 'General Physician',
      consultationFee: consultationFee || 500,
      experience: experience || 0,
      isVerified: true,
    });
    res.status(201).json({ message: 'Doctor added successfully', userId: user._id });
  } else {
    res.status(400).json({ message: 'Failed to create doctor' });
  }
};

// @desc    Admin deletes a doctor
// @route   DELETE /api/doctors/admin/:id
// @access  Private (Admin)
const deleteDoctorByAdmin = async (req, res) => {
  const profileId = req.params.id;
  
  const doctorProfile = await DoctorProfile.findById(profileId);
  if (!doctorProfile) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }
  
  // Delete the actual user account if it exists
  if (doctorProfile.userId) {
    await User.findByIdAndDelete(doctorProfile.userId);
  }
  
  // Delete the profile
  await DoctorProfile.findByIdAndDelete(profileId);
  
  res.json({ message: 'Doctor deleted successfully' });
};

// @desc    Admin gets all doctors (including unverified)
// @route   GET /api/doctors/admin/all
// @access  Private (Admin)
const getAdminDoctors = async (req, res) => {
  const doctors = await DoctorProfile.find({})
    .populate('userId', 'name email profilePicture');
  res.json(doctors);
};

// @desc    Admin verifies/unverifies a doctor
// @route   PUT /api/doctors/admin/:id/verify
// @access  Private (Admin)
const verifyDoctor = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    
    if (doctor) {
      doctor.isVerified = req.body.isVerified;
      const updatedDoctor = await doctor.save();
      res.json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Doctor profile not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Verification update failed' });
  }
};

export { getDoctors, getDoctorById, getDoctorProfile, updateDoctorProfile, setDoctorSlots, addDoctorByAdmin, deleteDoctorByAdmin, getAdminDoctors, verifyDoctor };
