import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../utils/multerConfig.js';

const router = express.Router();

// @desc    Update user profile stats
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    console.log('--- Incoming Profile Update ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Auth User ID:', req.user?._id);
    
    const { _id, __v, password, ...updateData } = req.body;

    // Pre-check for duplicate email if email is being changed
    if (updateData.email && updateData.email !== req.user.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }
    
    console.log('Final Update Data to DB:', updateData);

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ error: 'User record not found in database' });
    }

    res.json(updated);
  } catch (err) {
    console.error('FULL TERMINAL ERROR:', err);
    res.status(500).json({ 
      error: err.message, 
      stack: err.stack,
      details: err.errors // Include Mongoose validation details if they exist
    });
  }
});

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile
// @access  Private
router.post('/upload-profile', protect, upload.single('profilePicture'), async (req, res) => {
  if (req.file) {
    const user = await User.findById(req.user._id);
    user.profilePicture = req.file.path;
    await user.save();
    res.json({ filePath: req.file.path });
  } else {
    res.status(400).json({ message: 'No file uploaded' });
  }
});

export default router;
