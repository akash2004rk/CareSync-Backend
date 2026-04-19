import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Appointment from '../models/Appointment.js';
import connectDB from '../utils/db.js';

dotenv.config();

connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await DoctorProfile.deleteMany();
    await Appointment.deleteMany();

    // 1. Create Admin
    await User.create({
      name: 'HMS Admin',
      email: 'admin@hospital.com',
      password: 'Admin@123',
      role: 'admin',
    });

    // 2. Create Doctors
    const d1 = await User.create({
      name: 'Dr. John Doe',
      email: 'john@doctor.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '1234567890',
    });

    const d2 = await User.create({
      name: 'Dr. Jane Smith',
      email: 'jane@doctor.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '1234567891',
    });

    const d3 = await User.create({
      name: 'Dr. Robert Brown',
      email: 'robert@doctor.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '1234567892',
    });

    // 3. Create Doctor Profiles
    await DoctorProfile.create([
      {
        userId: d1._id,
        specialization: 'Cardiologist',
        consultationFee: 1000,
        experience: 15,
        rating: 4.8,
        availableSlots: [
          { date: '2026-04-10', startTime: '09:00', endTime: '10:00' },
          { date: '2026-04-10', startTime: '10:00', endTime: '11:00' },
        ],
      },
      {
        userId: d2._id,
        specialization: 'Pediatrician',
        consultationFee: 700,
        experience: 10,
        rating: 4.9,
        availableSlots: [
          { date: '2026-04-10', startTime: '11:00', endTime: '12:00' },
        ],
      },
      {
        userId: d3._id,
        specialization: 'Neurologist',
        consultationFee: 1200,
        experience: 20,
        rating: 4.7,
        availableSlots: [],
      },
    ]);

    // 4. Create Patients
    const p1 = await User.create({
      name: 'Alice Patient',
      email: 'alice@patient.com',
      password: 'Patient@123',
      role: 'patient',
    });

    const p2 = await User.create({
      name: 'Bob Patient',
      email: 'bob@patient.com',
      password: 'Patient@123',
      role: 'patient',
    });

    // 5. Create Appointments
    await Appointment.create([
      {
        patientId: p1._id,
        doctorId: d1._id,
        date: '2026-04-09',
        timeSlot: '09:00',
        status: 'completed',
        reason: 'Regular heart checkup',
        diagnosisNotes: 'Patient doing well, exercise more.',
      },
      {
        patientId: p2._id,
        doctorId: d2._id,
        date: '2026-04-10',
        timeSlot: '11:00',
        status: 'pending',
        reason: 'Child fever',
      },
    ]);

    console.log('Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
