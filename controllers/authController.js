import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Login] Attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[Login] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[Login] User found, comparing passwords...`);
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      console.log(`[Login] Password matched. Generating token...`);
      generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      console.warn(`[Login] Password mismatch for: ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(`[Login Error] ${error.name}: ${error.message}`);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'patient',
    phone,
  });

  if (user) {
    // Auto-create DoctorProfile for doctors
    if (user.role === 'doctor') {
      await DoctorProfile.create({
        userId: user._id,
        specialization: 'General Physician',
        consultationFee: 500,
        experience: 0,
      });
    }
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Public (Checks auth internally to avoid 401 console logs)
const getUserProfile = async (req, res) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    return res.status(200).json(null);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
      });
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    res.status(200).json(null);
  }
};

// @desc    Get all patients
// @route   GET /api/auth/patients
// @access  Private (Admin)
const getPatients = async (req, res) => {
  const patients = await User.find({ role: 'patient' }).select('-password');

  const patientData = await Promise.all(
    patients.map(async (patient) => {
      const appointments = await Appointment.find({ patientId: patient._id });
      const totalAppts = appointments.length;
      const lastVisit = appointments.length > 0 
        ? appointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date 
        : 'N/A';

      return {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        totalAppts,
        lastVisit,
      };
    })
  );

  res.json(patientData);
};

export { authUser, registerUser, logoutUser, getUserProfile, getPatients };
