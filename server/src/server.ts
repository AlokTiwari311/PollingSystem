import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleSocketConnection } from './socket/socketHandler';
import { connectDB } from './db/mongo';

// Config load kar lo .env file se
dotenv.config();

// Database connect karo sabse pehle
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io ka setup, CORS allow karna padega warna client connect nahi kar payega
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Development ke liye sab allow hai abhi
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
    res.send('Polling Server is Running. Sab changa si!');
});

// History endpoint - Purane polls dekhne ke liye
import { getAllPolls } from './services/PollService';
app.get('/history', async (req, res) => {
    const polls = await getAllPolls();
    res.json(polls);
});

// Socket connection aane pe handler ko pakda do
io.on('connection', (socket) => {
    handleSocketConnection(io, socket);
});

// Server start kar do port 3000 pe
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server bhag raha hai port ${PORT} pe 🚀`);
});
