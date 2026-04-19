import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const cleanData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const targets = [
      { date: '2026-04-10', timeSlot: '11:00', reason: 'Child fever' },
      { date: '2026-04-09', timeSlot: '09:00', reason: 'Regular heart checkup' }
    ];

    for (const target of targets) {
      const appt = await Appointment.findOne(target);
      if (appt) {
        console.log(`Found appointment: ${appt._id} for ${appt.date} at ${appt.timeSlot}`);
        
        // Also unbook the slot in doctor profile
        const doctor = await DoctorProfile.findOne({ userId: appt.doctorId });
        if (doctor) {
          const slotIndex = doctor.availableSlots.findIndex(s => s.date === appt.date && s.startTime === appt.timeSlot);
          if (slotIndex !== -1) {
            doctor.availableSlots[slotIndex].isBooked = false;
            await doctor.save();
            console.log(`Unbooked slot for Dr. ${appt.doctorId}`);
          }
        }

        await Appointment.findByIdAndDelete(appt._id);
        console.log(`Deleted appointment: ${appt._id}`);
      } else {
        console.log(`No match found for: ${target.date} ${target.timeSlot} "${target.reason}"`);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from DB');
  } catch (err) {
    console.error(err);
  }
};

cleanData();
