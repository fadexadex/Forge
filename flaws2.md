# Forge MCP Server Builder — UI Flaws & Improvements (v2)

> This document is based on a thorough re-read of the actual codebase after recent changes.
> Many issues from v1 (flaws.md) have been addressed. This document captures what **actually** remains.

---

## Corrections from v1

The following flaws from v1 were **incorrect** or have since been fixed:

| v1 Flaw | Status | Why |
|---------|--------|-----|
| #1 `addNode` crash (`tool` vs `item`) | **Wrong** | `addNode` in `mcpStore.js` correctly uses `item` throughout (lines 342–536). No `tool` reference. |
| #2 CanvasToolbar invisible for resources | **Not applicable** | `Canvas.jsx` routes resources to `ResourceEditor` (line 177–179), not the ReactFlow canvas. `CanvasToolbar` is intentionally tool-only. |
| #3 NDV fails for resources | **Not applicable** | `NodeDetailView.jsx` no longer exists. Resources have their own `ResourceEditor` component. |
| #4 Resources use same canvas as tools | **Fixed** | Resources now have a dedicated `ResourceEditor` component with type toggle, URI editing, MIME type, variable extraction, and content editor. |
| #5 No post-creation editing of URI/MIME | **Fixed** | `ResourceEditor` has editable URI template and MIME type fields. |
| #6 No direct vs template distinction | **Fixed** | Both `CreateResourceModal` and `ResourceEditor` have a "Static Resource" / "Resource Template" type selector. |
| #7 URI template variables not parsed | **Fixed** | `ResourceEditor` auto-extracts `{param}` variables via regex and displays them. |
| #8 No prompt message editor | **Fixed** | `PromptBuilder` has a full Messages section with role selectors (system/user/assistant), content textareas, reorder buttons, and add/remove. |
| #9 Prompt args not inline-editable | **Fixed** | `PromptBuilder` has `handleUpdateArg` — name, type, description, and required are all editable inline. |
| #10 Prompt arg types limited | **Fixed** | Both the add form and inline edit support all 5 types: string, number, boolean, array, object. |
| #13 Execute button non-functional | **Still broken** | Button was renamed to "Validate Workflow" and given a fake `alert()`. Should be "Execute" with live data flow visualization (see #13 in remaining flaws). |
| #14 No data persistence | **Wrong** | Store uses `zustand/middleware` `persist` with `name: 'mcp-builder-storage'` and `partialize` for servers. |

---

## Remaining & New Flaws

### Resource Editor Issues

#### 1. Template variables are display-only — no metadata editing
**Location:** `src/components/resources/ResourceEditor.jsx` (lines 88–111)
**Problem:** The auto-extracted URI template variables (e.g., `{city}` from `weather://forecast/{city}`) are shown as a read-only list with just the variable name and a generic "Auto-extracted from URI" label. There is no way for the user to:
- Add a **description** for each variable (e.g., "The city name to look up")
- Set a **type** (string, number, etc.)
- Mark a variable as having a **default value**
- Provide **completion hints** (the MCP spec supports parameter completion)

**Why this matters:** When this server is registered, clients calling `resources/templates/list` receive a template with variables but zero metadata about what those variables expect. LLMs and applications need descriptions and types to correctly populate template parameters.
**Proposed UI change:** Convert the variable list into an editable table with columns: Name (read-only, from URI), Type (dropdown), Description (text input), Default Value (optional input). Store this as a `variables` array on the resource object in the store.

#### 2. "Resource Template Data" content area is ambiguous
**Location:** `src/components/resources/ResourceEditor.jsx` (lines 114–130)
**Problem:** The right-column textarea is labeled "Resource Template Data" for templates and "Resource Content" for direct resources. For **direct resources**, this is clear — you enter the static content the resource returns. But for **templates**, the purpose is unclear:
- Is the user entering a response template with `{variable}` interpolation?
- Is it a code handler that computes the response?
- Is it sample/mock data?

The placeholder text says "Enter template data here. You can reference variables via interpolation if your backend runner handles it." — this pushes complexity to an undefined "backend runner" and gives the user no concrete guidance.
**Why this matters:** The MCP `resources/read` handler needs to return actual content. For templates, something needs to resolve the variables into real data. The UI doesn't make this clear.
**Proposed UI change:**
- For **direct resources**: Keep the content editor as-is. Add a "Preview" button that shows the formatted response envelope (`{ uri, mimeType, text/blob }`).
- For **templates**: Rename to "Response Handler" and offer two modes: (a) a **static template** with `{{variable}}` interpolation that gets string-replaced, or (b) a **code handler** (JavaScript function) that receives the resolved variables as arguments and returns content. Add a "Test with sample values" panel where users enter variable values and see the computed output.

