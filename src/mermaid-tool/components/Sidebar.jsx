import React from 'react';

const DIAGRAM_TYPES = [
    { id: 'flowchart', name: 'Flowchart', icon: 'M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18' },
    { id: 'sequence', name: 'Sequence', icon: 'M4 4v16M20 4v16M4 8h16M4 16h16M8 8v8M16 8v8' },
    { id: 'class', name: 'Class Diagram', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6zM7 10v4M17 10v4M10 7h4M10 17h4' },
    { id: 'state', name: 'State Diagram', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z' },
    { id: 'er', name: 'ER Diagram', icon: 'M4 6h4v4H4zM16 6h4v4h-4zM10 14h4v4h-4zM8 8l2 6M16 8l-2 6' },
    { id: 'gantt', name: 'Gantt Chart', icon: 'M3 6h18M3 12h18M3 18h18M6 3v18M8 6v3M14 6v3M10 12v3M16 12v3M7 18v3' },
    { id: 'pie', name: 'Pie Chart', icon: 'M12 2a10 10 0 1 0 10 10h-10zM12 2v10h10' },
    { id: 'git', name: 'Git Graph', icon: 'M6 3v18M12 8v13M18 6v15M6 8h6M12 12h6M6 16h12' },
    { id: 'mindmap', name: 'Mind Map', icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 9V3M12 15v6M9 12H3M15 12h6M9.5 9.5L5 5M14.5 9.5L19 5M9.5 14.5L5 19M14.5 14.5L19 19' },
];

function Sidebar({ isOpen, onClose, onLoadExample, currentType }) {
    return (
        <>
            <div 
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            ></div>
            
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Diagram Templates</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                
                <div className="sidebar-content">
                    <p className="sidebar-description">
                        Select a template to get started quickly
                    </p>
                    
                    <div className="template-list">
                        {DIAGRAM_TYPES.map((type) => (
                            <button
                                key={type.id}
                                className={`template-item ${currentType === type.id ? 'active' : ''}`}
                                onClick={() => onLoadExample(type.id)}
                            >
                                <div className="template-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={type.icon}/>
                                    </svg>
                                </div>
                                <span className="template-name">{type.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="sidebar-footer">
                    <a 
                        href="https://mermaid.js.org/syntax/flowchart.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="docs-link"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        <span>Mermaid Documentation</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15,3 21,3 21,9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    </a>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
