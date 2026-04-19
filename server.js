import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './utils/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';

dotenv.config();

// Pre-check for critical env variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const port = process.env.PORT || 5000;

// Connect to Database first
await connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://caresync-liart.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 VERY IMPORTANT ORDER
const corsOptions = {
  origin: "https://caresync-liart.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

app.use(cors(corsOptions));
app.options("/*splat", cors(corsOptions)); // Handle preflight for all routes with correct options

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'CareSync API is running' });
});

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to CareSync API Services');
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Attach io to req to use in controllers if needed (though we'll use it in controllers via imports usually)
app.set('socketio', io);

// Error Handling
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack) console.error(err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

server.listen(port, () => console.log(`Server started on port ${port}`));
