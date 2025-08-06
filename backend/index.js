const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const Redis = require('ioredis');

require('dotenv').config();
const redis = new Redis(process.env.REDIS_URL);

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory mapping to track which room a socket is in.
// This is crucial for handling disconnects properly.
const socketToRoom = {};

async function getRoomParticipants(roomId) {
    const roomDataJSON = await redis.get(roomId);
    if (roomDataJSON) {
        return JSON.parse(roomDataJSON).participants || [];
    }
    return [];
}

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('join-room', async (roomId) => {
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;
    console.log(`User ${socket.id} joined room ${roomId}`);

    try {
        const roomDataJSON = await redis.get(roomId);
        let roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};

        // Add new participant
        const newParticipant = { id: socket.id, name: `User-${socket.id.slice(0, 5)}` };
        roomData.participants = [...(roomData.participants || []), newParticipant];

        // If room is new, set default code and language
        if (!roomData.code) {
            roomData.code = `// Welcome to CodeSync Room: ${roomId}\n// Happy collaborating!`;
            roomData.language = 'javascript';
        }

        await redis.set(roomId, JSON.stringify(roomData));

        // Send the complete room state to the newly joined user
        socket.emit('room-state', roomData);
        
        // Notify everyone else in the room about the new participant
        socket.to(roomId).emit('participants-update', roomData.participants);

    } catch (error) {
      console.error("Error during join-room:", error);
    }
  });

  socket.on('code-change', async (data) => {
    const { roomId, code } = data;
    try {
      const roomDataJSON = await redis.get(roomId);
      const roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};
      roomData.code = code;
      await redis.set(roomId, JSON.stringify(roomData));
      socket.to(roomId).emit('code-update', code);
    } catch (error) {
      console.error("Error saving code to Redis:", error);
    }
  });

  socket.on('language-change', async (data) => {
    const { roomId, language } = data;
    try {
        const roomDataJSON = await redis.get(roomId);
        const roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};
        roomData.language = language;
        await redis.set(roomId, JSON.stringify(roomData));
        // Broadcast to everyone including sender to ensure consistency
        io.in(roomId).emit('language-update', language);
    } catch (error) {
        console.error("Error saving language to Redis:", error);
    }
  });

  // New event for cursor position changes
  socket.on('cursor-change', (data) => {
    const { roomId, position } = data;
    // Broadcast cursor position to other users in the room
    socket.to(roomId).emit('cursor-update', { userId: socket.id, position });
  });

  socket.on('disconnect', async () => {
    console.log(`A user disconnected: ${socket.id}`);
    const roomId = socketToRoom[socket.id];
    if (roomId) {
        try {
            const roomDataJSON = await redis.get(roomId);
            if (roomDataJSON) {
                let roomData = JSON.parse(roomDataJSON);
                // Remove the disconnected participant
                roomData.participants = roomData.participants.filter(p => p.id !== socket.id);
                
                if (roomData.participants.length > 0) {
                    await redis.set(roomId, JSON.stringify(roomData));
                    // Notify remaining users
                    io.in(roomId).emit('participants-update', roomData.participants);
                } else {
                    // If no one is left, delete the room from Redis to save space
                    await redis.del(roomId);
                    console.log(`Room ${roomId} is empty and has been deleted.`);
                }
            }
        } catch (error) {
            console.error("Error during disconnect:", error);
        }
        delete socketToRoom[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`CodeSync server listening on port ${PORT}`);
});