// EditorPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Users, Code, Play, LogOut } from 'lucide-react';
import axios from 'axios';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const OutputPanel = ({ output, error, isLoading }) => (
    <div className="bg-gray-900 h-full p-4 font-mono text-sm overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-2">Output</h3>
        {isLoading && <p className="text-yellow-400">Running code...</p>}
        {error && <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>}
        {output && <pre className="text-gray-200 whitespace-pre-wrap">{output}</pre>}
    </div>
);

const EditorPage = ({ socket, roomId, username, onLeave }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const editorRef = useRef(null);
  const applyingChange = useRef(false);
  const remoteCursorDecorations = useRef([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room-state', (data) => {
      applyingChange.current = true;
      setCode(data.code);
      setLanguage(data.language);
      setParticipants(data.participants);
      if (editorRef.current) {
        editorRef.current.setValue(data.code);
      }
      setTimeout(() => { applyingChange.current = false; }, 100);
    });

    socket.on('code-update', (newCode) => {
      applyingChange.current = true;
      // Also update the local state when receiving changes
      setCode(newCode);
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      setTimeout(() => { applyingChange.current = false; }, 100);
    });

    socket.on('language-update', (newLanguage) => setLanguage(newLanguage));
    socket.on('participants-update', (newParticipants) => setParticipants(newParticipants));

    socket.on('cursor-update', ({ userId, position }) => {
      if (userId !== socket.id && editorRef.current && window.monaco) {
        const decorations = [{
          range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          options: {
            className: 'remote-cursor',
            stickiness: window.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        }];
        remoteCursorDecorations.current = editorRef.current.deltaDecorations(remoteCursorDecorations.current, decorations);
      }
    });

    return () => {
      socket.off('room-state');
      socket.off('code-update');
      socket.off('language-update');
      socket.off('participants-update');
      socket.off('cursor-update');
    };
  }, [socket]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setError('');
    setOutput('');
    try {
        const backendApiUrl = socket.io.uri.replace(/^wss?:\/\//, 'https://');
        const res = await axios.post(`${backendApiUrl}/api/execute`, {
            language,
            code, // This will now send the correct, updated code
        });

        if (res.data.error) {
            setError(res.data.error);
        } else {
            setOutput(res.data.output);
        }
    } catch (err) {
        const errorMessage = err.response ? JSON.stringify(err.response.data) : 'An error occurred while running the code.';
        setError(errorMessage);
        console.error(err);
    }
    setIsLoading(false);
  };

  // *** THIS IS THE CORRECTED FUNCTION ***
  const handleCodeChange = (value) => {
    if (applyingChange.current) return;
    // 1. Update the local React state so "Run Code" has the latest version
    setCode(value);
    // 2. Emit the change to other users in the room
    socket.emit('code-change', { roomId, code: value });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit('language-change', { roomId, language: newLanguage });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      socket.emit('cursor-change', { roomId, position: e.position });
    });
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
            <Code className="text-cyan-400" />
            <h1 className="text-2xl font-bold text-cyan-400">CodeSync</h1>
        </div>
        <div className="mb-4">
            <label className="text-sm text-gray-400">Language</label>
            <select value={language} onChange={handleLanguageChange} className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
        </div>
        <div className="flex-grow">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-300">
            <Users size={20} /> Participants ({participants.length})
          </h2>
          <ul className="space-y-2">
            {participants.map(p => (
              <li key={p.id} className={`p-2 rounded-md truncate ${p.id === socket.id ? 'bg-cyan-900' : 'bg-gray-700'}`}>
                {p.name} {p.id === socket.id && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-gray-500 mb-4">
            Room ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span>
        </div>
        <div className="mt-auto">
            <button onClick={onLeave} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">
                <LogOut size={18} /> Leave Room
            </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        <div className="bg-gray-800 p-2 flex justify-end border-b border-gray-700">
            <button onClick={handleRunCode} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                <Play size={18} /> Run Code
            </button>
        </div>
        <PanelGroup direction="vertical" className="flex-grow">
            <Panel defaultSize={70} minSize={20}>
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code} // Ensure editor value is controlled by state
                  onMount={handleEditorDidMount}
                  onChange={handleCodeChange}
                  options={{ fontSize: 16, wordWrap: 'on' }}
                />
            </Panel>
            <PanelResizeHandle className="h-2 bg-gray-700 hover:bg-cyan-500 transition-colors" />
            <Panel defaultSize={30} minSize={10}>
                <OutputPanel output={output} error={error} isLoading={isLoading} />
            </Panel>
        </PanelGroup>
      </main>
    </div>
  );
};

export default EditorPage;