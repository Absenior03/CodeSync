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

const USED_ROOM_IDS_KEY = 'codesync:used-room-ids';

const isValidRoomId = (roomId) => /^\d{6}$/.test(roomId);

const roomExists = async (roomId) => {
  const roomDataJSON = await redis.get(roomId);
  return Boolean(roomDataJSON);
};

const reserveUniqueRoomId = async (preferredRoomId = '') => {
  const cleanPreferredRoomId = preferredRoomId.trim();

  if (cleanPreferredRoomId) {
    if (!isValidRoomId(cleanPreferredRoomId)) {
      throw new Error('Room ID must be exactly 6 digits.');
    }

    const [alreadyUsed, alreadyExists] = await Promise.all([
      redis.sismember(USED_ROOM_IDS_KEY, cleanPreferredRoomId),
      roomExists(cleanPreferredRoomId),
    ]);

    if (alreadyUsed || alreadyExists) {
      throw new Error('That room ID is already in use. Choose another 6-digit ID.');
    }

    await redis.sadd(USED_ROOM_IDS_KEY, cleanPreferredRoomId);
    return cleanPreferredRoomId;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const generatedRoomId = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

    const [alreadyUsed, alreadyExists] = await Promise.all([
      redis.sismember(USED_ROOM_IDS_KEY, generatedRoomId),
      roomExists(generatedRoomId),
    ]);

    if (!alreadyUsed && !alreadyExists) {
      await redis.sadd(USED_ROOM_IDS_KEY, generatedRoomId);
      return generatedRoomId;
    }
  }

  throw new Error('Unable to generate a unique room ID. Please try again.');
};

// --- API Endpoint for Code Execution ---
app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;

    // Map our language names to JDoodle's version names
    const languageVersionMap = {
      javascript: { language: 'nodejs', versionIndex: '4' }, // Use a recent LTS version
      python:     { language: 'python3', versionIndex: '4' }, // Use a recent version
      java:       { language: 'java', versionIndex: '4' },    // Use a recent version
      csharp:     { language: 'csharp', versionIndex: '4' },  // .NET 7
      html:       null, // Cannot be executed
      css:        null, // Cannot be executed
    };

    const langDetails = languageVersionMap[language];

    if (!langDetails) {
      return res.status(400).json({ error: `Execution for ${language} is not supported.` });
    }

    try {
    const response = await axios({
        method: 'post',
        url: 'https://api.jdoodle.com/v1/execute',
        data: {
            script: code,
            language: langDetails.language,
            versionIndex: langDetails.versionIndex,
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        },
        headers: {
            'Content-Type': 'application/json',
        },
      });
      res.json(response.data);
    } catch (error) {
    // Send a more detailed error back to the frontend
    const errorMessage = error.response ? JSON.stringify(error.response.data) : 'Failed to connect to execution service.';
    res.status(500).json({ error: errorMessage });
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

  socket.on('join-room', async ({ roomId, username }, callback) => {
    try {
      const cleanUsername = typeof username === 'string' ? username.trim() : '';
      if (!cleanUsername) {
        const errorMessage = 'Username is required.';
        if (callback) callback({ success: false, error: errorMessage });
        return;
      }

      if (!isValidRoomId(roomId)) {
        const errorMessage = 'Room ID must be exactly 6 digits.';
        if (callback) callback({ success: false, error: errorMessage });
        return;
      }

      const roomDataJSON = await redis.get(roomId);
      if (!roomDataJSON) {
        const errorMessage = 'Room not found. Please check the 6-digit room ID.';
        if (callback) callback({ success: false, error: errorMessage });
        return;
      }

    socket.join(roomId);
    socketToRoom[socket.id] = roomId;
    console.log(`User ${cleanUsername} (${socket.id}) joined room ${roomId}`);

        let roomData = roomDataJSON ? JSON.parse(roomDataJSON) : {};

      const newParticipant = { id: socket.id, name: cleanUsername };
        roomData.participants = [...(roomData.participants || []).filter(p => p.id !== socket.id), newParticipant];

        if (!roomData.code) {
            roomData.code = `// Welcome to CodeSync, ${cleanUsername}!\n// Room: ${roomId}\n`;
            roomData.language = 'javascript';
        }

        await redis.set(roomId, JSON.stringify(roomData));
        socket.emit('room-state', roomData);
        socket.to(roomId).emit('participants-update', roomData.participants);

        if (callback) callback({ success: true, roomId, roomData });
    } catch (error) {
      console.error("Error during join-room:", error);
      if (callback) callback({ success: false, error: error.message || 'Failed to join room.' });
    }
  });

  socket.on('create-room', async ({ roomId, username }, callback) => {
    try {
      const cleanUsername = typeof username === 'string' ? username.trim() : '';
      if (!cleanUsername) {
        const errorMessage = 'Username is required.';
        if (callback) callback({ success: false, error: errorMessage });
        return;
      }

        const reservedRoomId = await reserveUniqueRoomId(roomId);

        socket.join(reservedRoomId);
        socketToRoom[socket.id] = reservedRoomId;
      console.log(`User ${cleanUsername} (${socket.id}) created room ${reservedRoomId}`);

        const roomData = {
        participants: [{ id: socket.id, name: cleanUsername }],
        code: `// Welcome to CodeSync, ${cleanUsername}!\n// Room: ${reservedRoomId}\n`,
            language: 'javascript',
        };

        await redis.set(reservedRoomId, JSON.stringify(roomData));
        socket.emit('room-state', roomData);

        if (callback) callback({ success: true, roomId: reservedRoomId, roomData });
    } catch (error) {
        console.error('Error during create-room:', error);
        if (callback) callback({ success: false, error: error.message || 'Failed to create room.' });
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