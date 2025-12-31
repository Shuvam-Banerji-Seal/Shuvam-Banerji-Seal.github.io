import React, { useState } from 'react';

// Mermaid diagram themes
const DIAGRAM_THEMES = [
    { id: 'default', name: 'Default', description: 'Clean and professional' },
    { id: 'dark', name: 'Dark', description: 'Dark mode optimized' },
    { id: 'forest', name: 'Forest', description: 'Green nature theme' },
    { id: 'neutral', name: 'Neutral', description: 'Grayscale minimal' },
    { id: 'base', name: 'Base', description: 'Simple base theme' },
];

function Header({ 
    theme, 
    setTheme, 
    diagramTheme, 
    setDiagramTheme, 
    onMenuClick, 
    onExport, 
    onCopy, 
    isMobile,
    mode,
    setMode 
}) {
    const [exportOpen, setExportOpen] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuClick} title="Toggle sidebar (Ctrl+B)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                            <rect width="100" height="100" rx="20" fill="var(--accent-primary)"/>
                            <text x="50" y="62" fontSize="36" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif">SBS</text>
                        </svg>
                    </div>
                    <div className="logo-text-container">
                        <span className="logo-text">SBS's Mermaid</span>
                        <span className="logo-subtitle">Diagram Editor</span>
                    </div>
                </div>
            </div>

            <div className="header-center">
                {/* Mode Toggle */}
                <div className="mode-toggle">
                    <button 
                        className={`mode-btn ${mode === 'code' ? 'active' : ''}`}
                        onClick={() => setMode('code')}
                        title="Code Editor (Ctrl+1)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16,18 22,12 16,6"/>
                            <polyline points="8,6 2,12 8,18"/>
                        </svg>
                        {!isMobile && <span>Code</span>}
                    </button>
                    <button 
                        className={`mode-btn ${mode === 'visual' ? 'active' : ''}`}
                        onClick={() => setMode('visual')}
                        title="Visual Builder (Ctrl+2)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        {!isMobile && <span>Visual</span>}
                    </button>
                </div>

                {!isMobile && (
                    <a href="../index.html" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                        <span>Home</span>
                    </a>
                )}
            </div>

            <div className="header-right">
                {/* Diagram Theme Selector */}
                <div className="theme-dropdown">
                    <button 
                        className="theme-selector-btn"
                        onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                        title="Diagram theme"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 2a10 10 0 0 1 0 20"/>
                            <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10"/>
                        </svg>
                        {!isMobile && <span>{DIAGRAM_THEMES.find(t => t.id === diagramTheme)?.name || 'Theme'}</span>}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 12,15 18,9"/>
                        </svg>
                    </button>
                    
                    {themeMenuOpen && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setThemeMenuOpen(false)}></div>
                            <div className="dropdown-menu theme-menu">
                                <div className="dropdown-header">Diagram Theme</div>
                                {DIAGRAM_THEMES.map(t => (
                                    <button 
                                        key={t.id}
                                        className={`dropdown-item-selectable ${diagramTheme === t.id ? 'selected' : ''}`}
                                        onClick={() => { setDiagramTheme(t.id); setThemeMenuOpen(false); }}
                                    >
                                        <span className="item-check">
                                            {diagramTheme === t.id && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20,6 9,17 4,12"/>
                                                </svg>
                                            )}
                                        </span>
                                        <div className="item-content">
                                            <span className="item-name">{t.name}</span>
                                            <span className="item-desc">{t.description}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Export Dropdown */}
                <div className="export-dropdown">
                    <button 
                        className="export-btn"
                        onClick={() => setExportOpen(!exportOpen)}
                        title="Export diagram (Ctrl+E)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {!isMobile && <span>Export</span>}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 12,15 18,9"/>
                        </svg>
                    </button>
                    
                    {exportOpen && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setExportOpen(false)}></div>
                            <div className="dropdown-menu">
                                <button onClick={() => { onExport('svg'); setExportOpen(false); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                        <polyline points="14,2 14,8 20,8"/>
                                    </svg>
                                    <span>Export as SVG</span>
                                    <kbd>Ctrl+Shift+S</kbd>
                                </button>
                                <button onClick={() => { onExport('png'); setExportOpen(false); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21,15 16,10 5,21"/>
                                    </svg>
                                    <span>Export as PNG</span>
                                    <kbd>Ctrl+Shift+P</kbd>
                                </button>
                                <button onClick={() => { onExport('png-hd'); setExportOpen(false); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <text x="12" y="15" fontSize="8" textAnchor="middle" fill="currentColor">HD</text>
                                    </svg>
                                    <span>Export as PNG (4x)</span>
                                </button>
                                <div className="dropdown-divider"></div>
                                <button onClick={() => { onExport('code'); setExportOpen(false); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="16,18 22,12 16,6"/>
                                        <polyline points="8,6 2,12 8,18"/>
                                    </svg>
                                    <span>Download Code (.mmd)</span>
                                </button>
                                <button onClick={() => { onCopy(); setExportOpen(false); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                    <span>Copy Code</span>
                                    <kbd>Ctrl+C</kbd>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Editor Theme Toggle */}
                <button 
                    className="theme-btn"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title={theme === 'dark' ? 'Switch to light mode (Ctrl+Shift+L)' : 'Switch to dark mode (Ctrl+Shift+L)'}
                >
                    {theme === 'dark' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="4"/>
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    )}
                </button>

                {/* Help */}
                <button 
                    className="help-btn"
                    onClick={() => window.open('https://mermaid.js.org/syntax/flowchart.html', '_blank')}
                    title="Mermaid documentation"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default Header;
