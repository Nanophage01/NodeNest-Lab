# ⚡ NodeFlow.AI

An ultra-modern, glassmorphic workflow editor built with **React Flow** and **Vite**. NodeFlow.AI provides a high-performance canvas for designing complex data structures with a sleek SaaS aesthetic.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)

## ✨ Key Features

*   **🎨 Glassmorphism UI**: High-end aesthetic with backdrop blurs, subtle transparency, and neon accents.
*   **📦 Semantic Node Shapes**:
    *   🛢️ **Database**: Cylindrical nodes for storage logic.
    *   🚀 **API Trigger**: Slanted edges for external entry points.
    *   🧠 **Logic Gate**: Diamond-shaped decision blocks.
    *   🖥️ **UI Block**: Standardized interface components.
*   **🌈 Rational Data Flow**: Connections feature a "Marching Ants" glowing animation that moves in the direction of data flow (Source → Target).
*   **🖱️ Interactive Context Menus**: Right-click nodes or edges to customize colors, set labels, or delete elements instantly.
*   **✨ Tidy Layout**: Integrated hierarchical algorithm to auto-align nodes into a clean grid.
*   **💾 State Management**: Auto-saves to `localStorage` with manual Save/Restore and JSON Export capabilities.
*   **⌨️ Power Shortcuts**: Full support for standard workflow shortcuts:
    *   `Del` / `Backspace`: Delete selected node.
    *   `Ctrl + C`: Copy node.
    *   `Ctrl + V`: Paste node.
    *   `Ctrl + D`: Duplicate node.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
*   Node.js (v18.0.0 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/reactflow-workspace.git
    cd reactflow-workspace
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file in the root directory. While the app currently uses LocalStorage, you can configure Vite specific variables here for future expansions:
    ```env
    VITE_APP_TITLE=NodeFlow.AI
    # Add future API endpoints here
    # VITE_API_URL=https://api.example.com
    ```

4.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

### Production Build

To generate a highly optimized production build:
```bash
npm run build
```
The output will be located in the `dist/` directory.

## 🛠️ Tech Stack

*   **Frontend**: React 18
*   **Orchestration**: React Flow
*   **Bundler**: Vite
*   **Styling**: Pure CSS with CSS Variables and Glassmorphism techniques.

## 🧠 Architecture Overview

*   **Custom Node Types**: Managed in `App.jsx` via the `nodeTypes` object. Each node type utilizes the `NodeShape` wrapper for distinct SVG-like geometry.
*   **Custom Edge Logic**: Uses `EdgeLabelRenderer` to create HTML-based badges with backdrop filters that SVG doesn't natively support.
*   **Dynamic Styling**: Connection lines change color in real-time during dragging (`onConnectStart`) based on the source node's semantic type (e.g., green for databases).

## 🤝 Contributing

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for the modern developer.*
