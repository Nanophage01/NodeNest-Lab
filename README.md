# NodeFlow.AI

A specialized workflow editor implementation using **React Flow** and **Vite**. This project focuses on custom node geometry, glassmorphic UI components, and directional data-flow visualization.

## Technical Highlights

- **Custom Geometry**: Implementation of non-rectangular node shapes (Cylindrical Databases, Diamond Logic Gates) using CSS `clip-path` and transformations.
- **Directional Edge Logic**: SVG `stroke-dashoffset` animations calibrated to move from Source to Target, providing visual confirmation of data direction.
- **Handle Collision Fix**: Resolved React Flow port ambiguity by assigning unique identifiers to cardinal handles (`top-t`, `bottom-s`, etc.).
- **Hybrid Rendering**: Combines SVG canvas for paths with `EdgeLabelRenderer` (HTML) to enable hardware-accelerated backdrop filters on edge labels.
- **State Persistence**: Syncs graph state to `localStorage` on every change with JSON export/import support.

## Tech Stack

- **React 18** (Functional components / Hooks)
- **React Flow** (Core engine)
- **Vite** (Build tool)
- **CSS Modules** (Glassmorphism & Keyframe animations)

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Del` / `Backspace` | Remove selected node |
| `Ctrl + C` | Copy node to internal clipboard |
| `Ctrl + V` | Paste node from clipboard |
| `Ctrl + D` | Duplicate selected node |

## Development

### Installation
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Implementation Details

### Custom Node Shapes
Node geometry is handled by the `NodeShape` component which wraps `CustomNode`. Logic gates use a 45-degree rotation with an inverse rotation on the content to maintain legibility.

### Semantic Connections
Edge colors are derived dynamically during the `onConnect` callback based on node types:
- **Database**: `#10b981` (Emerald)
- **API**: `#f59e0b` (Amber)
- **Default**: `#00bcd4` (Cyan)

### Auto-Layout (Tidy)
The "Tidy Layout" uses a custom Breadth-First Search (BFS) algorithm to calculate node hierarchy levels based on `in-degree` counts, positioning them horizontally by level and vertically by sibling index.

## License
MIT
