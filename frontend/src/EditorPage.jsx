import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Users, Code } from 'lucide-react';

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'markdown', label: 'Markdown' },
];

const EditorPage = ({ socket, roomId }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
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
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      setTimeout(() => { applyingChange.current = false; }, 100);
    });

    socket.on('language-update', (newLanguage) => setLanguage(newLanguage));
    socket.on('participants-update', (newParticipants) => setParticipants(newParticipants));

    socket.on('cursor-update', ({ userId, position }) => {
      if (userId !== socket.id && editorRef.current) {
        const decorations = [{
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          options: {
            className: 'remote-cursor',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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

  const handleCodeChange = (value) => {
    if (applyingChange.current) return;
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
      {/* Sidebar */}
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
              <li key={p.id} className={`p-2 rounded-md ${p.id === socket.id ? 'bg-cyan-900' : 'bg-gray-700'}`}>
                {p.name} {p.id === socket.id && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-gray-500">
            Room ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-grow">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleCodeChange}
          options={{ fontSize: 16, wordWrap: 'on' }}
        />
      </main>
    </div>
  );
};

export default EditorPage;