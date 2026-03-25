# Development & Testing Plan: Forge MCP Server Builder UI

This plan outlines the steps to address the remaining UI/UX flaws (to ensure the new features smoothly blend into the existing workflow), introduce the missing Chat, Log Bus, and MCP Apps features using mock data for the proof of concept, and detail the Playwright-based testing strategy.

## Phase 1: UI & UX Refinements ("Smoothly blending into the workflow")

Based on the feature requirements and reference designs, we will implement the following UI updates.

### 1. Visual Workflow Builder & Execution (P0)
- **Interactive Execution:** Replace the "Validate Workflow" button with an "Execute" button. Open a drawer/modal to capture sample inputs if required.
- **Live Data Flow:** Add a `nodeStates` map to `mcpStore`. Animate edges and display loading spinners, green checkmarks, or red error badges on individual nodes.
- **Node Detail Output:** Ensure clicking a completed node populates its NDV (Node Detail View) with both the incoming and outgoing data payloads.

### 2. Prompt Builder Ergonomics (P0/P1)
- **Natural Authoring Flow:** Reorder the Prompt Builder so that **Arguments** appear *above* **Messages**.
- **Reference Validation:** Highlight `{{argument_name}}` references inside the message editor (blue if valid, red warning if invalid).
- **Inline Editing:** Allow Prompt name and description to be edited directly in the header.

### 3. Resource Editor Enhancements (P1)
- **Variable Metadata:** Convert the read-only URI template variables list into an editable table (Type, Description, Default Value).
- **Template Clarity:** Differentiate between a static JSON response and a dynamic code handler. Add a "Preview" pane to simulate the JSON-RPC `resources/read` response.

### 4. Sidebar & Global UX (P1)
- **Auto-expansion:** Update the sidebar so new server folders automatically expand.
- **Context Menus:** Add "Rename" and "Duplicate" options to the sidebar items.

### 5. Test Tab: Agentic Chat UI & Log Bus (New - Deliverables 6 & 7)
- **Chat Interface:** Build a dedicated chat view. Include empty-state suggestions (e.g., "Show me connected tools", "Suggest an automation").
- **Tool Execution Blocks:** When the mock AI calls a tool, display it as a collapsible block within the chat stream.
  - **Input & Output Display:** When expanded, display the tool's `INPUT` and `RESULT` in dedicated, nicely formatted JSON viewers (matching the reference images).
  - Use mock data to simulate a multi-turn conversation (e.g., checking an account balance, showing the sequence of tool calls, and rendering the final natural language response).
- **Real-Time Log Bus:** Create a right-hand sidebar panel to display a live stream of JSON-RPC traffic (e.g., `req -> tools/list`, `<- res result`, `error`). This will be populated with mock data as the user interacts with the chat and tools.

### 6. Test Tab: MCP Apps Widget Demo (New - Deliverable 8)
- **MCP Apps Sandbox:** Add a dedicated view to demo MCP Apps (SEP-1865 widgets).
- **Mock Widget Rendering:** Render a sample interactive widget (e.g., a dashboard card or interactive form) inside an iframe to demonstrate how a tool result can return a custom UI.
- **Unified Logging:** Show mock `postMessage` traffic between the widget and the host application in the Log Bus to illustrate the JSON-RPC bridge in action.

---

## Phase 2: End-to-End Playwright Testing Strategy

Once the UI updates are applied, we will run Playwright tests against the local server.

### Flow 1: Complete Tool Creation & Execution 
1. **Action:** Click "Create Server", input "Weather-API", select HTTP transport.
2. **Action:** Add a Tool named "get_forecast". Configure the Input Node and add HTTP/Transform nodes.
3. **Action:** Click "Execute", provide a sample `city` value. Verify the visual success states on the nodes.

### Flow 2: Prompt and Resource Lifecycle
1. **Action:** Add a Prompt to the server. Add an argument `destination`.
2. **Action:** Type a message `Tell me about {{destination}}`. Verify the syntax validation.
3. **Action:** Add a Resource Template. Enter URI `weather/{city}`. Verify that `city` is extracted into the metadata table.

### Flow 3: Agentic Chat & Tool Blocks
1. **Action:** Navigate to the "Test" -> "Chat" tab.
2. **Action:** Click a suggestion like "Check my balance".
3. **Action:** Verify the mock AI responds and renders a collapsible tool call block.
4. **Action:** Expand the block to verify the `INPUT` and `RESULT` JSON viewers render correctly.
5. **Action:** Verify the Log Bus on the right updates with mock `req` and `res` entries.

### Flow 4: MCP Apps Rendering
1. **Action:** Navigate to the "Test" -> "App Builder" / "MCP Apps" view.
2. **Action:** Trigger the mock widget display.
3. **Action:** Verify the iframe renders the mock UI and check the Log Bus for the simulated `postMessage` events.

## Execution Steps for the AI
1. Receive approval on this plan.
2. Implement Phase 1 changes iteratively, prioritizing the Chat UI, Tool Input/Output blocks, and the Log Bus using mock data to ensure a high-quality demo.
3. Start the dev server in the background (`npm run dev &`).
4. Initialize the Playwright tool integration to execute Phase 2 flows.
5. Report the test results and finalize any UI polishes.
