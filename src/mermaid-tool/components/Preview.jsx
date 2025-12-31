import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

function Preview({ code, theme, diagramTheme = 'default', onError }) {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    // Initialize mermaid with diagram theme
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: diagramTheme,
            securityLevel: 'loose',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            flowchart: { 
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10,
            },
            gantt: {
                useMaxWidth: true,
            },
            themeVariables: getThemeVariables(diagramTheme, theme)
        });
    }, [theme, diagramTheme]);

    // Render diagram
    useEffect(() => {
        const renderDiagram = async () => {
            if (!code.trim()) {
                setSvg('');
                setError(null);
                onError?.(null);
                return;
            }

            try {
                const id = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, code);
                setSvg(svg);
                setError(null);
                onError?.(null);
            } catch (err) {
                setError(err.message || 'Syntax error in diagram');
                onError?.(err.message);
            }
        };

        const debounce = setTimeout(renderDiagram, 300);
        return () => clearTimeout(debounce);
    }, [code, theme, diagramTheme, onError]);

    // Zoom handlers
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
        }
    }, []);

    const handleMouseDown = useCallback((e) => {
        if (e.button === 0) {
            setIsPanning(true);
            setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [position]);

    const handleMouseMove = useCallback((e) => {
        if (isPanning) {
            setPosition({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    }, [isPanning, startPan]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
    const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));

    return (
        <div className="preview-container">
            {/* Zoom Controls */}
            <div className="zoom-controls">
                <button onClick={zoomOut} title="Zoom out (Ctrl + Scroll)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>
                <span className="zoom-level">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} title="Zoom in (Ctrl + Scroll)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>
                <div className="zoom-divider"></div>
                <button onClick={resetView} title="Reset view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </button>
                <button onClick={() => setScale(s => Math.min(s, 1) || 1)} title="Fit to view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                        <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                        <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                        <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                    </svg>
                </button>
            </div>

            {/* Canvas */}
            <div 
                className="preview-canvas"
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
                {error ? (
                    <div className="preview-error">
                        <div className="error-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <h3>Syntax Error</h3>
                        <pre className="error-message">{error}</pre>
                        <p className="error-hint">Check your Mermaid syntax and try again</p>
                    </div>
                ) : svg ? (
                    <div 
                        className="mermaid-preview"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: 'center center'
                        }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                ) : (
                    <div className="preview-empty">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="3" y1="9" x2="21" y2="9"/>
                                <line x1="9" y1="21" x2="9" y2="9"/>
                            </svg>
                        </div>
                        <p>Start typing to see your diagram</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Get theme variables based on diagram theme
function getThemeVariables(diagramTheme, editorTheme) {
    const isDark = editorTheme === 'dark';
    
    switch(diagramTheme) {
        case 'forest':
            return {
                primaryColor: '#228B22',
                primaryTextColor: '#fff',
                primaryBorderColor: '#1a6b1a',
                lineColor: '#2d5a2d',
                secondaryColor: '#90EE90',
                tertiaryColor: '#98FB98',
            };
        case 'dark':
            return {
                primaryColor: '#1f2937',
                primaryTextColor: '#f3f4f6',
                primaryBorderColor: '#374151',
                lineColor: '#6b7280',
                secondaryColor: '#374151',
                tertiaryColor: '#4b5563',
                background: '#111827',
            };
        case 'neutral':
            return {
                primaryColor: '#6b7280',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#9ca3af',
                lineColor: '#9ca3af',
                secondaryColor: '#e5e7eb',
                tertiaryColor: '#f3f4f6',
            };
        case 'base':
            return {
                primaryColor: isDark ? '#3b82f6' : '#2563eb',
                primaryTextColor: '#fff',
                primaryBorderColor: isDark ? '#1d4ed8' : '#1e40af',
                lineColor: isDark ? '#6b7280' : '#9ca3af',
            };
        default:
            return {};
    }
}

export default Preview;
