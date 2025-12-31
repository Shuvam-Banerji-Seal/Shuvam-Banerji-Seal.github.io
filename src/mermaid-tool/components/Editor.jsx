import React, { useEffect, useState, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { HelpCircle } from 'lucide-react';

// Pre-load Monaco
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

const MermaidEditor = ({ code, onChange, theme, mode }) => {
    const [editorMounted, setEditorMounted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const editorRef = useRef(null);

    // Register mermaid language support
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        setEditorMounted(true);

        if (!monaco.languages.getLanguages().some(l => l.id === 'mermaid')) {
            monaco.languages.register({ id: 'mermaid' });
            monaco.languages.setMonarchTokensProvider('mermaid', {
                tokenizer: {
                    root: [
                        [/graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|requirement/, 'keyword'],
                        [/\[.*?\]/, 'string'],
                        [/\(.*?\)/, 'string'],
                        [/\{.*?\}/, 'string'],
                        [/-->|---->/, 'operator'],
                        [/--/, 'operator'],
                        [/-\./, 'operator'],
                        [/:/, 'delimiter'],
                        [/class/, 'keyword'],
                        [/accTitle|accDescr|title/, 'comment'],
                    ]
                }
            });
        }

        // Keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
            editor.getAction('editor.action.formatDocument').run();
        });

        // Save shortcut (Ctrl+S / Cmd+S) - already persisted via onChange
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            console.log('Code saved');
        });
    };

    const handleKeyDown = (e) => {
        // Ctrl+/ or Cmd+/ for comment
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            if (editorRef.current) {
                editorRef.current.getAction('editor.action.commentLine').run();
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 h-10">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {mode === 'mermaid' ? 'Mermaid Diagram' : 'Markdown'}
                    </span>
                </div>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded text-sm transition-colors"
                    title="Keyboard shortcuts"
                >
                    <HelpCircle size={16} />
                </button>
            </div>

            {/* Help Panel */}
            {showHelp && (
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 text-xs text-gray-700 dark:text-gray-300">
                    <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-600 dark:text-gray-400">
                        <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl+K</kbd> Format</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl+/</kbd> Comment</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl+S</kbd> Save</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl+Z</kbd> Undo</div>
                    </div>
                </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden" onKeyDown={handleKeyDown}>
                <Editor
                    height="100%"
                    defaultLanguage="mermaid"
                    language={mode === 'markdown' ? 'markdown' : 'mermaid'}
                    value={code}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    onChange={(value) => onChange(value || '')}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 1.5,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                        fontFamily: "'Source Code Pro', 'Courier New', monospace",
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        formatOnPaste: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: false,
                        },
                        tabSize: 2,
                        insertSpaces: true,
                    }}
                />
            </div>
        </div>
    );
};

export default MermaidEditor;
