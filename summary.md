# MCP Forge Redesign Summary

## Overview

Complete redesign of the MCP Forge application from a 1500+ line monolithic file to a clean, modular architecture with a Vercel-inspired white theme.

## Key Changes

### Architecture
- **Before:** Single `App.jsx` file (1515 lines) with dark glassmorphism theme
- **After:** 25 modular files with clear separation of concerns

### Design System
- **Theme:** Pure white, minimal Vercel-style interface
- **Typography:** Inter for UI, JetBrains Mono for code
- **Styling:** Tailwind CSS v4 with custom theme variables
- **Principles:** Subtle borders, generous whitespace, monochrome icons

### State Management
- Replaced local React state with **Zustand** store
- Centralized state for servers, tools, nodes, edges, and UI modals

### Visual Workflow
- Integrated **React Flow** for node-based editing
- Tools are now visual workflows with internal nodes
- Drag-and-drop node positioning with edge connections

## New File Structure

```
src/
├── App.jsx                           # Main layout shell (25 lines)
├── index.css                         # Tailwind v4 + custom styles
├── main.jsx                          # Entry point (unchanged)
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx                # Breadcrumb navigation + Run button
│   │   ├── Sidebar.jsx               # Create/Test tab container
│   │   ├── Canvas.jsx                # React Flow wrapper
│   │   └── CanvasToolbar.jsx         # Tool info + Add Node button
│   │
│   ├── sidebar/
│   │   ├── CreateTab.jsx             # Server/tool tree with CRUD
│   │   └── TestTab.jsx               # Tool testing interface
│   │
│   ├── modals/
│   │   ├── Modal.jsx                 # Base modal component
│   │   ├── CreateServerModal.jsx     # Server creation (name + transport)
│   │   ├── CreateToolModal.jsx       # Tool creation (name + description)
│   │   └── AddNodePicker.jsx         # Node type selector
│   │
│   ├── nodes/
│   │   ├── InputNode.jsx             # Entry point with parameters
│   │   ├── ApiCallNode.jsx           # HTTP request configuration
│   │   ├── TransformNode.jsx         # Data path expression
│   │   ├── ConditionNode.jsx         # If/else branching
│   │   ├── OutputNode.jsx            # Return value mapping
│   │   └── CustomEdge.jsx            # Styled edge connector
│   │
│   ├── ui/
│   │   ├── Button.jsx                # Variant-based button
│   │   ├── Input.jsx                 # Labeled input field
│   │   ├── Select.jsx                # Dropdown select
│   │   └── Card.jsx                  # Container components
│   │
│   └── onboarding/
│       └── FirstNodePrompt.jsx       # Empty canvas guidance
│
├── stores/
│   └── mcpStore.js                   # Zustand state store
│
└── utils/
    └── constants.js                  # Node types, param types, HTTP methods
```

## Dependencies Added

```json
{
  "reactflow": "^11.x",
  "zustand": "^4.x",
  "@tailwindcss/postcss": "^4.x"
}
```

## Data Model

### Server
```javascript
{
  id: string,
  name: string,
  transport: 'stdio' | 'http',
  tools: Tool[]
}
```

### Tool
```javascript
{
  id: string,
  name: string,
  description: string,
  nodes: WorkflowNode[],
  edges: Edge[]
}
```

### Workflow Node Types
| Type | Purpose |
|------|---------|
| `input` | Entry point - defines tool parameters |
| `apiCall` | HTTP requests to external APIs |
| `transform` | Data path/expression mapping |
| `condition` | If/else branching with two outputs |
| `output` | Return value to caller |

## Features

### Implemented
- Pure white minimal UI
- Create/Test sidebar tabs
- Collapsible server/tool tree
- Server CRUD (create, delete)
- Tool CRUD (create, delete)
- Visual workflow canvas with React Flow
- Draggable workflow nodes
- Node connections (edges)
- Add Node picker modal
- Input node with parameter management
- API Call node with method/URL config
- Transform node with expression input
- Condition node with true/false outputs
- Output node with return path
- First-time onboarding prompt
- Tool testing interface (basic)

### Deferred
- Code generation (Python/TypeScript)
- Resources and Prompts (tools only for now)
- Actual workflow execution
- Persistence/export

## Usage

1. **Create Server:** Click "+" next to Servers → Enter name, select transport
2. **Create Tool:** Expand server → Click "Add tool" → Enter name, description
3. **Build Workflow:** Tool opens with Input + Output nodes → Click "Add Node" → Connect nodes
4. **Test Tool:** Switch to Test tab → Select tool → Fill inputs → Run

## Running

```bash
npm run dev
# Opens at http://localhost:5173
```
