import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import healthRecordRoutes from './routes/healthRecordRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import symptomCheckerRoutes from './routes/symptomCheckerRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
	cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

// DB
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', healthRecordRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/symptom-checker', symptomCheckerRoutes);
app.use('/api/users', userRoutes);

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// WebRTC signaling (very basic for MVP)
io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('signal', ({ roomId, data }) => {
        socket.to(roomId).emit('signal', { from: socket.id, data });
    });

    socket.on('disconnect', () => {
        // No-op for MVP
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));


