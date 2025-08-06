import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import EditorPage from './EditorPage';
import LandingPage from './LandingPage';

// Connect to the backend server.
// When running locally, this will be 'http://localhost:3001'.
// When deployed, you'll change this to your deployed backend URL.
const socket = io('https://codesync-backend-dniv.onrender.com');

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (id) => {
    if (id.trim()) {
      setRoomId(id);
      setJoined(true);
      socket.emit('join-room', id);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white">
      {!joined ? (
        <LandingPage onJoin={handleJoin} />
      ) : (
        <EditorPage socket={socket} roomId={roomId} />
      )}
    </div>
  );
}

export default App;