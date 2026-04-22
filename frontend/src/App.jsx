import React, { useState, useEffect, useRef } from 'react';
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
  const [landingError, setLandingError] = useState('');

  const handleJoin = (id, name, options = { mode: 'join' }) => {
    const roomIdValue = id.trim();
    const usernameValue = name.trim();

    if (!usernameValue) {
      setLandingError('Username is required.');
      return;
    }

    if (options.mode === 'create') {
      if (roomIdValue && !/^\d{6}$/.test(roomIdValue)) {
        setLandingError('Custom room ID must be exactly 6 digits.');
        return;
      }

      const optimisticRoomId = roomIdValue || String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      setLandingError('');
      setRoomId(optimisticRoomId);
      setUsername(usernameValue);
      setJoined(true);

      socket.emit('create-room', { roomId: roomIdValue, username: usernameValue }, (response) => {
        if (!response?.success) {
          setJoined(false);
          setRoomId('');
          setUsername('');
          setLandingError(response?.error || 'Failed to create room.');
          return;
        }

        setRoomId(response.roomId);
        setUsername(usernameValue);
        setJoined(true);
      });
      return;
    }

    if (!/^\d{6}$/.test(roomIdValue)) {
      setLandingError('Room ID must be exactly 6 digits.');
      return;
    }

    setLandingError('');
    setRoomId(roomIdValue);
    setUsername(usernameValue);
    setJoined(true);

    socket.emit('join-room', { roomId: roomIdValue, username: usernameValue }, (response) => {
      if (!response?.success) {
        setJoined(false);
        setRoomId('');
        setUsername('');
        setLandingError(response?.error || 'Failed to join room.');
        return;
      }

      setRoomId(roomIdValue);
      setUsername(usernameValue);
      setJoined(true);
    });
  };

  const handleLeave = () => {
    socket.emit('leave-room');
    setJoined(false);
    setRoomId('');
    setUsername('');
  };

  return (
    <>
      <div className="h-screen bg-gray-900 text-white">
        {!joined ? (
          <LandingPage onJoin={handleJoin} serverError={landingError} />
        ) : (
          <EditorPage socket={socket} roomId={roomId} username={username} onLeave={handleLeave} />
        )}
      </div>
    </>
  );
}

export default App;