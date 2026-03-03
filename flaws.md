# Forge MCP Server Builder — UI Flaws & Improvement Proposals

## Critical Bugs (Will Break at Runtime)

### 1. `addNode` crashes with `ReferenceError: tool is not defined`
**Location:** `src/stores/mcpStore.js` (~lines 354–505)
**Problem:** The `addNode` function retrieves the selected item into a variable called `item`, but all subsequent code references `tool.nodes`, `tool.edges`, `tool.nodes.find(...)`, etc. The variable `tool` is never declared in that scope.
**Impact:** Every attempt to add a node to the canvas (via the "+" button on edges or node handles) will crash with a ReferenceError. This means the entire node-based workflow builder is non-functional beyond the initial Input→Output pair.
**Fix:** Replace all references to `tool` with `item` inside `addNode`.

### 2. `CanvasToolbar` is invisible for Resources
**Location:** `src/components/layout/Canvas.jsx` (CanvasToolbar)
**Problem:** `CanvasToolbar` calls `getSelectedTool()` which explicitly checks `selectedItemType !== 'tool'` and returns `null` for resources. When a resource is selected, the toolbar renders nothing.
**Impact:** Resource canvases have no inline name/description editing, no Execute button, and no header context at all. The user sees a bare canvas with Input→Output nodes and no way to know what resource they're editing.
**Fix:** Change `getSelectedTool()` to `getSelectedItem()` in `CanvasToolbar`, or create a dedicated resource toolbar that also surfaces URI template and MIME type fields.

### 3. `NodeDetailView` fails for Resources
**Location:** `src/components/modals/NodeDetailView.jsx`
**Problem:** Same issue as #2 — it calls `getSelectedTool()` to find the node to display. When a resource is selected, `tool` is `null`, so `node` is `undefined`, and the NDV panel renders nothing.
**Impact:** Clicking any node on a resource's canvas opens an empty detail panel. Users cannot configure Input parameters, Output return paths, or any intermediate node for resources. The resource workflow builder is completely broken.
**Fix:** Change to `getSelectedItem()`.

---

## Resource Implementation Flaws

### 4. Resources use the same workflow canvas as Tools — conceptually wrong
**Problem:** The MCP spec defines resources as *passive data sources* that provide read-only access to information. They are fundamentally different from tools (which are active functions). Yet in Forge, resources get the exact same Input→Output node-based workflow canvas that tools get. This implies resources have executable logic pipelines, which contradicts the spec.
**Why this won't work technically:** An MCP resource responds to `resources/read` with data + metadata. It doesn't have an "execution flow" like a tool does. A resource either:
- Returns static content (a direct resource like `file:///docs/readme.md`), or
- Returns dynamically computed content based on URI template variables (like `weather://forecast/{city}`)

In either case, the authoring UX should be about *defining the data shape and source*, not building a multi-step processing pipeline.
**Proposed UI change:** Replace the workflow canvas for resources with a dedicated **Resource Editor** panel (similar to how prompts get `PromptBuilder` instead of the canvas). This editor should have:
- Resource type toggle: **Direct Resource** vs **Resource Template**
- For Direct: a URI field, MIME type selector, and a content editor (text/JSON/markdown based on MIME type)
- For Template: a URI template field with automatic variable extraction (parse `{city}` from `weather://forecast/{city}`), MIME type, and a content/handler definition area
- A preview section showing what the `resources/read` response would look like

