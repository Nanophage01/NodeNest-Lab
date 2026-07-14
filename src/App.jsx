import React, { useCallback, useEffect, useState } from "react";
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
} from "reactflow";

import "reactflow/dist/style.css";

const NodeShape = ({ type, selected, color, children }) => {
  const borderColor = selected ? color || "#2b6cb0" : "rgba(255,255,255,0.14)";

  const baseStyle = {
    background: "#0f172a",
    border: `1px solid ${borderColor}`,
    boxShadow: selected
      ? "0 0 0 2px rgba(43,108,176,0.22)"
      : "0 4px 14px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    color: "#e5e7eb",
    padding: "10px 12px",
    textAlign: "center",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  };

  // Slightly different silhouette per node type, but more traditional than glass/neon.
  if (type === "database") {
    return (
      <div
        style={{
          ...baseStyle,
          borderRadius: "10px",
          minWidth: 150,
        }}
      >
        {children}
      </div>
    );
  }

  if (type === "api") {
    return (
      <div
        style={{
          ...baseStyle,
          borderRadius: "10px",
          minWidth: 170,
        }}
      >
        {children}
      </div>
    );
  }

  if (type === "ui") {
    return (
      <div
        style={{
          ...baseStyle,
          borderRadius: "6px",
          minWidth: 180,
        }}
      >
        {children}
      </div>
    );
  }

  if (type === "logic") {
    return (
      <div
        style={{
          ...baseStyle,
          width: 120,
          height: 120,
          transform: "rotate(45deg)",
          borderRadius: "10px",
          padding: 0,
        }}
      >
        <div style={{ transform: "rotate(-45deg)", height: "100%" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, borderRadius: "10px", minWidth: 170 }}>
      {children}
    </div>
  );
};

// Node is still editable (keeps the label editing UI), but without mutating props.
const CustomNode = ({ data, selected }) => {
  const nodeType = data.nodeType || "action";
  const header = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);

  return (
    <NodeShape type={nodeType} selected={selected} color={data.color}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: selected ? "#c7d2fe" : "rgba(229,231,235,0.75)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          marginBottom: 6,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          paddingBottom: 6,
        }}
      >
        {header}
      </div>

      <input
        defaultValue={data.label ?? ""}
        onBlur={(e) => {
          // Use a window callback (wired from App) to update ReactFlow node state.
          const next = e.target.value;
          if (
            typeof window !== "undefined" &&
            typeof window.__setNodeLabel === "function"
          ) {
            window.__setNodeLabel(data.nodeId, next);
          }
        }}
        style={{
          background: "#0b1220",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 8,
          color: "#e5e7eb",
          width: "100%",
          padding: "8px 10px",
          outline: "none",
          fontSize: 13,
          fontWeight: 500,
          boxSizing: "border-box",
        }}
      />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-t"
        style={{
          background: "#60a5fa",
          width: 8,
          height: 8,
          borderRadius: 9999,
          border: "2px solid #0b1220",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-s"
        style={{
          background: "#60a5fa",
          width: 8,
          height: 8,
          borderRadius: 9999,
          border: "2px solid #0b1220",
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
  pathType,
}) => {
  const [edgePath, labelX, labelY] =
    pathType === "straight"
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
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
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

const initialNodes = [
  {
    id: "1",
    type: "custom",
    position: { x: 100, y: 100 },
    data: { label: "Start", nodeType: "action", nodeId: "1" },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 400, y: 200 },
    data: { label: "End", nodeType: "action", nodeId: "2" },
  },
];
const initialEdges = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [edgeMenu, setEdgeMenu] = useState(null);
  const [connectionColor, setConnectionColor] = useState("#60a5fa");
  const [clipboard, setClipboard] = useState(null);

  const deleteNode = useCallback(
    (id) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setMenu(null);
    },
    [setNodes],
  );

  // Wire window callback for label editing.
  useEffect(() => {
    window.__setNodeLabel = (nodeId, nextLabel) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label: nextLabel } } : n,
        ),
      );
    };
    return () => {
      try {
        delete window.__setNodeLabel;
      } catch {
        // ignore
      }
    };
  }, [setNodes]);

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      const sourceType = sourceNode?.data?.nodeType;
      const targetType = targetNode?.data?.nodeType;

      let color = "#60a5fa";
      if (sourceType === "database" || targetType === "database")
        color = "#34d399";
      else if (sourceType === "api" || targetType === "api") color = "#fbbf24";

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            // Traditional: no animated dashed edge/glow.
            animated: false,
            style: { stroke: color, strokeWidth: 2.25 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
          },
          eds,
        ),
      );
    },
    [nodes, setEdges],
  );

  const onConnectStart = useCallback(
    (_, { nodeId }) => {
      const sourceNode = nodes.find((n) => n.id === nodeId);
      const type = sourceNode?.data?.nodeType;
      const color =
        type === "database"
          ? "#34d399"
          : type === "api"
            ? "#fbbf24"
            : "#60a5fa";
      setConnectionColor(color);
    },
    [nodes],
  );

  const onConnectEnd = useCallback(() => {
    setConnectionColor("#60a5fa");
  }, []);

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setEdgeMenu({ id: edge.id, top: event.clientY, left: event.clientX });
    },
    [setEdgeMenu],
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      const selectedNode = nodes.find((n) => n.selected);

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNode) deleteNode(selectedNode.id);
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" && selectedNode) setClipboard({ ...selectedNode });
        if (e.key === "v" && clipboard) {
          const newNode = {
            ...clipboard,
            id: `${Date.now()}`,
            position: {
              x: clipboard.position.x + 40,
              y: clipboard.position.y + 40,
            },
            selected: false,
            data: { ...clipboard.data, nodeId: `${Date.now()}` },
          };
          setNodes((nds) => [...nds, newNode]);
        }
        if (e.key === "d" && selectedNode) {
          e.preventDefault();
          const newNode = {
            ...selectedNode,
            id: `${Date.now()}`,
            position: {
              x: selectedNode.position.x + 30,
              y: selectedNode.position.y + 30,
            },
            selected: false,
            data: { ...selectedNode.data, nodeId: `${Date.now()}` },
          };
          setNodes((nds) => [...nds, newNode]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, clipboard, deleteNode, setNodes]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({ id: node.id, top: event.clientY, left: event.clientX });
    },
    [setMenu],
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setEdgeMenu(null);
  }, []);

  const addNode = (nodeType = "action") => {
    const id = `${Date.now()}`;
    const newNode = {
      id,
      type: "custom",
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        nodeType,
        nodeId: id,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsMenuOpen(false);
  };

  const updateEdgeStyle = (id, type) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, type } : e)));
    setEdgeMenu(null);
  };

  const setEdgeLabel = (id) => {
    const label = prompt("Enter connection label:");
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, label } : e)));
    setEdgeMenu(null);
  };

  const deleteEdge = (id) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
    setEdgeMenu(null);
  };

  const updateColor = (id, color) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, color } } : node,
      ),
    );
    setMenu(null);
  };

  const onNodesDelete = (deleted) => {
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !deleted.some(
            (node) => node.id === edge.source || node.id === edge.target,
          ),
      ),
    );
  };

  const saveFlow = () => {
    const flow = { nodes, edges };
    localStorage.setItem("flow", JSON.stringify(flow));
  };

  const exportFlow = () => {
    const flow = { nodes, edges };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(flow));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "workflow-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const loadFlow = () => {
    const raw = localStorage.getItem("flow");
    if (!raw) return;
    const flow = JSON.parse(raw);
    if (flow) {
      setNodes(
        (flow.nodes || []).map((n) => ({
          ...n,
          data: {
            ...n.data,
            nodeId: n.id,
            nodeType: n.data?.nodeType || "action",
          },
        })),
      );
      setEdges(flow.edges || []);
    }
  };

  const tidyLayout = useCallback(() => {
    const nodeWidth = 250;
    const nodeHeight = 150;
    const levelMap = {};

    const inDegree = {};
    nodes.forEach((n) => (inDegree[n.id] = 0));
    edges.forEach((e) => (inDegree[e.target] = (inDegree[e.target] || 0) + 1));

    const queue = nodes
      .filter((n) => inDegree[n.id] === 0)
      .map((n) => ({ id: n.id, level: 0 }));
    const processed = new Set();

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (processed.has(id)) continue;
      processed.add(id);
      levelMap[id] = level;
      edges
        .filter((e) => e.source === id)
        .forEach((e) => queue.push({ id: e.target, level: level + 1 }));
    }

    const currentLevelOffsets = {};
    setNodes((nds) =>
      nds.map((node) => {
        const level = levelMap[node.id] || 0;
        const offset = currentLevelOffsets[level] || 0;
        currentLevelOffsets[level] = offset + 1;
        return {
          ...node,
          position: {
            x: level * nodeWidth + 100,
            y: offset * nodeHeight + 100,
          },
        };
      }),
    );
  }, [nodes, edges, setNodes]);

  // Auto Save
  useEffect(() => {
    const flow = { nodes, edges };
    localStorage.setItem("flow", JSON.stringify(flow));
  }, [nodes, edges]);

  const buttonStyle = {
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e5e7eb",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    transition: "background 0.15s ease, border-color 0.15s ease",
  };

  const dropdownItemStyle = {
    ...buttonStyle,
    border: "none",
    textAlign: "left",
    width: "100%",
    borderRadius: "8px",
    padding: "10px 12px",
  };

  const panelStyle = {
    background: "#0b1220",
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020617",
        position: "relative",
      }}
    >
      <style>{`
        body, html, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          overflow: hidden !important;
          display: block !important;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          ...panelStyle,
          width: 220,
        }}
      >
        <div
          style={{
            color: "rgba(229,231,235,0.72)",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Workflow
        </div>

        <div style={{ position: "relative" }}>
          <button
            style={{
              ...buttonStyle,
              width: "100%",
              background: isMenuOpen
                ? "rgba(96,165,250,0.16)"
                : buttonStyle.background,
              borderColor: isMenuOpen
                ? "rgba(96,165,250,0.45)"
                : buttonStyle.border,
            }}
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {isMenuOpen ? "Close" : "Add Node"}
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: "absolute",
                left: "calc(100% + 12px)",
                top: 0,
                width: 240,
                ...panelStyle,
                padding: 8,
              }}
            >
              <button
                style={dropdownItemStyle}
                onClick={() => addNode("action")}
              >
                Action Step
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => addNode("database")}
              >
                Database
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode("api")}>
                API Trigger
              </button>
              <button style={dropdownItemStyle} onClick={() => addNode("ui")}>
                UI Block
              </button>
              <button
                style={dropdownItemStyle}
                onClick={() => addNode("logic")}
              >
                Logic Gate
              </button>
            </div>
          )}
        </div>

        <button style={buttonStyle} onClick={saveFlow}>
          Save
        </button>
        <button style={buttonStyle} onClick={loadFlow}>
          Restore
        </button>
        <button
          style={{ ...buttonStyle, color: "#93c5fd" }}
          onClick={exportFlow}
        >
          Export JSON
        </button>
        <button style={buttonStyle} onClick={tidyLayout}>
          Tidy Layout
        </button>
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
        connectionLineStyle={{ stroke: connectionColor, strokeWidth: 2.25 }}
        style={{ width: "100%", height: "100%", background: "#020617" }}
      >
        <MiniMap
          style={{
            background: "#0b1220",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          maskColor="rgba(0, 0, 0, 0.35)"
          nodeColor="#334155"
        />
        <Controls
          style={{
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <Background color="#0f172a" gap={25} size={1} />
      </ReactFlow>

      {menu && (
        <div
          style={{
            position: "fixed",
            top: menu.top,
            left: menu.left,
            zIndex: 1000,
            ...panelStyle,
            minWidth: 190,
          }}
        >
          <div
            style={{
              color: "rgba(229,231,235,0.72)",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Node Options
          </div>
          <button
            className="context-menu-item"
            onClick={() => deleteNode(menu.id)}
            style={{ ...dropdownItemStyle, color: "#fca5a5" }}
          >
            Delete Node
          </button>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.12)",
              margin: "10px 0",
            }}
          />

          <div
            style={{
              color: "rgba(229,231,235,0.72)",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Accent
          </div>

          <div style={{ display: "flex", gap: 10, padding: "2px 2px 10px" }}>
            {["#60a5fa", "#a78bfa", "#34d399", "#fbbf24"].map((c) => (
              <div
                key={c}
                onClick={() => updateColor(menu.id, c)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  background: c,
                  cursor: "pointer",
                  border: "2px solid rgba(255,255,255,0.20)",
                }}
              />
            ))}
          </div>

          <button
            className="context-menu-item"
            onClick={() => updateColor(menu.id, null)}
            style={dropdownItemStyle}
          >
            Reset Color
          </button>
        </div>
      )}

      {edgeMenu && (
        <div
          style={{
            position: "fixed",
            top: edgeMenu.top,
            left: edgeMenu.left,
            zIndex: 1000,
            ...panelStyle,
            minWidth: 190,
          }}
        >
          <div
            style={{
              color: "rgba(229,231,235,0.72)",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Edge Options
          </div>
          <button
            className="context-menu-item"
            onClick={() => setEdgeLabel(edgeMenu.id)}
            style={dropdownItemStyle}
          >
            Set Label
          </button>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.12)",
              margin: "10px 0",
            }}
          />

          <div
            style={{
              color: "rgba(229,231,235,0.72)",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Path Type
          </div>

          <button
            className="context-menu-item"
            onClick={() => updateEdgeStyle(edgeMenu.id, "smoothstep")}
            style={dropdownItemStyle}
          >
            Curved
          </button>
          <button
            className="context-menu-item"
            onClick={() => updateEdgeStyle(edgeMenu.id, "straight")}
            style={dropdownItemStyle}
          >
            Straight
          </button>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.12)",
              margin: "10px 0",
            }}
          />

          <button
            className="context-menu-item"
            onClick={() => deleteEdge(edgeMenu.id)}
            style={{ ...dropdownItemStyle, color: "#fca5a5" }}
          >
            Delete Edge
          </button>
        </div>
      )}
    </div>
  );
}
