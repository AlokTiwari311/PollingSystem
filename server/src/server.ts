import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleSocketConnection } from './socket/socketHandler';
import { connectDB } from './db/mongo';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Polling Server is Running');
});

import { getAllPolls } from './services/PollService';
app.get('/history', async (req, res) => {
    const polls = await getAllPolls();
    res.json(polls);
});

// Socket connection
io.on('connection', (socket) => {
    handleSocketConnection(io, socket);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
