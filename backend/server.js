import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import socketHandler from './socket/socketHandler.js';

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows any frontend (Vercel/Localhost) to connect to sockets seamlessly
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket handler
socketHandler(io);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
