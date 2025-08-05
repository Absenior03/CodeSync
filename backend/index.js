const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const Redis = require('ioredis');

// --- Redis Client Initialization ---
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

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Event for a user joining a room
  socket.on('join-room', async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    try {
      const roomDataJSON = await redis.get(roomId);
      let roomData;

      if (roomDataJSON) {
        roomData = JSON.parse(roomDataJSON);
      } else {
        // If the room doesn't exist, create it with default values
        roomData = {
          code: `// Welcome to CodeSync Room: ${roomId}\n// Language: JavaScript\n// Start coding!`,
          language: 'javascript'
        };
        await redis.set(roomId, JSON.stringify(roomData));
      }
      // Send the entire room state to the user who just joined
      socket.emit('room-state', roomData);
    } catch (error) {
      console.error("Error fetching or creating room in Redis:", error);
    }
  });

  // Event for code changes from a client
  socket.on('code-change', async (data) => {
    const { roomId, code } = data;
    try {
      const roomDataJSON = await redis.get(roomId);
      const roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};
      roomData.code = code; // Update only the code
      await redis.set(roomId, JSON.stringify(roomData));
      socket.to(roomId).emit('code-update', code);
    } catch (error) {
      console.error("Error saving code to Redis:", error);
    }
  });

  // Event for language changes from a client
  socket.on('language-change', async (data) => {
    const { roomId, language } = data;
    try {
        const roomDataJSON = await redis.get(roomId);
        const roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};
        roomData.language = language; // Update only the language
        await redis.set(roomId, JSON.stringify(roomData));
        socket.to(roomId).emit('language-update', language);
    } catch (error) {
        console.error("Error saving language to Redis:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`CodeSync server listening on port ${PORT}`);
});