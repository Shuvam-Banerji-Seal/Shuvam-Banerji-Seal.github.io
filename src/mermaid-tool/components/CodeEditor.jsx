import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, onChange, theme }) {
    const editorRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        setIsLoading(false);
        
        // Register Mermaid language
        if (!monaco.languages.getLanguages().some(lang => lang.id === 'mermaid')) {
            monaco.languages.register({ id: 'mermaid' });
            
            monaco.languages.setMonarchTokensProvider('mermaid', {
                keywords: [
                    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
                    'stateDiagram-v2', 'erDiagram', 'gantt', 'pie', 'gitGraph', 'mindmap',
                    'timeline', 'journey', 'quadrantChart', 'requirementDiagram', 'C4Context',
                    'subgraph', 'end', 'participant', 'actor', 'title', 'section', 'loop',
                    'alt', 'else', 'opt', 'par', 'and', 'rect', 'note', 'over', 'class',
                    'click', 'style', 'linkStyle', 'classDef', 'direction', 'TB', 'TD', 'BT',
                    'RL', 'LR'
                ],
                operators: ['-->', '---', '-.->',  '==>', '-->>', '--x', 'o--o', '<-->', '--|', '|--'],
                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                tokenizer: {
                    root: [
                        [/%%.*$/, 'comment'],
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@keywords': 'keyword',
                                '@default': 'identifier'
                            }
                        }],
                        [/\[.*?\]/, 'string'],
                        [/\(.*?\)/, 'string'],
                        [/\{.*?\}/, 'string'],
                        [/".*?"/, 'string'],
                        [/'.*?'/, 'string'],
                        [/\|.*?\|/, 'string'],
                        [/-->|---|-\.->|==>|-->>|--x|o--o|<-->/, 'operator'],
                        [/:::|:::/, 'operator'],
                        [/[{}()\[\]]/, 'bracket'],
                        [/:/, 'delimiter'],
                        [/#[a-fA-F0-9]{3,8}/, 'number'],
                    ]
                }
            });

            // Define theme configurations
            monaco.editor.defineTheme('mermaid-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                    { token: 'string', foreground: 'ce9178' },
                    { token: 'identifier', foreground: '9cdcfe' },
                    { token: 'operator', foreground: 'd4d4d4' },
                    { token: 'comment', foreground: '6a9955' },
                    { token: 'bracket', foreground: 'ffd700' },
                    { token: 'delimiter', foreground: 'd4d4d4' },
                    { token: 'number', foreground: 'b5cea8' },
                ],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4',
                    'editorLineNumber.foreground': '#858585',
                    'editorLineNumber.activeForeground': '#c6c6c6',
                    'editor.lineHighlightBackground': '#2a2d2e',
                    'editorCursor.foreground': '#aeafad',
                    'editor.selectionBackground': '#264f78',
                    'editor.inactiveSelectionBackground': '#3a3d41',
                }
            });

            monaco.editor.defineTheme('mermaid-light', {
                base: 'vs',
                inherit: true,
                rules: [
                    { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
                    { token: 'string', foreground: 'a31515' },
                    { token: 'identifier', foreground: '001080' },
                    { token: 'operator', foreground: '000000' },
                    { token: 'comment', foreground: '008000' },
                    { token: 'bracket', foreground: 'af00db' },
                    { token: 'delimiter', foreground: '000000' },
                    { token: 'number', foreground: '098658' },
                ],
                colors: {
                    'editor.background': '#ffffff',
                    'editor.foreground': '#000000',
                    'editorLineNumber.foreground': '#237893',
                    'editorLineNumber.activeForeground': '#0b216f',
                    'editor.lineHighlightBackground': '#f5f5f5',
                    'editorCursor.foreground': '#000000',
                    'editor.selectionBackground': '#add6ff',
                    'editor.inactiveSelectionBackground': '#e5ebf1',
                }
            });
        }
    };

    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        fontLigatures: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        contextmenu: true,
        quickSuggestions: false,
        parameterHints: { enabled: false },
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: 'off',
        tabCompletion: 'off',
        wordBasedSuggestions: 'off',
        bracketPairColorization: { enabled: true },
        guides: {
            indentation: true,
            bracketPairs: true,
        },
    };

    return (
        <div className="code-editor">
            {isLoading && (
                <div className="editor-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading editor...</span>
                </div>
            )}
            <Editor
                height="100%"
                language="mermaid"
                value={code}
                onChange={(value) => onChange(value || '')}
                onMount={handleEditorDidMount}
                theme={theme === 'dark' ? 'mermaid-dark' : 'mermaid-light'}
                options={editorOptions}
                loading=""
            />
        </div>
    );
}

export default CodeEditor;
