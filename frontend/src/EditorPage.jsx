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
    // Event listeners... (same as before)
    return () => { /* cleanup */ };
  }, [socket]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setError('');
    setOutput('');
    try {
        // Use the same URL as your socket connection, but as an HTTP URL
        const backendApiUrl = socket.io.uri.replace(/^wss?:\/\//, 'https://');
        const res = await axios.post(`${backendApiUrl}/api/execute`, {
            language,
            code,
        });
        if (res.data.error) {
            setError(res.data.error);
        } else {
            setOutput(res.data.output);
        }
    } catch (err) {
        setError('An error occurred while running the code.');
        console.error(err);
    }
    setIsLoading(false);
  };

  // All other handlers (handleCodeChange, handleLanguageChange, handleEditorDidMount) remain the same

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 p-4 flex flex-col">
        {/* Sidebar content... (same as before) */}
        <div className="mt-auto">
            <button onClick={onLeave} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">
                <LogOut size={18} /> Leave Room
            </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        <div className="bg-gray-800 p-2 flex justify-end">
            <button onClick={handleRunCode} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors disabled:bg-gray-500">
                <Play size={18} /> Run Code
            </button>
        </div>
        <PanelGroup direction="vertical" className="flex-grow">
            <Panel defaultSize={70} minSize={20}>
                <Editor /* ...props */ />
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