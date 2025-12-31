import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import StatusBar from './components/StatusBar';
import VisualBuilder from './components/VisualBuilder';

const DEFAULT_CODE = `flowchart TD
    A[🎉 Welcome to SBS's Mermaid!] -->|Get Started| B(Choose a template)
    B --> C{What do you need?}
    C -->|Flowcharts| D[📊 Visual processes]
    C -->|Sequences| E[🔄 Interactions]
    C -->|Diagrams| F[📐 Structures]
    
    subgraph Features
        D --> G[✨ Live Preview]
        E --> G
        F --> G
        G --> H[📥 Export to PNG/SVG]
    end
    
    style A fill:#0e639c,stroke:#0e639c,color:#fff
    style G fill:#388a34,stroke:#388a34,color:#fff
    style H fill:#7b1fa2,stroke:#7b1fa2,color:#fff`;

const EXAMPLE_DIAGRAMS = {
    flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Deploy]
    E --> F[End]
    
    style A fill:#0e639c,stroke:#0e639c,color:#fff
    style C fill:#388a34,stroke:#388a34,color:#fff
    style F fill:#7b1fa2,stroke:#7b1fa2,color:#fff`,
    
    sequence: `sequenceDiagram
    participant Alice
    participant Bob
    participant John
    
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
    
    class: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`,
    
    state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
    
    er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER {
        int orderNumber
        string deliveryAddress
    }`,
    
    gantt: `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2024-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2024-01-12, 12d
        another task    :24d`,
    
    pie: `pie showData
    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05
    "Magnesium" : 10.01
    "Iron" :  5`,
    
    git: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`,
    
    mindmap: `mindmap
    root((SBS's Mermaid))
        Features
            Code Editor
                Syntax Highlighting
                Auto-complete
            Visual Builder
                Drag and Drop
                Color Picker
            Export Options
                PNG
                SVG
                Code
        Themes
            Dark Mode
            Light Mode
            Diagram Themes
        Templates
            Flowcharts
            Sequences
            Class Diagrams
            State Diagrams`
};

