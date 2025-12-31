import React from 'react';

function StatusBar({ error, charCount, lineCount, mode }) {
    return (
        <footer className="status-bar">
            <div className="status-left">
                {error ? (
                    <span className="status-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Error in diagram
                    </span>
                ) : (
                    <span className="status-ready">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                        Ready
                    </span>
                )}
                <span className="status-divider">|</span>
                <span className="status-mode">
                    {mode === 'code' ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16,18 22,12 16,6"/>
                                <polyline points="8,6 2,12 8,18"/>
                            </svg>
                            Code Editor
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"/>
                                <rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            Visual Builder
                        </>
                    )}
                </span>
            </div>
            
            <div className="status-right">
                <span className="status-item">
                    Ln {lineCount}
                </span>
                <span className="status-divider">|</span>
                <span className="status-item">
                    {charCount} chars
                </span>
                <span className="status-divider">|</span>
                <span className="status-item status-brand">
                    SBS's Mermaid
                </span>
            </div>
        </footer>
    );
}

export default StatusBar;
