import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import { io } from 'socket.io-client';

const DEFAULT_FILES = {
  'main.py': { language: 'python', content: 'print("Hello, World!")' },
  'main.cpp': { language: 'cpp', content: '#include <iostream>\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }' },
  'main.java': { language: 'java', content: 'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }' },
  'main.js': { language: 'javascript', content: 'console.log("Hello, World!");' },
  'index.html': { language: 'html', content: '<!DOCTYPE html>\n<html>\n  <body>Hello, World!</body>\n</html>' },
  'style.css': { language: 'css', content: 'body { color: #333; }' },
};

const LANGUAGE_OPTIONS = [
  { label: 'Python', value: 'python' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
];

function Workspace({ roomCode }) {
  const [files, setFiles] = useState({ ...DEFAULT_FILES });
  const [selectedFile, setSelectedFile] = useState('main.py');
  const [output, setOutput] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [language, setLanguage] = useState(files[selectedFile].language);
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef(null);
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!roomCode) return;
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
      socketRef.current.emit('join-room', roomCode.toUpperCase());
    }
    const socket = socketRef.current;
    socket.on('file-changed', ({ fileName, content }) => {
      setFiles(prev => prev[fileName] ? { ...prev, [fileName]: { ...prev[fileName], content } } : prev);
    });
    socket.on('file-created', ({ fileName, file }) => {
      setFiles(prev => ({ ...prev, [fileName]: file }));
    });
    socket.on('file-deleted', ({ fileName }) => {
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fileName];
        return newFiles;
      });
    });
    return () => {
      socket.off('file-changed');
      socket.off('file-created');
      socket.off('file-deleted');
    };
  }, [roomCode]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setLanguage(files[file].language);
  };

  const handleEditorChange = (value) => {
    setFiles((prev) => ({
      ...prev,
      [selectedFile]: { ...prev[selectedFile], content: value },
    }));
    if (socketRef.current && roomCode) {
      socketRef.current.emit('file-changed', { roomCode: roomCode.toUpperCase(), fileName: selectedFile, content: value });
    }
  };

  const handleNewFile = () => {
    if (!newFileName || files[newFileName]) return;
    setFiles((prev) => ({
      ...prev,
      [newFileName]: { language: 'python', content: '' },
    }));
    setSelectedFile(newFileName);
    setLanguage('python');
    setNewFileName('');
    if (socketRef.current && roomCode) {
      socketRef.current.emit('file-created', { roomCode: roomCode.toUpperCase(), fileName: newFileName, file: { language: 'python', content: '' } });
    }
  };

  const handleDeleteFile = (file) => {
    if (Object.keys(files).length === 1) return;
    const newFiles = { ...files };
    delete newFiles[file];
    setFiles(newFiles);
    const nextFile = Object.keys(newFiles)[0];
    setSelectedFile(nextFile);
    setLanguage(newFiles[nextFile].language);
    if (socketRef.current && roomCode) {
      socketRef.current.emit('file-deleted', { roomCode: roomCode.toUpperCase(), fileName: file });
    }
  };

  const handleRenameFile = (oldName, newName) => {
    if (!newName || files[newName]) return;
    const newFiles = { ...files };
    newFiles[newName] = { ...newFiles[oldName] };
    delete newFiles[oldName];
    setFiles(newFiles);
    setSelectedFile(newName);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setFiles((prev) => ({
      ...prev,
      [selectedFile]: { ...prev[selectedFile], language: e.target.value },
    }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const res = await axios.post('/api/execute', {
        language,
        code: files[selectedFile].content
      });
      setOutput(res.data.output || res.data.stderr || '');
    } catch (err) {
      setOutput('Error running code: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  // VS Code-like file explorer icons
  const folderIcon = <span style={{ marginRight: 6, color: '#FFD700', fontSize: 18 }}>📁</span>;
  const fileIcon = <span style={{ marginRight: 6, color: '#bbb', fontSize: 16 }}>📄</span>;

  return (
    <div style={{ display: 'flex', height: '70vh', background: '#18181b', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px #0002', margin: '2rem 0' }}>
      {/* File Explorer */}
      <div style={{ width: 220, background: '#20212a', padding: '10px 0 0 0', display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #18181b', boxShadow: '2px 0 8px 0 #0001', minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px 6px 18px', fontWeight: 700, color: '#bdbdbd', fontSize: 15, borderBottom: '1px solid #23232a', marginBottom: 6, letterSpacing: 0.5 }}>
          {folderIcon} <span style={{ fontWeight: 700, fontSize: 15 }}>project</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {Object.keys(files).map((file) => (
            <div key={file} style={{ display: 'flex', alignItems: 'center', marginBottom: 2, marginLeft: 18 }}>
              <span
                onClick={() => handleFileSelect(file)}
                style={{
                  cursor: 'pointer',
                  color: file === selectedFile ? '#fff' : '#bdbdbd',
                  fontWeight: file === selectedFile ? 700 : 400,
                  background: file === selectedFile ? 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)' : 'none',
                  borderRadius: 6,
                  padding: '3px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 0,
                  boxShadow: file === selectedFile ? '0 2px 8px 0 #3A29FF22' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                  fontSize: 15,
                  marginRight: 4,
                }}
                onMouseOver={e => { if (file !== selectedFile) e.currentTarget.style.background = 'rgba(58,41,255,0.08)'; }}
                onMouseOut={e => { if (file !== selectedFile) e.currentTarget.style.background = 'none'; }}
              >
                {fileIcon} {file === renamingFile ? (
                  <input
                    value={renameValue}
                    autoFocus
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => {
                      handleRenameFile(file, renameValue);
                      setRenamingFile(null);
                      setRenameValue('');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleRenameFile(file, renameValue);
                        setRenamingFile(null);
                        setRenameValue('');
                      }
                    }}
                    style={{ width: '80%', fontSize: 14, borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', padding: '2px 6px' }}
                  />
                ) : (
                  file
                )}
              </span>
              <button onClick={() => handleDeleteFile(file)} style={{ marginLeft: 2, background: 'none', border: 'none', color: '#FF3232', cursor: 'pointer', fontWeight: 700, fontSize: 15, padding: 0 }}>×</button>
              <button onClick={() => { setRenamingFile(file); setRenameValue(file); }} style={{ marginLeft: 2, background: 'none', border: 'none', color: '#FF94B4', cursor: 'pointer', fontWeight: 700, fontSize: 15, padding: 0 }}>✎</button>
            </div>
          ))}
        </div>
        <div style={{ margin: '10px 0 0 18px', display: 'flex', alignItems: 'center' }}>
          <input
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            placeholder="New file"
            style={{ flex: 1, borderRadius: 4, border: '1px solid #333', background: '#23232a', color: '#fff', padding: '2px 6px', fontSize: 14, marginRight: 4 }}
            onKeyDown={e => { if (e.key === 'Enter') handleNewFile(); }}
          />
          <button onClick={handleNewFile} style={{ background: '#23232a', color: '#3A29FF', border: '1.5px solid #3A29FF', borderRadius: 4, padding: '2px 10px', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}>+</button>
        </div>
      </div>
      {/* Editor and Terminal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#23232a', padding: '8px 12px', borderBottom: '1px solid #222' }}>
          <select value={language} onChange={handleLanguageChange} style={{ background: '#18181b', color: '#fff', border: '1px solid #333', borderRadius: 4, marginRight: 12, fontSize: 14 }}>
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={handleRun} disabled={isRunning} style={{ background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1 }}>
            {isRunning ? 'Running…' : 'Run'}
          </button>
          <span style={{ marginLeft: 16, color: '#bbb', fontSize: 13 }}>Editing: <b>{selectedFile}</b></span>
        </div>
        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <MonacoEditor
            height="100%"
            width="100%"
            language={language}
            theme="vs-dark"
            value={files[selectedFile].content}
            onChange={handleEditorChange}
            options={{ fontSize: 15, minimap: { enabled: false } }}
          />
        </div>
        {/* Output/Terminal */}
        <div style={{ background: '#18181b', color: '#fff', padding: '10px 16px', borderTop: '1px solid #222', fontFamily: 'monospace', fontSize: 14, minHeight: 60, maxHeight: 120, overflowY: 'auto' }}>
          <div style={{ color: '#FF94B4', fontWeight: 700, marginBottom: 4 }}>Output</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
        {/* Live Preview for HTML, CSS */}
        {(language === 'html' || language === 'css') && (
          <div style={{ marginTop: 16, border: '1px solid #333', borderRadius: 8, overflow: 'hidden', height: 300 }}>
            <iframe
              title="Preview"
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              srcDoc={
                language === 'html'
                  ? files[selectedFile].content
                  : `<style>${files[selectedFile].content}</style>`
              }
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Workspace; 