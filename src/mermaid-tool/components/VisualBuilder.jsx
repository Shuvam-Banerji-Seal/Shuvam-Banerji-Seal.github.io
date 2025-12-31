import React, { useState, useRef, useEffect, useCallback } from 'react';

// Node types with their default properties
const NODE_TYPES = {
    rectangle: { label: 'Rectangle', shape: 'rect', syntax: (id, text) => `${id}[${text}]` },
    rounded: { label: 'Rounded', shape: 'rounded', syntax: (id, text) => `${id}(${text})` },
    stadium: { label: 'Stadium', shape: 'stadium', syntax: (id, text) => `${id}([${text}])` },
    subroutine: { label: 'Subroutine', shape: 'subroutine', syntax: (id, text) => `${id}[[${text}]]` },
    cylinder: { label: 'Database', shape: 'cylinder', syntax: (id, text) => `${id}[(${text})]` },
    circle: { label: 'Circle', shape: 'circle', syntax: (id, text) => `${id}((${text}))` },
    diamond: { label: 'Decision', shape: 'diamond', syntax: (id, text) => `${id}{${text}}` },
    hexagon: { label: 'Hexagon', shape: 'hexagon', syntax: (id, text) => `${id}{{${text}}}` },
    parallelogram: { label: 'Input/Output', shape: 'parallelogram', syntax: (id, text) => `${id}[/${text}/]` },
    trapezoid: { label: 'Trapezoid', shape: 'trapezoid', syntax: (id, text) => `${id}[/${text}\\]` },
};

const ARROW_TYPES = {
    arrow: { label: 'Arrow', syntax: '-->' },
    dotted: { label: 'Dotted', syntax: '-.->' },
    thick: { label: 'Thick', syntax: '==>' },
    open: { label: 'Open', syntax: '---' },
};

const DEFAULT_COLORS = [
    '#0e639c', '#388a34', '#d32f2f', '#f57c00', '#7b1fa2',
    '#00796b', '#c2185b', '#512da8', '#1976d2', '#455a64',
    '#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#424242',
];

const TEXT_COLORS = [
    '#ffffff', '#000000', '#333333', '#666666', '#999999',
    '#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#e91e63',
];

