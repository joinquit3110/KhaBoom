import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * CodeEditor - Interactive code editor component for programming exercises
 * Allows users to write and run code examples from the textbooks
 */
const CodeEditor = ({ params, courseId }) => {
  const [code, setCode] = useState(params.defaultCode || '// Write your code here');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(14);
  const [language, setLanguage] = useState(params.language || 'javascript');
  
  // Set up editor with default code
  useEffect(() => {
    if (params.defaultCode) {
      setCode(params.defaultCode);
    }
    
    if (params.language) {
      setLanguage(params.language);
    }
  }, [params]);
  
  // Handle running the code
  const runCode = () => {
    setRunning(true);
    setError(null);
    setOutput('');
    
    try {
      // For JavaScript, we can use a safe evaluation approach
      if (language === 'javascript') {
        // Create a safe console.log that captures output
        const outputs = [];
        const safeLog = (...args) => {
          outputs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };
        
        // Create a safe environment for running the code
        const safeEval = new Function('console', `
          try {
            ${code}
            return { success: true, output: '' };
          } catch (e) {
            return { success: false, error: e.message };
          }
        `);
        
        // Run the code with our safe console
        const console = { log: safeLog, warn: safeLog, error: safeLog };
        const result = safeEval(console);
        
        if (result.success) {
          setOutput(outputs.join('\\n'));
        } else {
          setError(result.error);
        }
      } else {
        // For other languages, show a message that we can't run them directly
        setOutput(`Code execution for ${language} is not supported in this browser-based environment.`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };
  
  // Handle code changes
  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };
  
  // Increase font size
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };
  
  // Decrease font size
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };
  
  return (
    <div className="code-editor-container">
      <div className="editor-toolbar">
        <div className="language-indicator">{language}</div>
        <div className="font-size-controls">
          <button onClick={decreaseFontSize} disabled={fontSize <= 10}>A-</button>
          <span>{fontSize}px</span>
          <button onClick={increaseFontSize} disabled={fontSize >= 24}>A+</button>
        </div>
        <motion.button 
          className="run-button"
          onClick={runCode}
          disabled={running}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {running ? 'Running...' : 'Run Code'}
        </motion.button>
      </div>
      
      <div className="editor-container">
        <textarea
          className="code-input"
          value={code}
          onChange={handleCodeChange}
          style={{ fontSize: `${fontSize}px` }}
          spellCheck="false"
        />
      </div>
      
      <div className="output-container">
        <div className="output-header">Output</div>
        <div className="output-content">
          {error ? (
            <div className="error-output">Error: {error}</div>
          ) : output ? (
            <pre>{output}</pre>
          ) : (
            <div className="placeholder-output">Code output will appear here</div>
          )}
        </div>
      </div>
      
      {params.description && (
        <div className="editor-description">
          <p>{params.description}</p>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
