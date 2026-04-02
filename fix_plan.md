# Plan to fix the Sales Visualization Issue

## Root Cause Analysis
The issue stems from how the LLM interacts with the visualization UI (`sales-visualization.ts`) and the strict tool schema, leading to hallucinated data:

1. **LLM Hallucination ("Hardcoded visuals")**: The `visualize-sales-data` tool requires a massive `report` object. LLMs struggle to output this accurately, so they hallucinate or truncate the data in their tool call arguments. The client immediately sends this hallucinated data to the UI via `ui/notifications/tool-input`.
2. **Immediate Rendering**: Because `sales-visualization.ts` blindly trusts the `report` object it receives from `tool-input`, it renders the hallucinated data instantly. This makes the visuals look "hardcoded" or fake.
3. **No Server Logs**: When the MCP client forwards the LLM's hallucinated tool call to the server, the invalid `report` object fails Zod schema validation. The tool handler is never executed, which is why the server never logs the tool execution, and you only see the `resources/read` log for the UI itself.

## Proposed Fix
Since modifying the tool definition (`index.ts`) is not allowed, we must fix the "actual app" (the UI in `sales-visualization.ts`). 

We will update `src/ui/sales-visualization.ts` so that it **fetches the real data itself** instead of trusting the LLM's potentially hallucinated `report`.

### Changes in `src/ui/sales-visualization.ts`:
1. Modify the `message` event listener that handles `ui/notifications/tool-input`.
2. Extract the `selections` object (which the LLM usually gets right since it's small) from the tool input.
3. Instead of using the LLM's `report` data, use the `request()` function to call the `get-sales-data` tool directly from the UI, passing the `selections`.
4. When `get-sales-data` returns the real `structuredContent`, assign it to `reportData` and call `renderDashboard()`.

**Why this works:**
- It bypasses the LLM's hallucinations, ensuring the UI always displays accurate, real-time data.
- The UI takes a moment to fetch the data, fixing the "shows almost immediately" symptom with real loading behavior.
- Calling `get-sales-data` from the UI will successfully hit the MCP server, producing the expected server logs (`🔧 [get-sales-data] metric=...`), confirming that the backend is working.