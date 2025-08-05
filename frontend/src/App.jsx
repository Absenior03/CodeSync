import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';

// Connect to the backend server.
// When running locally, this will be 'http://localhost:3001'.
// When deployed, you'll change this to your deployed backend URL.
const socket = io('http://localhost:3001');

function App() {
  const [roomId, setRoomId] = useState('');
  const [code, setCode] = useState('// Welcome to CodeSync! Enter a room ID to start collaborating.');
  const [joinedRoom, setJoinedRoom] = useState(false);
  const editorRef = useRef(null);
  
  // This ref is used to prevent the local user's own changes from being overwritten by incoming socket events.
  const applyingChange = useRef(false);

  useEffect(() => {
    // Listen for code updates from the server
    socket.on('code-update', (newCode) => {
      applyingChange.current = true;
      setCode(newCode);
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      setTimeout(() => {
        applyingChange.current = false;
      }, 10);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.off('code-update');
    };
  }, []);

  const handleJoinRoom = () => {
    if (roomId.trim() !== '') {
      socket.emit('join-room', roomId);
      setJoinedRoom(true);
      setCode(`// You have joined room: ${roomId}\n// Happy coding!`);
    }
  };

  const handleCodeChange = (value) => {
    // If the change is coming from a socket event, don't emit another change event.
    if (applyingChange.current) {
      return;
    }
    setCode(value);
    socket.emit('code-change', { roomId, code: value });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyan-400">CodeSync</h1>
        {!joinedRoom ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={handleJoinRoom}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold transition-colors"
            >
              Join Room
            </button>
          </div>
        ) : (
          <div className="text-lg">
            <span className="font-semibold text-gray-400">Room:</span> <span className="text-cyan-400 font-bold">{roomId}</span>
          </div>
        )}
      </header>

      <main className="flex-grow">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: 'on',
          }}
        />
      </main>
    </div>
  );
}

export default App;