function App() {
    const [code, setCode] = useState(() => {
        const saved = localStorage.getItem('sbs-mermaid-code');
        return saved || DEFAULT_CODE;
    });
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('sbs-mermaid-theme');
        return saved || 'dark';
    });
    const [diagramTheme, setDiagramTheme] = useState(() => {
        const saved = localStorage.getItem('sbs-mermaid-diagram-theme');
        return saved || 'default';
    });
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('sbs-mermaid-mode');
        return saved || 'code';
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [splitRatio, setSplitRatio] = useState(50);
    const [activeTab, setActiveTab] = useState('editor'); // For mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [error, setError] = useState(null);
    const [diagramType, setDiagramType] = useState('flowchart');
    const [notification, setNotification] = useState(null);
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    // Handle responsive
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Persist state
    useEffect(() => {
        localStorage.setItem('sbs-mermaid-code', code);
    }, [code]);

    useEffect(() => {
        localStorage.setItem('sbs-mermaid-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('sbs-mermaid-diagram-theme', diagramTheme);
    }, [diagramTheme]);

    useEffect(() => {
        localStorage.setItem('sbs-mermaid-mode', mode);
    }, [mode]);

    // Handle split resize
    const handleMouseDown = useCallback((e) => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !containerRef.current) return;
        
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        setSplitRatio(Math.min(Math.max(percentage, 20), 80));
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + B - Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
            }
            // Ctrl/Cmd + 1 - Code mode
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                setMode('code');
            }
            // Ctrl/Cmd + 2 - Visual mode
            if ((e.ctrlKey || e.metaKey) && e.key === '2') {
                e.preventDefault();
                setMode('visual');
            }
            // Ctrl/Cmd + E - Export menu (handled in header)
            // Ctrl/Cmd + Shift + L - Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                setTheme(prev => prev === 'dark' ? 'light' : 'dark');
            }
            // Ctrl/Cmd + Shift + S - Export SVG
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                handleExport('svg');
            }
            // Ctrl/Cmd + Shift + P - Export PNG
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                handleExport('png');
            }
            // Escape - Close sidebar
            if (e.key === 'Escape') {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadExample = (type) => {
        setCode(EXAMPLE_DIAGRAMS[type] || DEFAULT_CODE);
        setDiagramType(type);
        setSidebarOpen(false);
        showNotification(`Loaded ${type} template`);
    };

    const handleExport = async (format) => {
        const svgElement = document.querySelector('.mermaid-preview svg');
        if (!svgElement) {
            showNotification('Please wait for the diagram to render first', 'error');
            return;
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        if (format === 'svg') {
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            downloadBlob(blob, `sbs-mermaid-${Date.now()}.svg`);
            showNotification('SVG exported successfully!');
        } else if (format === 'png' || format === 'png-hd') {
            await exportToPng(svgString, format === 'png-hd' ? 4 : 2);
            showNotification('PNG exported successfully!');
        } else if (format === 'code') {
            const blob = new Blob([code], { type: 'text/plain' });
            downloadBlob(blob, `sbs-mermaid-${Date.now()}.mmd`);
            showNotification('Code file downloaded!');
        }
    };

    const exportToPng = async (svgString, scale = 2) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.fillStyle = theme === 'dark' ? '#1e1e1e' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                downloadBlob(blob, `sbs-mermaid-${Date.now()}.png`);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.src = url;
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            showNotification('Code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy', err);
            showNotification('Failed to copy code', 'error');
        }
    };

    // Handle code from visual builder
    const handleVisualBuilderCode = (generatedCode) => {
        if (generatedCode && generatedCode.trim()) {
            setCode(generatedCode);
        }
    };

    return (
        <div className={`app ${theme}`}>
            <Header 
                theme={theme}
                setTheme={setTheme}
                diagramTheme={diagramTheme}
                setDiagramTheme={setDiagramTheme}
                mode={mode}
                setMode={setMode}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                onExport={handleExport}
                onCopy={copyCode}
                isMobile={isMobile}
            />
            
            <div className="main-container">
                <Sidebar 
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onLoadExample={loadExample}
                    currentType={diagramType}
                />
                
                <div className="workspace" ref={containerRef}>
                    {isMobile ? (
                        <>
                            <div className="mobile-tabs">
                                <button 
                                    className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('editor')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                    </svg>
                                    {mode === 'code' ? 'Code' : 'Builder'}
                                </button>
                                <button 
                                    className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('preview')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    Preview
                                </button>
                            </div>
                            <div className="mobile-content">
                                {activeTab === 'editor' ? (
                                    mode === 'code' ? (
                                        <CodeEditor 
                                            code={code}
                                            onChange={setCode}
                                            theme={theme}
                                        />
                                    ) : (
                                        <VisualBuilder 
                                            onGenerateCode={handleVisualBuilderCode}
                                            theme={theme}
                                        />
                                    )
                                ) : (
                                    <Preview 
                                        code={code}
                                        theme={theme}
                                        diagramTheme={diagramTheme}
                                        onError={setError}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="editor-panel" style={{ width: `${splitRatio}%` }}>
                                <div className="panel-header">
                                    <div className="panel-title">
                                        {mode === 'code' ? (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="16,18 22,12 16,6"/>
                                                    <polyline points="8,6 2,12 8,18"/>
                                                </svg>
                                                <span>diagram.mmd</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="7" height="7"/>
                                                    <rect x="14" y="3" width="7" height="7"/>
                                                    <rect x="14" y="14" width="7" height="7"/>
                                                    <rect x="3" y="14" width="7" height="7"/>
                                                </svg>
                                                <span>Visual Builder</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="panel-actions">
                                        {mode === 'code' && (
                                            <button onClick={copyCode} title="Copy code (Ctrl+C)">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {mode === 'code' ? (
                                    <CodeEditor 
                                        code={code}
                                        onChange={setCode}
                                        theme={theme}
                                    />
                                ) : (
                                    <VisualBuilder 
                                        onGenerateCode={handleVisualBuilderCode}
                                        theme={theme}
                                    />
                                )}
                            </div>
                            
                            <div 
                                className="resize-handle"
                                onMouseDown={handleMouseDown}
                                title="Drag to resize panels"
                            >
                                <div className="handle-bar"></div>
                            </div>
                            
                            <div className="preview-panel" style={{ width: `${100 - splitRatio}%` }}>
                                <div className="panel-header">
                                    <div className="panel-title">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                        <span>Preview</span>
                                        {diagramTheme !== 'default' && (
                                            <span className="theme-badge">{diagramTheme}</span>
                                        )}
                                    </div>
                                </div>
                                <Preview 
                                    code={code}
                                    theme={theme}
                                    diagramTheme={diagramTheme}
                                    onError={setError}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <StatusBar 
                error={error}
                charCount={code.length}
                lineCount={code.split('\n').length}
                mode={mode}
            />

            {/* Notification Toast */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    )}
                    <span>{notification.message}</span>
                </div>
            )}
        </div>
    );
}

export default App;