function VisualBuilder({ onGenerateCode, theme }) {
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(null); // 'bg' | 'text' | null
    const [contextMenu, setContextMenu] = useState(null);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [editingNode, setEditingNode] = useState(null);
    const [tempText, setTempText] = useState('');

    // Generate unique ID
    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add a new node
    const addNode = (type, x = 200, y = 200) => {
        const newNode = {
            id: generateId(),
            type,
            text: NODE_TYPES[type].label,
            x: (x - canvasOffset.x) / zoom,
            y: (y - canvasOffset.y) / zoom,
            bgColor: '#0e639c',
            textColor: '#ffffff',
            width: 140,
            height: 60,
        };
        setNodes([...nodes, newNode]);
        setSelectedNode(newNode.id);
        setContextMenu(null);
    };

    // Update node
    const updateNode = (id, updates) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    // Delete node
    const deleteNode = (id) => {
        setNodes(nodes.filter(n => n.id !== id));
        setConnections(connections.filter(c => c.from !== id && c.to !== id));
        setSelectedNode(null);
        setContextMenu(null);
    };

    // Add connection
    const addConnection = (from, to, label = '') => {
        if (from === to) return;
        const exists = connections.find(c => c.from === from && c.to === to);
        if (exists) return;
        
        const newConnection = {
            id: `conn_${Date.now()}`,
            from,
            to,
            label,
            arrowType: 'arrow',
        };
        setConnections([...connections, newConnection]);
    };

    // Update connection
    const updateConnection = (id, updates) => {
        setConnections(connections.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    // Delete connection
    const deleteConnection = (id) => {
        setConnections(connections.filter(c => c.id !== id));
        setSelectedConnection(null);
    };

    // Mouse handlers for node dragging
    const handleNodeMouseDown = (e, node) => {
        if (e.button === 2) return; // Right click
        e.stopPropagation();
        
        if (connectingFrom) {
            // Completing a connection
            addConnection(connectingFrom, node.id);
            setConnectingFrom(null);
        } else {
            setSelectedNode(node.id);
            setSelectedConnection(null);
            setIsDragging(true);
            const rect = canvasRef.current.getBoundingClientRect();
            setDragOffset({
                x: (e.clientX - rect.left) / zoom - canvasOffset.x / zoom - node.x,
                y: (e.clientY - rect.top) / zoom - canvasOffset.y / zoom - node.y,
            });
        }
    };

    const handleCanvasMouseMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        if (isDragging && selectedNode) {
            const newX = (e.clientX - rect.left) / zoom - canvasOffset.x / zoom - dragOffset.x;
            const newY = (e.clientY - rect.top) / zoom - canvasOffset.y / zoom - dragOffset.y;
            updateNode(selectedNode, { x: Math.max(0, newX), y: Math.max(0, newY) });
        }

        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setCanvasOffset({ x: canvasOffset.x + dx, y: canvasOffset.y + dy });
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    }, [isDragging, selectedNode, dragOffset, canvasOffset, zoom, isPanning, panStart]);

    const handleCanvasMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsPanning(false);
    }, []);

    // Canvas panning
    const handleCanvasMouseDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+Click
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0) {
            setSelectedNode(null);
            setSelectedConnection(null);
            setConnectingFrom(null);
        }
    };

    // Context menu
    const handleContextMenu = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        setContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            clientX: e.clientX,
            clientY: e.clientY,
        });
    };

    // Zoom
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * delta, 0.25), 3));
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (editingNode) return;
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNode) {
                    deleteNode(selectedNode);
                } else if (selectedConnection) {
                    deleteConnection(selectedConnection);
                }
            }
            if (e.key === 'Escape') {
                setConnectingFrom(null);
                setSelectedNode(null);
                setSelectedConnection(null);
                setContextMenu(null);
            }
            // Duplicate node
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (selectedNode) {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (node) {
                        addNode(node.type, (node.x + 50) * zoom + canvasOffset.x, (node.y + 50) * zoom + canvasOffset.y);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedConnection, editingNode, nodes]);

    // Generate Mermaid code
    const generateMermaidCode = useCallback(() => {
        if (nodes.length === 0) return '';

        let code = 'flowchart TD\n';
        
        // Add style definitions
        const nodeStyles = new Map();
        nodes.forEach((node, index) => {
            const styleId = `style${index}`;
            nodeStyles.set(node.id, styleId);
            code += `    ${NODE_TYPES[node.type].syntax(node.id.replace(/[^a-zA-Z0-9]/g, ''), node.text)}\n`;
        });

        // Add connections
        connections.forEach(conn => {
            const fromId = conn.from.replace(/[^a-zA-Z0-9]/g, '');
            const toId = conn.to.replace(/[^a-zA-Z0-9]/g, '');
            const arrow = ARROW_TYPES[conn.arrowType]?.syntax || '-->';
            if (conn.label) {
                code += `    ${fromId} ${arrow}|${conn.label}| ${toId}\n`;
            } else {
                code += `    ${fromId} ${arrow} ${toId}\n`;
            }
        });

        // Add styles
        nodes.forEach((node, index) => {
            const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '');
            code += `    style ${nodeId} fill:${node.bgColor},stroke:${node.bgColor},color:${node.textColor}\n`;
        });

        return code;
    }, [nodes, connections]);

    // Update parent when nodes/connections change
    useEffect(() => {
        const code = generateMermaidCode();
        onGenerateCode?.(code);
    }, [nodes, connections, generateMermaidCode, onGenerateCode]);

    useEffect(() => {
        document.addEventListener('mousemove', handleCanvasMouseMove);
        document.addEventListener('mouseup', handleCanvasMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleCanvasMouseMove);
            document.removeEventListener('mouseup', handleCanvasMouseUp);
        };
    }, [handleCanvasMouseMove, handleCanvasMouseUp]);

    // Render node shape
    const renderNodeShape = (node, isSelected) => {
        const baseProps = {
            fill: node.bgColor,
            stroke: isSelected ? '#ffeb3b' : node.bgColor,
            strokeWidth: isSelected ? 3 : 1,
        };

        switch (node.type) {
            case 'circle':
                return <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2 - 2} ry={node.height / 2 - 2} {...baseProps} />;
            case 'diamond':
                return (
                    <polygon
                        points={`${node.width / 2},2 ${node.width - 2},${node.height / 2} ${node.width / 2},${node.height - 2} 2,${node.height / 2}`}
                        {...baseProps}
                    />
                );
            case 'hexagon':
                return (
                    <polygon
                        points={`20,2 ${node.width - 20},2 ${node.width - 2},${node.height / 2} ${node.width - 20},${node.height - 2} 20,${node.height - 2} 2,${node.height / 2}`}
                        {...baseProps}
                    />
                );
            case 'parallelogram':
                return (
                    <polygon
                        points={`20,2 ${node.width - 2},2 ${node.width - 20},${node.height - 2} 2,${node.height - 2}`}
                        {...baseProps}
                    />
                );
            case 'rounded':
            case 'stadium':
                return <rect x="2" y="2" width={node.width - 4} height={node.height - 4} rx="20" {...baseProps} />;
            case 'cylinder':
                return (
                    <g>
                        <ellipse cx={node.width / 2} cy="12" rx={node.width / 2 - 2} ry="10" {...baseProps} />
                        <rect x="2" y="12" width={node.width - 4} height={node.height - 24} {...baseProps} />
                        <ellipse cx={node.width / 2} cy={node.height - 12} rx={node.width / 2 - 2} ry="10" {...baseProps} />
                    </g>
                );
            default:
                return <rect x="2" y="2" width={node.width - 4} height={node.height - 4} rx="4" {...baseProps} />;
        }
    };

    // Get node center for connections
    const getNodeCenter = (node) => ({
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
    });

    // Calculate connection path
    const getConnectionPath = (conn) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return '';

        const from = getNodeCenter(fromNode);
        const to = getNodeCenter(toNode);

        // Simple curved path
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const curve = Math.abs(to.x - from.x) * 0.2;

        return `M ${from.x} ${from.y} Q ${midX} ${midY - curve} ${to.x} ${to.y}`;
    };

    // Double click to edit
    const handleNodeDoubleClick = (e, node) => {
        e.stopPropagation();
        setEditingNode(node.id);
        setTempText(node.text);
    };

    const handleTextInputBlur = () => {
        if (editingNode && tempText.trim()) {
            updateNode(editingNode, { text: tempText });
        }
        setEditingNode(null);
        setTempText('');
    };

    const handleTextInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTextInputBlur();
        }
        if (e.key === 'Escape') {
            setEditingNode(null);
            setTempText('');
        }
    };

    // Start connection
    const startConnection = (nodeId) => {
        setConnectingFrom(nodeId);
        setContextMenu(null);
    };

    const selectedNodeData = nodes.find(n => n.id === selectedNode);

    return (
        <div className="visual-builder">
            {/* Toolbar */}
            <div className="vb-toolbar">
                <div className="vb-toolbar-section">
                    <span className="vb-toolbar-label">Add Shape:</span>
                    <div className="vb-shape-buttons">
                        {Object.entries(NODE_TYPES).slice(0, 6).map(([type, config]) => (
                            <button
                                key={type}
                                className="vb-shape-btn"
                                onClick={() => addNode(type, 200, 200)}
                                title={config.label}
                            >
                                <ShapeIcon type={type} />
                            </button>
                        ))}
                        <div className="vb-shape-dropdown">
                            <button className="vb-shape-btn vb-more-btn" title="More shapes">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                                </svg>
                            </button>
                            <div className="vb-dropdown-content">
                                {Object.entries(NODE_TYPES).slice(6).map(([type, config]) => (
                                    <button
                                        key={type}
                                        className="vb-dropdown-item"
                                        onClick={() => addNode(type, 200, 200)}
                                    >
                                        <ShapeIcon type={type} />
                                        <span>{config.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vb-toolbar-divider" />

                <div className="vb-toolbar-section">
                    <span className="vb-toolbar-label">Zoom:</span>
                    <button className="vb-tool-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.25))}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <span className="vb-zoom-level">{Math.round(zoom * 100)}%</span>
                    <button className="vb-tool-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button className="vb-tool-btn" onClick={() => { setZoom(1); setCanvasOffset({ x: 0, y: 0 }); }} title="Reset view">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                        </svg>
                    </button>
                </div>

                <div className="vb-toolbar-divider" />

                <div className="vb-toolbar-section">
                    <button 
                        className="vb-tool-btn vb-clear-btn" 
                        onClick={() => { setNodes([]); setConnections([]); }}
                        title="Clear canvas"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                        <span>Clear</span>
                    </button>
                </div>
            </div>

            {/* Properties Panel for Selected Node */}
            {selectedNodeData && (
                <div className="vb-properties-panel">
                    <div className="vb-panel-header">
                        <span>Properties</span>
                        <button onClick={() => setSelectedNode(null)} className="vb-close-btn">×</button>
                    </div>
                    <div className="vb-panel-content">
                        <div className="vb-prop-group">
                            <label>Text</label>
                            <input
                                type="text"
                                value={selectedNodeData.text}
                                onChange={(e) => updateNode(selectedNode, { text: e.target.value })}
                                className="vb-input"
                            />
                        </div>
                        <div className="vb-prop-group">
                            <label>Shape</label>
                            <select
                                value={selectedNodeData.type}
                                onChange={(e) => updateNode(selectedNode, { type: e.target.value })}
                                className="vb-select"
                            >
                                {Object.entries(NODE_TYPES).map(([type, config]) => (
                                    <option key={type} value={type}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="vb-prop-group">
                            <label>Background Color</label>
                            <div className="vb-color-picker">
                                {DEFAULT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`vb-color-swatch ${selectedNodeData.bgColor === color ? 'active' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => updateNode(selectedNode, { bgColor: color })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="vb-prop-group">
                            <label>Text Color</label>
                            <div className="vb-color-picker">
                                {TEXT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`vb-color-swatch ${selectedNodeData.textColor === color ? 'active' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => updateNode(selectedNode, { textColor: color })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="vb-prop-actions">
                            <button className="vb-action-btn" onClick={() => startConnection(selectedNode)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                                Connect
                            </button>
                            <button className="vb-action-btn vb-delete-btn" onClick={() => deleteNode(selectedNode)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div 
                className="vb-canvas"
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                style={{ cursor: isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : 'default' }}
            >
                <svg
                    className="vb-svg"
                    style={{
                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                    }}
                >
                    {/* Grid pattern */}
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.5" />
                        </pattern>
                        {/* Arrow marker */}
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
                        </marker>
                    </defs>
                    <rect width="4000" height="4000" x="-2000" y="-2000" fill="url(#grid)" />

                    {/* Connections */}
                    {connections.map(conn => {
                        const isSelected = selectedConnection === conn.id;
                        return (
                            <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }}>
                                <path
                                    d={getConnectionPath(conn)}
                                    fill="none"
                                    stroke={isSelected ? '#ffeb3b' : 'var(--text-secondary)'}
                                    strokeWidth={isSelected ? 3 : 2}
                                    strokeDasharray={conn.arrowType === 'dotted' ? '5,5' : 'none'}
                                    markerEnd="url(#arrowhead)"
                                    style={{ cursor: 'pointer' }}
                                />
                                {conn.label && (
                                    <text
                                        x={(nodes.find(n => n.id === conn.from)?.x + nodes.find(n => n.id === conn.to)?.x) / 2 + 70}
                                        y={(nodes.find(n => n.id === conn.from)?.y + nodes.find(n => n.id === conn.to)?.y) / 2 + 30}
                                        fill="var(--text-primary)"
                                        fontSize="12"
                                        textAnchor="middle"
                                    >
                                        {conn.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Temporary connection line */}
                    {connectingFrom && (
                        <line
                            x1={getNodeCenter(nodes.find(n => n.id === connectingFrom))?.x || 0}
                            y1={getNodeCenter(nodes.find(n => n.id === connectingFrom))?.y || 0}
                            x2={(canvasRef.current?.getBoundingClientRect().left || 0)}
                            y2={(canvasRef.current?.getBoundingClientRect().top || 0)}
                            stroke="var(--accent-text)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    )}

                    {/* Nodes */}
                    {nodes.map(node => {
                        const isSelected = selectedNode === node.id;
                        const isEditing = editingNode === node.id;
                        
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                                onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                                style={{ cursor: isDragging && selectedNode === node.id ? 'grabbing' : 'grab' }}
                            >
                                {renderNodeShape(node, isSelected)}
                                {!isEditing && (
                                    <text
                                        x={node.width / 2}
                                        y={node.height / 2}
                                        fill={node.textColor}
                                        fontSize="13"
                                        fontWeight="500"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                                    >
                                        {node.text}
                                    </text>
                                )}
                                {isEditing && (
                                    <foreignObject x="4" y={node.height / 2 - 14} width={node.width - 8} height="28">
                                        <input
                                            type="text"
                                            value={tempText}
                                            onChange={(e) => setTempText(e.target.value)}
                                            onBlur={handleTextInputBlur}
                                            onKeyDown={handleTextInputKeyDown}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                background: 'rgba(0,0,0,0.5)',
                                                border: '1px solid var(--accent-text)',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                outline: 'none',
                                            }}
                                        />
                                    </foreignObject>
                                )}
                                {/* Connection handle */}
                                {isSelected && (
                                    <circle
                                        cx={node.width}
                                        cy={node.height / 2}
                                        r="6"
                                        fill="var(--accent-primary)"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        style={{ cursor: 'crosshair' }}
                                        onClick={(e) => { e.stopPropagation(); startConnection(node.id); }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Connecting mode indicator */}
                {connectingFrom && (
                    <div className="vb-connecting-indicator">
                        Click on a node to connect • Press Esc to cancel
                    </div>
                )}

                {/* Empty state */}
                {nodes.length === 0 && (
                    <div className="vb-empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <h3>Visual Flowchart Builder</h3>
                        <p>Add shapes from the toolbar above or right-click to add nodes</p>
                        <p className="vb-hint">Double-click nodes to edit text • Drag to move • Ctrl+Scroll to zoom</p>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="vb-context-overlay" onClick={() => setContextMenu(null)} />
                    <div 
                        className="vb-context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <div className="vb-context-section">
                            <span className="vb-context-label">Add Shape</span>
                            {Object.entries(NODE_TYPES).slice(0, 5).map(([type, config]) => (
                                <button
                                    key={type}
                                    className="vb-context-item"
                                    onClick={() => addNode(type, contextMenu.x, contextMenu.y)}
                                >
                                    <ShapeIcon type={type} />
                                    <span>{config.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Shape icons component
function ShapeIcon({ type }) {
    const size = 16;
    switch (type) {
        case 'rectangle':
            return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'rounded':
            return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="7" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'stadium':
            return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'circle':
            return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'diamond':
            return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'hexagon':
            return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'parallelogram':
            return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="6,5 22,5 18,19 2,19" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'trapezoid':
            return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="4,5 20,5 22,19 2,19" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'cylinder':
            return <svg width={size} height={size} viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M4,5 L4,19 A8,3 0 0,0 20,19 L20,5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
        case 'subroutine':
            return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="5" x2="6" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="18" y1="5" x2="18" y2="19" stroke="currentColor" strokeWidth="2"/></svg>;
        default:
            return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
    }
}

export default VisualBuilder;
