// src/LandingPage.jsx
import React, { useState } from 'react';
import { Code, Users, LogIn, PlusSquare } from 'lucide-react';
import DynamicBackground from './DynamicBackground'; // Import the new component

const LandingPage = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const handleJoinClick = () => {
    if (username.trim()) {
        onJoin(roomId, username);
    } else {
        alert('Please enter a username.');
    }
  };

  const handleCreateRoom = () => {
    if (username.trim()) {
        const newRoomId = Math.random().toString(36).substring(2, 8);
        onJoin(newRoomId, username);
    } else {
        alert('Please enter a username.');
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden">
      <DynamicBackground />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-cyan-400 mb-4 flex items-center gap-4 animate-fade-in-down">
            <Code size={60} /> CodeSync
          </h1>
          <p className="text-xl text-gray-400 mb-8 animate-fade-in-up">
            Collaborate in real-time. Code together, seamlessly.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20">
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">Join or Create a Session</h2>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
            />
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID (optional)"
              className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
            />
            <button
              onClick={handleJoinClick}
              className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/50"
            >
              <LogIn size={20} /> Join with ID
            </button>
            <button
              onClick={handleCreateRoom}
              className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-white/20 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <PlusSquare size={20} /> Create a New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;