#### 3. No preview of the `resources/read` response shape
**Problem:** Users building a resource have no visibility into what the MCP protocol response will actually look like. They fill in fields but can't see the complete protocol-level output that a client would receive.
**Proposed UI change:** Add a collapsible "Protocol Preview" section at the bottom of the ResourceEditor that renders the JSON response:
```json
{
  "contents": [{
    "uri": "weather://forecast/paris",
    "mimeType": "application/json",
    "text": "..."
  }]
}
```
For templates, let the user fill in sample variable values to see the resolved URI and content.

#### 4. Resource `content` field not initialized in store
**Location:** `src/stores/mcpStore.js` (line 233–260)
**Problem:** `addResource()` creates a resource with `{ name, description, uriTemplate, mimeType, resourceType, nodes, edges }` but does NOT include a `content` field. The `ResourceEditor` falls back to `resource.content || ''`, so it works — but the field is missing from the initial object. This means if code elsewhere checks for the existence of `content` (e.g., for export or validation), it will be undefined.
**Fix:** Add `content: ''` to the `newResource` object in `addResource()`.

#### 5. Resources still get unnecessary `nodes` and `edges`
**Location:** `src/stores/mcpStore.js` (line 234)
**Problem:** `addResource()` calls `createInitialNodes()` and stores `nodes` and `edges` on every resource. These are never used — `Canvas.jsx` routes resources to `ResourceEditor` instead of the ReactFlow canvas. The nodes/edges are dead data that bloats localStorage persistence.
**Fix:** Remove the `createInitialNodes()` call from `addResource()`. Remove `nodes` and `edges` from the resource data model.

---

### Prompt Builder Issues

#### 6. Messages-first layout creates a backwards authoring flow
**Location:** `src/components/prompts/PromptBuilder.jsx` (lines 103–161 Messages, lines 163–289 Arguments)
**Problem:** The Messages section is rendered ABOVE the Arguments section. When writing messages, users are told to "Use `{{arg_name}}` to interpolate arguments" — but if they start from the top (natural reading order), they're writing messages before they've defined any arguments. They have to scroll down, add arguments, scroll back up, and reference them.
**Why this is a UX problem:** The natural authoring flow is: (1) define what inputs the prompt accepts (arguments), then (2) write the messages that use those inputs. The current layout inverts this.
**Proposed UI change:** Move the Arguments section above the Messages section. Alternatively, add a sidebar or floating panel that shows the defined arguments while the user is writing messages, so they can reference argument names without scrolling.

#### 7. No validation that `{{arg_name}}` references match defined arguments
**Problem:** Users can type `{{city}}` in a message content area, but if they haven't defined a "city" argument (or they later delete it), there's no warning. The prompt template will have unresolvable references.
**Proposed UI change:** Parse message content for `{{...}}` patterns and show inline warnings for references that don't match any defined argument. Highlight valid references in a distinct color (e.g., blue pill/tag styling) and invalid ones in red.

#### 8. No prompt preview with sample values
**Problem:** Users can define arguments and write messages, but there's no way to see what the resolved prompt looks like when arguments are filled in. This is critical for verifying the prompt reads naturally with real data.
**Proposed UI change:** Add a "Preview" tab or panel that shows the messages with arguments replaced by editable sample values. E.g., if the prompt has `{{destination}}`, the preview shows an input for "destination" (pre-filled with "Barcelona") and the resolved messages below.

#### 9. The `addPrompt` store function doesn't initialize `messages`
**Location:** `src/stores/mcpStore.js` (lines 274–296)
**Problem:** `addPrompt()` creates `{ id, name, description, arguments: args }` but does NOT include a `messages` field. The `PromptBuilder` falls back to `prompt.messages || []`, so it works at runtime — but the field is absent from the initial object. Same issue as #4 for resources.
**Fix:** Add `messages: []` to the `newPrompt` object in `addPrompt()`.

---

### Sidebar & Navigation Issues

#### 10. Server does not auto-expand after creation
**Location:** `src/components/sidebar/CreateTab.jsx` (lines 20–32)
**Problem:** `expandedServers` is local React state (a `Set`). When `addServer()` is called from the modal, the new server appears in the sidebar but collapsed. The user must manually click to expand before adding items.
**Impact:** Breaks the creation flow. New users create a server and hit a dead end — no visual indication of what to do next.
**Proposed UI change:** After a server is created, auto-expand it. This requires either:
- Moving `expandedServers` into the Zustand store so `addServer` can also add the new ID to the expanded set, or
- Having `CreateTab` use a `useEffect` that watches `servers.length` and auto-expands newly added servers.

