// index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const Redis = require('ioredis');
const axios = require('axios');

require('dotenv').config();
const redis = new Redis(process.env.REDIS_URL);

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies for API routes

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- API Endpoint for Code Execution ---
app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;

    // Map our language names to JDoodle's version names
    const languageVersionMap = {
        javascript: 'nodejs',
        python: 'python3',
        java: 'java',
        csharp: 'csharp',
        // Add other languages as needed
    };

    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.jdoodle.com/v1/execute',
            data: {
                script: code,
                language: languageVersionMap[language] || language,
                versionIndex: '0', // Latest version
                clientId: process.env.JDOODLE_CLIENT_ID,
                clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error executing code:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to execute code.' });
    }
});


// --- Socket.IO Logic ---
const socketToRoom = {};

async function handleUserLeave(socketId) {
    const roomId = socketToRoom[socketId];
    if (roomId) {
        try {
            const roomDataJSON = await redis.get(roomId);
            if (roomDataJSON) {
                let roomData = JSON.parse(roomDataJSON);
                roomData.participants = roomData.participants.filter(p => p.id !== socketId);
                
                if (roomData.participants.length > 0) {
                    await redis.set(roomId, JSON.stringify(roomData));
                    io.in(roomId).emit('participants-update', roomData.participants);
                } else {
                    await redis.del(roomId);
                    console.log(`Room ${roomId} is empty and has been deleted.`);
                }
            }
        } catch (error) {
            console.error("Error during leave/disconnect:", error);
        }
        delete socketToRoom[socketId];
    }
}


io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('join-room', async ({ roomId, username }) => {
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;
    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

    try {
        const roomDataJSON = await redis.get(roomId);
        let roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};

        const newParticipant = { id: socket.id, name: username };
        roomData.participants = [...(roomData.participants || []).filter(p => p.id !== socket.id), newParticipant];

        if (!roomData.code) {
            roomData.code = `// Welcome to CodeSync, ${username}!\n// Room: ${roomId}\n`;
            roomData.language = 'javascript';
        }

        await redis.set(roomId, JSON.stringify(roomData));
        socket.emit('room-state', roomData);
        socket.to(roomId).emit('participants-update', roomData.participants);
    } catch (error) {
      console.error("Error during join-room:", error);
    }
  });

  socket.on('code-change', async ({ roomId, code }) => {
    const roomDataJSON = await redis.get(roomId);
    if (roomDataJSON) {
        let roomData = JSON.parse(roomDataJSON);
        roomData.code = code;
        await redis.set(roomId, JSON.stringify(roomData));
        socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('language-change', async ({ roomId, language }) => {
    const roomDataJSON = await redis.get(roomId);
    if (roomDataJSON) {
        let roomData = JSON.parse(roomDataJSON);
        roomData.language = language;
        await redis.set(roomId, JSON.stringify(roomData));
        io.in(roomId).emit('language-update', language);
    }
  });

  socket.on('cursor-change', ({ roomId, position }) => {
    socket.to(roomId).emit('cursor-update', { userId: socket.id, position });
  });

  socket.on('leave-room', () => {
    handleUserLeave(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
    handleUserLeave(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`CodeSync server listening on port ${PORT}`);
});