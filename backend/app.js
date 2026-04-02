import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import exportRoutes from './routes/export.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);
app.use('/api', uploadRoutes); // contains /upload and /download

app.get("/", (req, res) => {
  res.send("BeatChat Backend is running...");
});

// Error Handler
app.use(errorHandler);

export default app;
