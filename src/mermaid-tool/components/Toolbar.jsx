import React, { useState, useEffect } from 'react';
import { 
    Moon, Sun, Download, Copy, Home, Share2, Menu, X, 
    FileJson, FileText, MoreVertical, AlertCircle, CheckCircle 
} from 'lucide-react';
import { 
    exportSVG, exportPNG, exportPDF, exportJSON, 
    exportMarkdown, getSVGFromDiagram 
} from '../utils/export';

const Toolbar = ({ 
    theme, setTheme, code, mode, setMode, 
    isMobile, showEditor, setShowEditor, 
    showPreview, setShowPreview, exportMenu, 
    setExportMenu, showNotification, notification 
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleThemeToggle = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            showNotification('Code copied to clipboard!');
        } catch (err) {
            showNotification('Failed to copy code');
        }
    };

    const handleExportSVG = () => {
        try {
            const svg = getSVGFromDiagram();
            if (!svg) {
                showNotification('Render the diagram first');
                return;
            }
            exportSVG(svg, `diagram-${Date.now()}.svg`);
            showNotification('Exported as SVG');
            setExportMenu(false);
        } catch (err) {
            showNotification('SVG export failed');
        }
    };

    const handleExportPNG = async () => {
        if (mode !== 'mermaid') {
            showNotification('Only mermaid diagrams can be exported as PNG');
            return;
        }
        setIsExporting(true);
        try {
            const svg = getSVGFromDiagram();
            if (!svg) {
                showNotification('Render the diagram first');
                return;
            }
            await exportPNG(svg, `diagram-${Date.now()}.png`);
            showNotification('Exported as PNG');
            setExportMenu(false);
        } catch (err) {
            showNotification('PNG export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (mode !== 'mermaid') {
            showNotification('Only mermaid diagrams can be exported as PDF');
            return;
        }
        setIsExporting(true);
        try {
            const svg = getSVGFromDiagram();
            if (!svg) {
                showNotification('Render the diagram first');
                return;
            }
            await exportPDF(svg, `diagram-${Date.now()}.pdf`);
            showNotification('Exported as PDF');
            setExportMenu(false);
        } catch (err) {
            showNotification('PDF export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = () => {
        try {
            exportJSON(code, `diagram-${Date.now()}.json`);
            showNotification('Exported as JSON');
            setExportMenu(false);
        } catch (err) {
            showNotification('JSON export failed');
        }
    };

    const handleExportMarkdown = () => {
        try {
            exportMarkdown(code, `diagram-${Date.now()}.md`);
            showNotification('Exported as Markdown');
            setExportMenu(false);
        } catch (err) {
            showNotification('Markdown export failed');
        }
    };

    return (
        <>
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3 shadow-lg">
                        <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="text-sm text-green-800 dark:text-green-200">{notification}</p>
                    </div>
                </div>
            )}

            {/* Main Toolbar */}
            <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-3 sm:px-4 justify-between z-40 flex-shrink-0">
                {/* Left: Branding & Home Link */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <a 
                        href="../../index.html" 
                        className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
                        title="Back to Home"
                    >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                            M
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-xs sm:text-sm truncate">
                            Mermaid
                        </span>
                    </a>
                </div>

                {/* Center: Mode Selector (Desktop) */}
                {!isMobile && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('mermaid')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                                mode === 'mermaid'
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Diagram
                        </button>
                        <button
                            onClick={() => setMode('markdown')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                                mode === 'markdown'
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Markdown
                        </button>
                    </div>
                )}

                {/* Right: Controls */}
                {!isMobile ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopyCode}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            title="Copy Code"
                        >
                            <Copy size={18} />
                        </button>

                        {/* Export Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setExportMenu(!exportMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md text-sm font-medium transition-colors"
                                title="Export diagram"
                            >
                                <Download size={16} />
                                <span>Export</span>
                            </button>

                            {exportMenu && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                                    <div className="py-1">
                                        <button
                                            onClick={handleExportSVG}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            disabled={isExporting}
                                        >
                                            <FileText size={16} />
                                            Export as SVG
                                        </button>
                                        <button
                                            onClick={handleExportPNG}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            disabled={isExporting || mode !== 'mermaid'}
                                        >
                                            <FileText size={16} />
                                            Export as PNG
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            disabled={isExporting || mode !== 'mermaid'}
                                        >
                                            <FileText size={16} />
                                            Export as PDF
                                        </button>
                                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                                        <button
                                            onClick={handleExportJSON}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            disabled={isExporting}
                                        >
                                            <FileJson size={16} />
                                            Export as JSON
                                        </button>
                                        <button
                                            onClick={handleExportMarkdown}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            disabled={isExporting}
                                        >
                                            <FileText size={16} />
                                            Export as Markdown
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        <button
                            onClick={handleThemeToggle}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                ) : (
                    // Mobile menu
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleThemeToggle}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                )}
            </header>

            {/* Mobile Menu */}
            {isMobile && mobileMenuOpen && (
                <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40">
                    <div className="px-3 py-2 space-y-2">
                        {/* Mode Selector */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setMode('mermaid');
                                    setMobileMenuOpen(false);
                                }}
                                className={`flex-1 px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                                    mode === 'mermaid'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                Diagram
                            </button>
                            <button
                                onClick={() => {
                                    setMode('markdown');
                                    setMobileMenuOpen(false);
                                }}
                                className={`flex-1 px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                                    mode === 'markdown'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                Markdown
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    handleCopyCode();
                                    setMobileMenuOpen(false);
                                }}
                                className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Copy size={14} />
                                Copy
                            </button>
                            <button
                                onClick={() => setExportMenu(!exportMenu)}
                                className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Download size={14} />
                                Export
                            </button>
                        </div>

                        {/* Export submenu */}
                        {exportMenu && (
                            <div className="space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <button
                                    onClick={handleExportSVG}
                                    className="w-full px-2 py-1 text-left text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    SVG
                                </button>
                                <button
                                    onClick={handleExportPNG}
                                    className="w-full px-2 py-1 text-left text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                                    disabled={mode !== 'mermaid'}
                                >
                                    PNG
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full px-2 py-1 text-left text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                                    disabled={mode !== 'mermaid'}
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={handleExportJSON}
                                    className="w-full px-2 py-1 text-left text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    JSON
                                </button>
                                <button
                                    onClick={handleExportMarkdown}
                                    className="w-full px-2 py-1 text-left text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    Markdown
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Toolbar;
