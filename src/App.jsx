import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  getSmoothStepPath,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
} from 'reactflow';

import 'reactflow/dist/style.css';

const NodeShape = ({ type, selected, color, children }) => {
  const baseStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${selected ? (color || '#00bcd4') : 'rgba(255, 255, 255, 0.15)'}`,
    boxShadow: selected ? `0 0 25px -5px ${color || '#00bcd4'}` : '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  };

  if (type === 'database') {
    return (
      <div style={{ ...baseStyle, borderRadius: '20% / 10%', minWidth: 140, minHeight: 100, borderTopWidth: 4, borderBottomWidth: 4 }}>
        {children}
      </div>
    );
  }

  if (type === 'api') {
    return (
      <div style={{ ...baseStyle, borderRadius: '30px 4px 30px 4px', minWidth: 150, borderLeftWidth: 4, borderRightWidth: 4 }}>
        {children}
      </div>
    );
  }

  if (type === 'ui') {
    return (
      <div style={{ ...baseStyle, borderRadius: '4px', borderTop: '15px solid rgba(255,255,255,0.1)', minWidth: 170 }}>
        {children}
      </div>
    );
  }

  if (type === 'logic') {
    return (
      <div style={{ ...baseStyle, width: 120, height: 120, transform: 'rotate(45deg)', borderRadius: '8px' }}>
        <div style={{ transform: 'rotate(-45deg)' }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, borderRadius: '12px', minWidth: 160 }}>
      {children}
    </div>
  );
};

// 🔹 Custom Editable Node
const CustomNode = ({ data, selected, type }) => {
  return (
    <NodeShape type={data.nodeType} selected={selected} color={data.color}>
      {/* 🔹 Handles with Unique IDs to fix selection issues */}
      <Handle type="target" position={Position.Left} id="left-t" style={{ background: '#00bcd4', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Right} id="right-s" style={{ background: '#00bcd4', width: '8px', height: '8px' }} />
      <Handle type="target" position={Position.Top} id="top-t" style={{ background: '#00bcd4', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ background: '#00bcd4', width: '8px', height: '8px' }} />

      <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
        {data.nodeType || 'Action'}
      </div>
      <input
        defaultValue={data.label}
        onChange={(e) => (data.label = e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          width: '100%',
          outline: 'none',
          fontSize: '14px',
          fontWeight: 500,
        }}
      />
    </NodeShape>
  );
};

const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  interactionWidth,
  pathType
}) => {
  const [edgePath, labelX, labelY] = pathType === 'straight'
    ? getStraightPath({ sourceX, sourceY, targetX, targetY })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} interactionWidth={interactionWidth} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="edge-badge"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = {
  smoothstep: (props) => <CustomEdge {...props} pathType="smoothstep" />,
  straight: (props) => <CustomEdge {...props} pathType="straight" />,
};

// 🔹 Initial Nodes
const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { label: 'End' },
  },
];

const initialEdges = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [edgeMenu, setEdgeMenu] = useState(null);
  const [connectionColor, setConnectionColor] = useState('#00bcd4');
  const [clipboard, setClipboard] = useState(null);

  // 🔹 Connect nodes
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      const sourceType = sourceNode?.data?.nodeType;
      const targetType = targetNode?.data?.nodeType;
      
      // Semantic color mapping
      let color = '#00bcd4'; // Default Cyan
      if (sourceType === 'database' || targetType === 'database') color = '#10b981'; // Green for DB
      else if (sourceType === 'api' || targetType === 'api') color = '#f59e0b'; // Yellow for API

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            className: 'animated',
            style: { stroke: color, strokeWidth: 3, filter: `drop-shadow(0 0 6px ${color})` },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: color,
            },
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  // 🔹 1. Dynamic Connection Styling (Real-time dragging color)
  const onConnectStart = useCallback((_, { nodeId }) => {
    const sourceNode = nodes.find((n) => n.id === nodeId);
    const type = sourceNode?.data?.nodeType;
    const color = type === 'database' ? '#10b981' : type === 'api' ? '#f59e0b' : '#00bcd4';
    setConnectionColor(color);
  }, [nodes]);

  const onConnectEnd = useCallback(() => {
    setConnectionColor('#00bcd4'); // Reset default
  }, []);

  // 🔹 2. Edge Context Menu Handler
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setEdgeMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setEdgeMenu]
  );

  // 🔹 Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const selectedNode = nodes.find(n => n.selected);
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) deleteNode(selectedNode.id);
      }
      
      // Ctrl Shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && selectedNode) {
          setClipboard({ ...selectedNode });
        }
        if (e.key === 'v' && clipboard) {
          const newNode = {
            ...clipboard,
            id: `${Date.now()}`,
            position: { x: clipboard.position.x + 40, y: clipboard.position.y + 40 },
            selected: false,
          };
          setNodes((nds) => [...nds, newNode]);
        }
        if (e.key === 'd' && selectedNode) {
          e.preventDefault();
          const newNode = {
            ...selectedNode,
            id: `${Date.now()}`,
            position: { x: selectedNode.position.x + 30, y: selectedNode.position.y + 30 },
            selected: false,
          };
          setNodes((nds) => [...nds, newNode]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, clipboard]);

  // 🔹 Context Menu Handlers
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setEdgeMenu(null);
  }, [setMenu, setEdgeMenu]);

  // 🔹 Add Node
  const addNode = (nodeType = 'action') => {
    const newNode = {
      id: `${Date.now()}`,
      type: 'custom',
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: { label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`, nodeType },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsMenuOpen(false);
  };

  // 🔹 Node Actions
  const deleteNode = (id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setMenu(null);
  };

  // 🔹 3. Edge Actions (Styling & Deletion)
  const updateEdgeStyle = (id, type) => {
    setEdges((eds) => eds.map((e) => e.id === id ? { ...e, type } : e));
    setEdgeMenu(null);
  };

  // 🔹 4. Edge Labeling
  const setEdgeLabel = (id) => {
    const label = prompt("Enter connection label:");
    setEdges((eds) => eds.map((e) => e.id === id ? { ...e, label } : e));
    setEdgeMenu(null);
  };

  const deleteEdge = (id) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
    setEdgeMenu(null);
  };

  const updateColor = (id, color) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, color } } : node));
    setMenu(null);
  };

  // 🔹 Delete handling (clean edges)
  const onNodesDelete = (deleted) => {
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !deleted.some(
            (node) =>
              node.id === edge.source || node.id === edge.target
          )
      )
    );
  };

  // 🔹 Save Flow
  const saveFlow = () => {
    const flow = { nodes, edges };
    localStorage.setItem('flow', JSON.stringify(flow));
  };

  // 🔹 Export Flow
  const exportFlow = () => {
    const flow = { nodes, edges };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "workflow-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 🔹 Load Flow
  const loadFlow = () => {
    const flow = JSON.parse(localStorage.getItem('flow'));
    if (flow) {
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    }
  };

  // 🔹 Tidy Layout Algorithm (Hierarchical)
  const tidyLayout = useCallback(() => {
    const nodeWidth = 250;
    const nodeHeight = 150;
    const levelMap = {};
    const levelCounts = {};

    // 1. Calculate the in-degree of each node
    const inDegree = {};
    nodes.forEach(n => inDegree[n.id] = 0);
    edges.forEach(e => inDegree[e.target] = (inDegree[e.target] || 0) + 1);

    // 2. Assign levels (Breadth-First approach)
    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => ({ id: n.id, level: 0 }));
    const processed = new Set();

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (processed.has(id)) continue;
      processed.add(id);
      levelMap[id] = level;
      levelCounts[level] = (levelCounts[level] || 0) + 1;

      edges.filter(e => e.source === id).forEach(e => queue.push({ id: e.target, level: level + 1 }));
    }

    // 3. Update positions
    const currentLevelOffsets = {};
    setNodes((nds) => nds.map((node) => {
      const level = levelMap[node.id] || 0;
      const offset = currentLevelOffsets[level] || 0;
      currentLevelOffsets[level] = offset + 1;
      return {
        ...node,
        position: { x: level * nodeWidth + 100, y: offset * nodeHeight + 100 },
      };
    }));
  }, [nodes, edges, setNodes]);

  // 🔹 Auto Save
  useEffect(() => {
    const flow = { nodes, edges };
    localStorage.setItem('flow', JSON.stringify(flow));
  }, [nodes, edges]);

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  };

  const dropdownItemStyle = {
    ...buttonStyle,
    border: 'none',
    textAlign: 'left',
    width: '100%',
    borderRadius: '4px',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#02010a', position: 'relative' }}>
      <style>{`
        /* 🔹 Force the app to be edge-to-edge, overriding default boilerplate CSS */
        body, html, #root {
          margin: 0 !important; 
          padding: 0 !important; 
          width: 100% !important; 
          height: 100% !important; 
          max-width: none !important;
          overflow: hidden !important;
          display: block !important;
        }
      `}</style>

      {/* 🔹 Controls UI */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>Workflow</div>
        
        <div style={{ position: 'relative' }}>
          <button style={{ ...buttonStyle, width: '100%', background: isMenuOpen ? 'rgba(0, 188, 212, 0.2)' : buttonStyle.background }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕ Close' : '+ Add Node'}
          </button>
          
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              left: 'calc(100% + 10px)',
              top: 0,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '150px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
            }}>
              <button style={dropdownItemStyle} onClick={() => addNode('action')} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                🟦 Action Step
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode('database')} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                🛢️ Database
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode('api')} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                🚀 API Trigger
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode('ui')} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                🖥️ UI Block
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode('logic')} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                🔷 Logic Gate
              </button>
            </div>
          )}
        </div>

        <button style={buttonStyle} onClick={saveFlow}>Save Flow</button>
        <button style={buttonStyle} onClick={loadFlow}>Restore</button>
        <button style={{ ...buttonStyle, color: '#00bcd4' }} onClick={exportFlow}>📁 Export JSON</button>
        <button style={buttonStyle} onClick={tidyLayout}>✨ Tidy Layout</button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        fitView
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: connectionColor, strokeWidth: 3 }}
        style={{ width: '100%', height: '100%', background: '#020617' }}
      >
        <MiniMap 
          style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }} 
          maskColor="rgba(0, 0, 0, 0.3)" 
          nodeColor="#334155"
        />
        <Controls style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', fill: '#fff' }} />
        <Background color="#1e293b" gap={25} size={1} />
      </ReactFlow>

      {/* 🔹 Custom Context Menu */}
      {menu && (
        <div style={{
          position: 'fixed', top: menu.top, left: menu.left, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px',
          padding: '8px', minWidth: '160px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>Node Options</div>
          <button className="context-menu-item" onClick={() => deleteNode(menu.id)} style={{ ...dropdownItemStyle, color: '#f87171' }}>🗑️ Delete Node</button>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>Accent Color</div>
          <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
            {['#00bcd4', '#a855f7', '#10b981', '#f59e0b'].map((c) => (
              <div 
                key={c} 
                onClick={() => updateColor(menu.id, c)}
                style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', background: c, 
                  cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' 
                }} 
              />
            ))}
          </div>
          <button className="context-menu-item" onClick={() => updateColor(menu.id, null)} style={dropdownItemStyle}>🔄 Reset Color</button>
        </div>
      )}

      {/* 🔹 Edge Context Menu */}
      {edgeMenu && (
        <div style={{
          position: 'fixed', top: edgeMenu.top, left: edgeMenu.left, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px',
          padding: '8px', minWidth: '160px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>Edge Options</div>
          <button className="context-menu-item" onClick={() => setEdgeLabel(edgeMenu.id)} style={dropdownItemStyle}>📝 Set Label</button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>Path Type</div>
          <button className="context-menu-item" onClick={() => updateEdgeStyle(edgeMenu.id, 'smoothstep')} style={dropdownItemStyle}>〰️ Curved</button>
          <button className="context-menu-item" onClick={() => updateEdgeStyle(edgeMenu.id, 'straight')} style={dropdownItemStyle}>📏 Straight</button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button className="context-menu-item" onClick={() => deleteEdge(edgeMenu.id)} style={{ ...dropdownItemStyle, color: '#f87171' }}>🗑️ Delete Edge</button>
        </div>
      )}
    </div>
  );
}