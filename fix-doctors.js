import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import DoctorProfile from './models/DoctorProfile.js';

dotenv.config();

const fixDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const doctors = await User.find({ role: 'doctor' });
    console.log(`Found ${doctors.length} doctors. Checking for missing profiles...`);

    let fixedCount = 0;
    for (const doc of doctors) {
      const profile = await DoctorProfile.findOne({ userId: doc._id });
      if (!profile) {
        await DoctorProfile.create({
          userId: doc._id,
          specialization: 'General Physician',
          consultationFee: 500,
          experience: 5
        });
        fixedCount++;
        console.log(`Created missing profile for doctor: ${doc.name}`);
      }
    }

    console.log(`Finished! Created ${fixedCount} missing profiles.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixDoctors();