#### 11. Sidebar context menus only offer "Delete"
**Location:** `src/components/sidebar/CreateTab.jsx` (lines 333–350, 172–183)
**Problem:** Both server and item context menus only have a single "Delete" action. Missing:
- **Rename** — especially important since there's no other way to rename resources/prompts (tools can be renamed via CanvasToolbar, but resources and prompts can only edit name/description within their respective editors, not from the sidebar)
- **Duplicate** — useful for creating variations of existing items
- **Move** — for reorganizing items between servers

**Proposed UI change:** Add "Rename" and "Duplicate" to item context menus. Add "Rename" to server context menus. Consider adding "Export as JSON" for individual items.

#### 12. No way to edit server name or transport type after creation
**Problem:** Once a server is created via `CreateServerModal`, there is no UI to change its name or transport type. The sidebar shows the name and transport badge, but they're not clickable or editable. The store has no `updateServer` function.
**Proposed UI change:** Add a server settings panel or make the name/transport editable inline in the sidebar (click to edit). Add an `updateServer(serverId, updates)` action to the store.

---

### Tool Canvas Issues

#### 13. Button says "Validate Workflow" — should be "Execute" with live data flow visualization
**Location:** `src/components/layout/CanvasToolbar.jsx` (lines 115–135)
**Problem:** The button is labeled "Validate Workflow" and just calls `alert(...)`. This is wrong on two levels:
1. **Wrong label:** The user expects an **"Execute"** button, not a "Validate" button. The purpose of this button is to run the workflow and show data flowing through the pipeline — not to statically lint it.
2. **No execution or visualization:** Clicking should trigger a live execution of the tool's node pipeline, similar to n8n's workflow execution UX (see reference screenshot). The current implementation does nothing useful.

**What "Execute" should do — the full UX:**

1. **Trigger phase:** User clicks "Execute" (bottom-center of canvas). If the Input node has required parameters, a small modal/drawer appears asking the user to fill in sample input values (e.g., `city: "Barcelona"`, `date: "2024-06-15"`). If no required params, execution starts immediately.

2. **Visual flow animation:** As the workflow executes, data flows visually through the graph:
   - The **currently executing node** gets a highlighted border (e.g., pulsing green outline) and a small spinner/loading indicator.
   - **Completed nodes** show a green checkmark badge on the top-right corner, plus a small data count label on the outgoing edge (e.g., "1 item", "3 items") showing how many data items passed through.
   - **Failed nodes** show a red error badge with an X icon. The edge leading out is dimmed or dashed to show the pipeline stopped there.
   - **Pending nodes** (not yet reached) remain in their default gray/neutral state.
   - Edges animate in sequence — a subtle pulse or color sweep travels along each edge as data moves from source to target, making the execution order visually obvious.

3. **Execution log panel (bottom-right):** A collapsible panel appears in the bottom-right corner of the canvas showing a real-time execution log:
   - Each row shows: timestamp, node name, status (running/success/error), and duration (e.g., "143ms").
   - Clicking a row in the log selects that node on the canvas and opens its NDV to the Output tab showing the actual data that node produced.
   - The panel has a header showing overall status: "Execution completed in 1.2s" or "Execution failed at HTTP Request node."
   - The panel can be collapsed to a minimal bar showing just the status, or expanded to see full details.

4. **Per-node data inspection:** After execution completes, clicking any completed node opens its NDV with the Input tab showing what data it received and the Output tab showing what it produced. This data should persist until the next execution or until cleared.

5. **Error handling:** If a node fails (e.g., an HTTP Request returns a 500, or a Code node throws), the execution stops at that node, the error badge appears, and the log panel auto-expands to show the error details. The user can fix the node config and re-execute.

**Store changes needed:**
- Add `executionState` to the store: `{ status: 'idle' | 'running' | 'completed' | 'failed', nodeStates: { [nodeId]: { status, input, output, error, duration } }, startTime, endTime }`
- Add `executeWorkflow()` action that walks the node graph from Input to Output, executing each node in sequence
- The existing `nodeExecutionData` field in the store (currently unused) should be repurposed for this

**Proposed UI components:**
- `ExecutionLogPanel` — bottom-right floating panel with execution timeline
- Node status overlays (checkmark/error/spinner badges) as part of each custom node component
- Edge data count labels as part of `CustomEdge`
- Input values modal/drawer for providing sample execution data

