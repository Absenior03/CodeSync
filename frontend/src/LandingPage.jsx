import React, { useState } from 'react';
import { Code, Users, LogIn } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center h-full bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-cyan-400 mb-4 flex items-center gap-4">
          <Code size={60} /> CodeSync
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Collaborate in real-time. Code together, seamlessly.
        </p>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Join or Create a Session</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
          />
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID (optional)"
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
          />
          <button
            onClick={handleJoinClick}
            className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Join with ID
          </button>
           <button
            onClick={handleCreateRoom}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-bold text-lg transition-colors"
          >
            Create a New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;