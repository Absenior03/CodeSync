import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import EditorPage from './EditorPage';
import LandingPage from './LandingPage';

// Connect to the backend server.
// When running locally, this will be 'http://localhost:3001'.
// When deployed, you'll change this to your deployed backend URL.
const socket = io('https://codesync-backend-dniv.onrender.com');

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (id, name) => {
    if (id.trim() && name.trim()) {
      setRoomId(id);
      setUsername(name);
      setJoined(true);
      socket.emit('join-room', { roomId: id, username: name });
    }
  };

  const handleLeave = () => {
    socket.emit('leave-room');
    setJoined(false);
    setRoomId('');
    setUsername('');
  };

  return (
    <>
      {/* This component will render the toast notifications */}
      <div><Toaster position="top-right" toastOptions={{
          success: {
            style: {
              background: '#28a745',
              color: 'white',
            },
          },
          error: {
             style: {
              background: '#dc3545',
              color: 'white',
            },
          },
      }} /></div>
      <div className="h-screen bg-gray-900 text-white">
        {!joined ? (
          <LandingPage onJoin={handleJoin} />
        ) : (
          <EditorPage socket={socket} roomId={roomId} username={username} onLeave={handleLeave} />
        )}
      </div>
    </>
  );
}

export default App;