#### 14. Tool Input node parameters don't generate a JSON Schema
**Problem:** The Input node lets users define parameters with name, type, description, and required — but there's no display or export of the resulting JSON Schema that MCP `tools/list` would return as `inputSchema`. Users building a tool can't see what schema clients will receive.
**Proposed UI change:** Add a "Schema Preview" collapsible below the Input node parameters panel (or in the NDV) that shows the generated JSON Schema in real-time:
```json
{
  "type": "object",
  "properties": {
    "city": { "type": "string", "description": "City name" }
  },
  "required": ["city"]
}
```

---

### Cross-Cutting UX Issues

#### 15. Test tab is disconnected from the builder
**Problem:** The Test tab connects to external live MCP servers (via SSE/HTTP). You cannot test the tools, resources, or prompts you're currently building. The two halves of the app are independent.
**Impact:** Users have to mentally map between "what I'm building" and "what I can test." There's no feedback loop.
**Proposed UI change:** Add a "Preview" or "Dry Run" option within the Create tab that simulates the currently-selected tool/resource/prompt:
- **Tools:** Enter sample input values, trace through the node pipeline, show output
- **Resources:** Enter variable values (for templates), show the resolved content
- **Prompts:** Fill in argument values, show the resolved messages

This is different from the Test tab (which tests external servers). This would be an inline testing capability for the items being built.

#### 16. No form validation on creation modals
**Problem:** Creation modals only check if the name is non-empty. There's no validation for:
- **Duplicate names** within a server (two tools named "get_forecast" would be confusing and potentially break MCP clients)
- **Invalid characters** in names (MCP names should be identifier-safe — no spaces, special chars)
- **Invalid URI syntax** in the resource URI template field
- **Empty URI** for direct resources (currently required even though a direct resource could have its URI auto-generated)
**Proposed UI change:** Add inline validation with error messages below fields. Prevent submission when validation fails. For names, enforce `[a-zA-Z0-9_-]+` pattern and check uniqueness within the server.

#### 17. Name and description are not editable from the `ResourceEditor` or `PromptBuilder` headers
**Location:** `ResourceEditor.jsx` line 36, `PromptBuilder.jsx` line 86
**Problem:** Both editors display the item name in the header bar as static text (`{resource.name}`, `{prompt.name}`). The description is shown as static paragraph text below the "Configuration" heading. Unlike the tool canvas (where `CanvasToolbar` makes name/description click-to-edit), resource and prompt names/descriptions require the user to... well, there's no direct way to edit them without going through the store manually.

Actually — the `ResourceEditor` lets you change URI, MIME type, and content, but NOT the name or description. `PromptBuilder` similarly doesn't expose name/description editing.

**Proposed UI change:** Make the name in the header bar click-to-edit (same pattern as `CanvasToolbar`). Make the description paragraph click-to-edit as well. These editors should offer the same inline editing affordance that tools get on their canvas.

---

## Summary Priority Matrix

| Priority | Issue | Category |
|----------|-------|----------|
| **P0 — Blocker** | #6 Messages-before-arguments layout | UX design flaw |
| **P1 — High** | #1 Template variables have no metadata | Missing feature |
| **P1 — High** | #2 Template content area is ambiguous | UX clarity |
| **P1 — High** | #10 Server doesn't auto-expand | UX flow break |
| **P0 — Blocker** | #13 Execute button with live data flow visualization | Core missing feature |
| **P1 — High** | #17 Name/description not editable in resource/prompt editors | Missing feature |
| **P2 — Medium** | #3 No protocol response preview | Missing feature |
| **P2 — Medium** | #5 Dead nodes/edges on resources | Data model cleanup |
| **P2 — Medium** | #7 No arg reference validation in messages | Missing validation |
| **P2 — Medium** | #8 No prompt preview with sample values | Missing feature |
| **P2 — Medium** | #11 Sidebar menus lack rename/duplicate | UX gap |
| **P2 — Medium** | #12 No server editing after creation | Missing feature |
| **P2 — Medium** | #14 No JSON Schema preview for tools | Missing feature |
| **P2 — Medium** | #15 Test tab disconnected from builder | Design gap |
| **P3 — Low** | #4 Resource `content` not initialized in store | Data consistency |
| **P3 — Low** | #9 Prompt `messages` not initialized in store | Data consistency |
| **P3 — Low** | #16 No form validation on creation modals | Missing validation |