### 5. No post-creation editing of URI template or MIME type
**Problem:** `uriTemplate` and `mimeType` are only settable in the `CreateResourceModal`. Once a resource is created, there is no UI anywhere to change these values. The canvas toolbar doesn't render for resources (bug #2), and even if it did, it has no fields for these resource-specific properties.
**Impact:** If a user makes a typo in the URI template or wants to change the MIME type, they must delete and recreate the resource.
**Proposed UI change:** The Resource Editor (proposed in #4) should have always-visible, editable fields for URI template and MIME type. If staying with the canvas approach, at minimum add these fields to the toolbar header.

### 6. No distinction between Direct Resources and Resource Templates
**Problem:** The MCP spec clearly distinguishes between direct resources (fixed URIs pointing to specific data, discovered via `resources/list`) and resource templates (parameterized URIs for flexible queries, discovered via `resources/templates/list`). The current UI makes no distinction — everything is treated as a URI template.
**Why this matters technically:** These are exposed through different protocol operations. A server that conflates them will either:
- Register all resources as templates (breaking clients that only check `resources/list`), or
- Register all as direct (breaking parameterized access via `resources/templates/list`)

**Proposed UI change:** Add a resource type selector in the creation modal and the editor: "Static Resource" vs "Resource Template". Static resources get a simple URI + content editor. Templates get the URI template field with variable extraction + handler logic.

### 7. URI template variables are not parsed or used
**Problem:** When a user enters `weather://forecast/{city}` as a URI template, the `{city}` variable is stored as raw text but never parsed. The Input node's parameters are not auto-populated from the template variables, creating a disconnect between the URI template definition and the input parameters.
**Impact:** Even within the current (flawed) canvas-based model, the Input node should at minimum reflect the variables defined in the URI template. Without this, there's no link between the URI a client would call and the data the resource workflow receives.
**Proposed UI change:** Auto-extract variables from the URI template (regex: `\{(\w+)\}`) and either:
- Auto-create corresponding Input parameters, or
- Display them as a read-only list with type annotations the user can configure

---

## Prompt Implementation Flaws

### 8. No prompt template/message content editor — the most critical missing piece
**Problem:** The `PromptBuilder` component manages prompt arguments (name, type, description, required) but has absolutely no UI for the actual prompt text/messages. The MCP spec's `prompts/get` returns `messages` — an array of role+content pairs that form the actual template the model receives. The data model in the store (`{ id, name, description, arguments[] }`) has no `template`, `messages`, or `content` field.
**Why this is a showstopper:** Without the message content, a prompt is just metadata with no substance. It's like defining a function's parameter list but never writing the function body. The server would respond to `prompts/get` with an empty messages array.
**Proposed UI change:** Add a **Prompt Message Editor** section below the arguments in `PromptBuilder`:
- A list of message blocks, each with a role selector (user/assistant/system) and a rich text area
- Support for `{{argument_name}}` variable interpolation with syntax highlighting
- A preview panel showing the resolved prompt with sample argument values
- Ability to reorder, add, and remove message blocks

### 9. Prompt arguments lack editing — delete and recreate only
**Problem:** Once an argument is added to a prompt, the only way to modify it is to delete it and add a new one. There's no inline editing of existing arguments' names, types, descriptions, or required status.
**Impact:** Tedious workflow for iterating on prompt design. Users will frequently need to adjust argument types or descriptions as they refine their prompts.
**Proposed UI change:** Make each argument row inline-editable. Click on any field to edit it in place, with the same input types used in the "Add New Argument" form.

### 10. Prompt argument types are unnecessarily limited
**Problem:** Prompt arguments only support `string`, `number`, `boolean`. Tool parameters additionally support `array` and `object`. The MCP spec's prompt arguments can accept complex types.
**Proposed UI change:** Align prompt argument types with tool parameter types. Add `array` and `object` to the type dropdown.

---

## General UX Issues

### 11. Server does not auto-expand after creation
**Problem:** When a user creates a new server via the modal, the server appears in the sidebar but collapsed. The user must manually click to expand it before they can add tools, resources, or prompts.
**Impact:** Breaks the creation flow. A new user creates a server, expects to immediately start adding items, but sees a collapsed entry with no obvious next step.
**Proposed UI change:** Auto-expand the server in the sidebar after creation. Better yet, auto-expand and show a contextual prompt or highlight the "+" buttons to guide the user to add their first tool/resource/prompt.

### 12. No rename/edit action in sidebar context menu
**Problem:** The three-dot menu on sidebar items (tools, resources, prompts) only offers "Delete". There's no way to rename an item from the sidebar.
**Impact:** To rename, users must either use the canvas toolbar (which only works for tools due to bug #2) or have no option at all (for resources and prompts from the sidebar).
**Proposed UI change:** Add "Rename" and "Duplicate" options to the three-dot context menu.

### 13. Execute button is completely non-functional
**Problem:** The "Execute" button in `CanvasToolbar` has no `onClick` handler. It renders but does nothing when clicked.
**Impact:** Misleading — suggests functionality that doesn't exist. Users will click it expecting their tool/resource workflow to run.
**Proposed UI change:** Either implement execution logic (even if just a dry-run/validation mode) or remove the button until it's functional. A middle ground: make it trigger a "validate workflow" check that ensures all nodes are properly configured and connected.

### 14. No data persistence
**Problem:** The Zustand store has no persistence middleware. All servers, tools, resources, and prompts are lost on page refresh.
**Impact:** Makes the app unusable for any real work. Users will lose everything if they accidentally refresh or close the tab.
**Proposed UI change:** Add `zustand/middleware` persistence to `localStorage` as an immediate fix. Longer term, add export/import functionality (JSON) and optional backend persistence.

### 15. No validation or error feedback on forms
**Problem:** The creation modals have minimal validation (just checking if name is non-empty). There's no feedback for:
- Duplicate names within a server
- Invalid URI template syntax
- Missing required fields with visual indicators
- Character restrictions on names (MCP names should be identifier-safe)
**Proposed UI change:** Add inline validation with error messages. Highlight invalid fields. Prevent submission with clear error states.

### 16. No visual distinction between item types on canvas
**Problem:** When switching between a tool and a resource in the sidebar, the canvas looks identical (same Input→Output layout, same node types available). There's no visual cue telling the user "you're editing a resource" vs "you're editing a tool".
**Proposed UI change:** Add a context banner or badge at the top of the canvas indicating the item type. Use different accent colors for tool canvases vs resource canvases. Better yet, give resources their own editor (see #4).

### 17. Test tab is disconnected from the builder
**Problem:** The Test tab connects to external live MCP servers (via SSE/HTTP) and is completely independent of the builder's state. You cannot test the tools/resources/prompts you're building — only external servers.
**Impact:** The two halves of the app don't talk to each other. A user building a weather-mcp server can't test their `get_forecast` tool without deploying it first.
**Proposed UI change:** Add a "Preview/Test" mode that simulates the server you're building. For tools, this would accept sample inputs and walk through the node pipeline. For resources, it would show the resolved output for a given URI. For prompts, it would show the rendered message with sample arguments.

---

## Summary Priority Matrix

| Priority | Issue | Category |
|----------|-------|----------|
| P0 - Blocker | #1 `addNode` crash | Bug |
| P0 - Blocker | #2 Canvas toolbar invisible for resources | Bug |
| P0 - Blocker | #3 NDV broken for resources | Bug |
| P0 - Blocker | #8 No prompt message content editor | Missing feature |
| P1 - High | #4 Resources shouldn't use workflow canvas | Design flaw |
| P1 - High | #5 No editing of URI/MIME after creation | Missing feature |
| P1 - High | #6 No direct vs template resource distinction | Design flaw |
| P1 - High | #14 No data persistence | Missing feature |
| P2 - Medium | #7 URI template variables not parsed | Missing feature |
| P2 - Medium | #9 Prompt args not inline-editable | UX issue |
| P2 - Medium | #11 Server not auto-expanded | UX issue |
| P2 - Medium | #13 Execute button non-functional | UX issue |
| P2 - Medium | #17 Test tab disconnected from builder | Design gap |
| P3 - Low | #10 Prompt arg types limited | Parity issue |
| P3 - Low | #12 No rename in sidebar | UX issue |
| P3 - Low | #15 No form validation | UX issue |
| P3 - Low | #16 No visual distinction on canvas | UX issue |
