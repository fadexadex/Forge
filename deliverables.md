### Deliverables

1. **Workflow Execution Engine & Node Registry:** The backend runtime that interprets node graphs at runtime — handling topological sorting, a shared execution context, per-node timeouts, conditional branching, and variable interpolation. This powers both the canvas preview and the in-memory test server.

2. **Visual Workflow Builder (Create Tab):** A React Flow-based canvas where developers visually compose tool logic by placing and connecting typed nodes (Input, HTTP Request, Transform, Conditional, Code, Output), with configuration panels for each node driven by its config schema.

3. **Server & Component Management:** The complete server lifecycle UI — creating named MCP servers with transport selection, and adding Resources and Prompts via form-based configuration panels that require no workflow.

4. **Workflow Preview & Real-Time Debug Panel:** An in-canvas execution mode that streams step-level results to the browser over WebSocket, rendering a live timeline with per-node input/output, timing, and error traces alongside visual node state feedback on the canvas.

5. **Manifest System & TypeScript Code Generation Pipeline:** A portable `mcp-builder.manifest.json` format that captures the full workflow graph and enables re-import, paired with a code generator that produces a validated, deployable TypeScript MCP server packaged as a ZIP.

6. **Test Tab — Server Connection, Discovery & Primitive Testing:** A server management layer that connects to both builder-created servers (via `InMemoryTransport`) and external MCP servers (via STDIO/HTTP proxy), performs full tool/resource/prompt discovery, provides a dynamic form-based testing interface driven by each tool's `inputSchema`, and streams a live JSON-RPC traffic log over SSE.

7. **Test Tab — Agentic Chat Testing:** A chat interface within the Test tab that wires the connected server's discovered tools directly to an LLM via the Vercel AI SDK, so developers can test how a model reasons about and invokes their tools in real multi-turn conversations.

8. **MCP Apps Testing Tab:** A dedicated sandbox for testing MCP Apps (SEP-1865 widgets) — fetches widget HTML from the server, renders it in a CSP-enforced `srcdoc` iframe, and establishes a JSON-RPC bridge over `postMessage` that proxies widget tool calls back through the connected MCP server, with all traffic surfaced in the unified log view.

---

### Technical Details

---

#### System Overview

The application is a full-stack web app with a React frontend and an Express.js backend. All MCP protocol operations — running workflows, connecting to external servers, and hosting in-memory builder servers — happen on the backend. The browser never speaks MCP directly.

[![](https://mermaid.ink/img/pako:eNp9k01z2jAQhv-KRscGAibBBB86DY4nZSY0TKwpmZgehL0xCrbkkWQCDfnvXdshdTlUJ2n97L775TcaqwSoR1PNizVhN0tJ8Jhy1RgmWr0a0CQ6XrrkAXhsyRn5KSz8avDq-CzyNXALhPEVYgulN8-ZeiU-l1tuWiRjEQNjP7i5FrmwYot-aBQyxdD-mtuWwzWLZv6cXBeFOQYXSQqWhFwmK7X7QEEmS3maP483aCdRsCs0GHP-Yo62lsAiiD7TDWQqJKDGD2wMFpsKY_Uek3oopQTd8pr5syovPxMg7YxLntb9-ZbHxQvPeybZtOCHu0mki_hOpZPSIBWGAQm26Ejw3W7jbeRXwreAYtyqKiLbFxDGWhRV25-m8__U6ytMMrZCSUPqprUMLZXpLJrKGeRK75nm0hRKWxSalCJLsIgQ9BZ02yF4jEJ2M70nPfKdsTmywc6Cljw7gVtJ-Yx0u18P8_uQkR4vRA92EJe4IGdkERKoijcH7H1Ds1Pa4jr0vhyqNjfEdUMUytgZjhLbTVa6WoQDOh9FF0ENKRlaKEjMs2yF4z5U_W8ADFcTzTCqkZ1ADYbXGqvm9DcddOriOgDPG81mYjWIcyGJepWZ4skBaz8G-tDDlv_7Dh7bCeNn2sGfUCTUs7qEDs1B57x60rcKXFK7hhyW1MNrwvVmSZfyHX0KLp-Uyo9uWpXpmnrPPDP4KosE_8gbwXE78k-rxiGB9lUpLfUuLpw6CPXe6I56l8Nzd-AOhs5g0B_1L5zBsEP31HP643PXHV9euePxeOg4o8F7h_6udfvnY9e5HLmOO0L8aui8_wFr_lRN?type=png)](https://mermaid.live/edit#pako:eNp9k01z2jAQhv-KRscGAibBBB86DY4nZSY0TKwpmZgehL0xCrbkkWQCDfnvXdshdTlUJ2n97L775TcaqwSoR1PNizVhN0tJ8Jhy1RgmWr0a0CQ6XrrkAXhsyRn5KSz8avDq-CzyNXALhPEVYgulN8-ZeiU-l1tuWiRjEQNjP7i5FrmwYot-aBQyxdD-mtuWwzWLZv6cXBeFOQYXSQqWhFwmK7X7QEEmS3maP483aCdRsCs0GHP-Yo62lsAiiD7TDWQqJKDGD2wMFpsKY_Uek3oopQTd8pr5syovPxMg7YxLntb9-ZbHxQvPeybZtOCHu0mki_hOpZPSIBWGAQm26Ejw3W7jbeRXwreAYtyqKiLbFxDGWhRV25-m8__U6ytMMrZCSUPqprUMLZXpLJrKGeRK75nm0hRKWxSalCJLsIgQ9BZ02yF4jEJ2M70nPfKdsTmywc6Cljw7gVtJ-Yx0u18P8_uQkR4vRA92EJe4IGdkERKoijcH7H1Ds1Pa4jr0vhyqNjfEdUMUytgZjhLbTVa6WoQDOh9FF0ENKRlaKEjMs2yF4z5U_W8ADFcTzTCqkZ1ADYbXGqvm9DcddOriOgDPG81mYjWIcyGJepWZ4skBaz8G-tDDlv_7Dh7bCeNn2sGfUCTUs7qEDs1B57x60rcKXFK7hhyW1MNrwvVmSZfyHX0KLp-Uyo9uWpXpmnrPPDP4KosE_8gbwXE78k-rxiGB9lUpLfUuLpw6CPXe6I56l8Nzd-AOhs5g0B_1L5zBsEP31HP643PXHV9euePxeOg4o8F7h_6udfvnY9e5HLmOO0L8aui8_wFr_lRN)
---

### Deliverable 1: Workflow Execution Engine & Node Registry

This is the shared runtime that every other part of the system depends on. It lives on the backend and has no UI of its own. Both the canvas preview (Deliverable 4) and the in-memory test server (Deliverable 6) call into it.

#### 1.1 The Node Type Definition System

Each node type in the system is a single object that bundles its executor (used at preview time), its code template (used at export time), its config schema (used to render its settings panel), and its validator. The correctness invariant that the entire system rests on is that the `executor` and `codeTemplate` must produce identical results for identical inputs — the preview and the exported server should behave the same way.

```typescript
interface NodeTypeDefinition {
  type: string;          // e.g. 'http_request'
  name: string;          // human-readable label shown in the UI
  icon: string;          // Lucide icon name
  category: 'input' | 'action' | 'transform' | 'output' | 'control';
  configSchema: JSONSchema;   // drives the config panel form (no separate form code needed)
  executor: (config: NodeConfig, context: ExecutionContext) => Promise<any>;
  codeTemplate: (node: WorkflowNode, ctx: GeneratorContext) => GeneratedCode;
  validate: (config: NodeConfig) => ValidationResult;
}
```

All six node types are registered in a central map. Adding a new type in the future is three steps — implement the object, register it, add a React config panel — with no changes required anywhere else:

```typescript
const NODE_TYPE_REGISTRY = new Map<string, NodeTypeDefinition>([
  ['input',        inputNode],
  ['http_request', httpRequestNode],
  ['transform',    transformNode],
  ['conditional',  conditionalNode],
  ['code',         codeNode],
  ['output',       outputNode],
]);
```

#### 1.2 Execution Context and Topological Sort

The execution context is a plain object that accumulates results as nodes run, keyed by node ID. Every tool invocation creates a fresh context — this prevents two concurrent preview runs from contaminating each other.

```typescript
interface ExecutionContext {
  env: Record<string, string>;  // process.env values, injected at call time
  input: Record<string, any>;   // the tool's input arguments
  [nodeId: string]: any;        // each node writes its result here
}
```

Before nodes execute, the workflow graph is topologically sorted using Kahn's algorithm. If the graph contains a cycle, execution is blocked and the cycle is highlighted on the canvas.

[![](https://mermaid.ink/img/pako:eNqdkl1rwjAUhv9KOd5WSb_SJBeDqRcbjG0Mr2a9qDaxxTbp0pTpxP--WOsHjMFYrvIm73nOS072sFIZBwZrnda58_SWSMeu-_mjrFvjPNtLp5DDjK815w5aOMPhnTOeP8xmr84b_2h5Y5JEXh3eogd0xsl8plPZCKWrG4rfe8Ynz0lMOjGdv7Tm2PgnsTG7kluuKMqSDTy0pMRzG6PVhrMBiijGtJfDzyIzOQvqrbtSpdJsIIS4hYx7iFguhR9eICKiHC1_hSCEbiGTM4TEXnxNkq187OO_Jpn-Nwm4dmJFBszolrtQcV2lRwn7Iz4Bk_OKJ8DsNkv1JoFEHmxNncp3papzmVbtOgcm0rKxqq2z1PBpkdq_UF1ONZcZ1xPVSgPMi0kHAbaHLTBMRxSH1I9xHAQBJaELO2vCaBTbgYRBFIWYxNHBha-uKxqRyD5PiAiKCPFjGhy-AXYhxqQ?type=png)](https://mermaid.live/edit#pako:eNqdkl1rwjAUhv9KOd5WSb_SJBeDqRcbjG0Mr2a9qDaxxTbp0pTpxP--WOsHjMFYrvIm73nOS072sFIZBwZrnda58_SWSMeu-_mjrFvjPNtLp5DDjK815w5aOMPhnTOeP8xmr84b_2h5Y5JEXh3eogd0xsl8plPZCKWrG4rfe8Ynz0lMOjGdv7Tm2PgnsTG7kluuKMqSDTy0pMRzG6PVhrMBiijGtJfDzyIzOQvqrbtSpdJsIIS4hYx7iFguhR9eICKiHC1_hSCEbiGTM4TEXnxNkq187OO_Jpn-Nwm4dmJFBszolrtQcV2lRwn7Iz4Bk_OKJ8DsNkv1JoFEHmxNncp3papzmVbtOgcm0rKxqq2z1PBpkdq_UF1ONZcZ1xPVSgPMi0kHAbaHLTBMRxSH1I9xHAQBJaELO2vCaBTbgYRBFIWYxNHBha-uKxqRyD5PiAiKCPFjGhy-AXYhxqQ)

After sorting, a **reachability check** walks edges backwards from the Output node. Any node that cannot be traced back to the Output node is shown as a warning on the canvas ("Disconnected node") and skipped at runtime without causing an error.

```typescript
function getReachableNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): Set<string> {
  const outputNode = nodes.find(n => n.type === 'output');
  if (!outputNode) return new Set();

  const reverseAdj = new Map<string, string[]>();
  for (const node of nodes) reverseAdj.set(node.id, []);
  for (const edge of edges) {
    reverseAdj.get(edge.target)!.push(edge.source);
  }

  const visited = new Set<string>();
  const queue = [outputNode.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const parent of reverseAdj.get(id) ?? []) queue.push(parent);
  }
  return visited;
}
```

#### 1.3 Conditional Node Branching

The Conditional node is the one node type that changes how execution flows. Its outgoing edges are tagged `true` or `false`. At runtime, the node evaluates its expression against the context and writes the result as `context[nodeId + '_branch']`. The runner checks this before executing any node whose only incoming edge comes from a Conditional — nodes on the inactive branch are skipped and logged as `'skipped'` in the debug panel.

```typescript
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: 'true' | 'false';  // present only on Conditional node outgoing edges
}

function shouldSkipNode(nodeId: string, edges: WorkflowEdge[], context: ExecutionContext): boolean {
  const incomingConditionalEdges = edges.filter(e => e.target === nodeId && e.label !== undefined);
  if (incomingConditionalEdges.length === 0) return false;
  return incomingConditionalEdges.every(edge => {
    const branchResult = context[`${edge.source}_branch`];
    return branchResult !== edge.label;
  });
}
```

#### 1.4 Workflow Runner with Per-Node Timeout

```typescript
async function runWorkflow(
  workflow: Workflow,
  inputs: Record<string, any>,
  onStep: (event: StepEvent) => void,
  timeoutMs = 10_000
): Promise<any> {
  const context: ExecutionContext = { env: process.env as any, input: inputs };
  const ordered = topologicalSort(workflow.nodes, workflow.edges);

  for (const node of ordered) {
    if (shouldSkipNode(node.id, workflow.edges, context)) {
      onStep({ nodeId: node.id, status: 'skipped', durationMs: 0 });
      continue;
    }

    const definition = NODE_TYPE_REGISTRY.get(node.type)!;
    const start = Date.now();
    try {
      const result = await Promise.race([
        definition.executor(node.data, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      context[node.id] = result;
      onStep({ nodeId: node.id, status: 'success', output: result, durationMs: Date.now() - start });
    } catch (err: any) {
      onStep({ nodeId: node.id, status: 'error', error: err.message, durationMs: Date.now() - start });
      throw err;
    }
  }

  const outputNode = ordered.find(n => n.type === 'output');
  return outputNode ? context[outputNode.data.sourceNodeId] : null;
}
```

#### 1.5 Variable Interpolation Engine

The `{{nodeId.path}}` syntax lets users reference data from previous nodes inside URLs, headers, and request bodies. The interpolation engine runs at preview time; an equivalent `compileReference` function is used by the code generator at export time.

The key detail is **type preservation**: if an entire field value is a single `{{...}}` reference (e.g., a JSON body field expecting a number), the raw value from the context is returned directly rather than being converted to a string. Without this, the downstream API receives `"5"` instead of `5`.

```typescript
function interpolate(value: any, context: ExecutionContext): any {
  if (typeof value !== 'string') return value;
  const singleRef = value.match(/^\{\{([^}]+)\}\}$/);
  if (singleRef) return resolvePath(singleRef[1].trim(), context);
  return value.replace(/\{\{([^}]+)\}\}/g, (_, path) =>
    String(resolvePath(path.trim(), context) ?? '')
  );
}
```

---

### Deliverable 2: Visual Workflow Builder — Canvas & Node System

#### 2.1 Canvas Architecture

The canvas is built on React Flow, which handles node rendering, edges, zoom/pan, and selection. The application's Zustand store owns the data model and drives React Flow as a controlled component. Node positions (x/y), connections, and all node configurations live in the same store that gets serialised into the manifest — so when a manifest is re-imported, the canvas layout is restored exactly.

[![](https://mermaid.ink/img/pako:eNo9kF1vgjAUhv_KybkdmoKIQJYlC8bEO6O7Urzo6BEaoTWlzG3if1_xY71pz8fzvqfngoUWhCmWhp8q-JjnCtzZbnbbrrVcCdhYbQjO2hwPtT6Dcu2tByTK4TrpVlqpVbu_c-vFbk28sLAYejOuvngLhpQgI1UJLyCVJeMaHPNAstUu0-ogS1hxRTUYWVYWWinok5v9cxx4HY3e-kIra3Rdk4D31bJ3dk9bGMot1VRYVxyGhOW8d-JPE3jwg1FRceXG750ueu7nUmBqTUceNmQaPoR4GcAcbUUN5Zi6p-DmmGOuro45cbXVunliRndlhemB162LupPgluaSu502_9n7FjLdKYtpkEQ3EUwv-I2pH7DxZBbM2GQ6DYIw8j38cVk_HDPGQt9P4tmEhVFy9fD3ZsvG0SxO_DD2GYsjfxJf_wBQNZAd?type=png)](https://mermaid.live/edit#pako:eNo9kF1vgjAUhv_KybkdmoKIQJYlC8bEO6O7Urzo6BEaoTWlzG3if1_xY71pz8fzvqfngoUWhCmWhp8q-JjnCtzZbnbbrrVcCdhYbQjO2hwPtT6Dcu2tByTK4TrpVlqpVbu_c-vFbk28sLAYejOuvngLhpQgI1UJLyCVJeMaHPNAstUu0-ogS1hxRTUYWVYWWinok5v9cxx4HY3e-kIra3Rdk4D31bJ3dk9bGMot1VRYVxyGhOW8d-JPE3jwg1FRceXG750ueu7nUmBqTUceNmQaPoR4GcAcbUUN5Zi6p-DmmGOuro45cbXVunliRndlhemB162LupPgluaSu502_9n7FjLdKYtpkEQ3EUwv-I2pH7DxZBbM2GQ6DYIw8j38cVk_HDPGQt9P4tmEhVFy9fD3ZsvG0SxO_DD2GYsjfxJf_wBQNZAd)

#### 2.2 Node Implementations

**Input** — Defines the tool's input schema. Each parameter has a name, type (string, number, boolean, object, array), description, and required flag. This maps directly to the MCP `inputSchema` in the generated server.

**HTTP Request** — Makes an outgoing fetch call. URL, query params, headers, and the JSON body all support `{{variable}}` syntax. The config panel renders a key/value editor for params and headers, and a Monaco editor for the body.

**Transform** — Takes output from a previous node and reshapes it. Users define field mappings like `{ city: "{{http_1.location.name}}", temp: "{{http_1.current.temp_c}}" }`. At runtime, this produces a new object on the context.

**Conditional** — Evaluates a JavaScript expression (e.g., `context.input_1.status === 'active'`) and routes execution to the `true` or `false` branch. Both outgoing edges are drawn on the canvas with labels, and the inactive branch is visually dimmed during execution.

**Code** — Monaco editor with arbitrary JavaScript. Executes inside an `isolated-vm` V8 isolate on the backend. The available API surface is documented in the panel: `context` (read the execution context), `output` (return a value). `fetch`, `fs`, and `process` are not available — the HTTP Request node handles external calls.

**Output** — A single dropdown that selects which upstream node's result becomes the tool's return value. No execution logic of its own.

#### 2.3 Edge Validation

Connection rules are enforced in React Flow's `isValidConnection` callback so invalid connections are rejected as the user drags, not after the fact:

- Input nodes have no incoming edges
- Output nodes have no outgoing edges
- Conditional nodes must have exactly two outgoing edges labelled `true` and `false`
- A new edge that would form a cycle is rejected immediately via a lightweight DFS check before it is committed to the store

---

### Deliverable 3: Server & Component Management

#### 3.1 Server Creation — Two-Step Flow

Servers are created first as named containers, then components are added to them. This design reflects MCP's one-to-many relationship (one server can hold many tools) and lets developers build incrementally — add one tool, test it, then add another — without knowing the final shape upfront.

[![](https://mermaid.ink/img/pako:eNp9Uj1u2zAUvsoDlzqIYlCWbEUaAhTu4q2o6iXQwojPNmGLZB-ppKnhtQfoEXuSUj9OE8StJvJ9v6R4ZLWRyArm8FuLusZPSmxJNJWG8FlBXtXKCu1hDcLB2iFdgFYdViqJD-ICXHbofeu80BJKbwgrPbDWN3d361UBy4Oq91Cx64rB75-_ALVHAi0ahGvwJLSzhvyoWQVRWUBNKDyWSI9Ik44a_WVe9S6EviXtwPWclRz05c0YOkhBWIuCHCgNbjgBTLCx_hlCYY9Xl5t-lBK-GnMIhY0eE972E1J2hMk5PYKhpERXk7JeGf22pg_sdyWXQj-G2zMWA2NjCPxODdQPDp4M7TcH8_Tvil_QmZZqrNi7cmfoVUEaR0ujN2r7n5N_JhNu6ILpALyytP3gxZBFbEtKssJTixFrkBrRbdmxs6qY32ETyhZhKQXtu4RT0IRndG9Mc5aRabc7VmzEwYVda2X4T-O7fZkSaom0NK32rEg4701YcWTfWRHP-DTJZhlP5vPZLF3EEXsO0zidcs7TOM5vs4Sni_wUsR99LJ8usts8TrN5kif5nGfp6Q__aQtx?type=png)](https://mermaid.live/edit#pako:eNp9Uj1u2zAUvsoDlzqIYlCWbEUaAhTu4q2o6iXQwojPNmGLZB-ppKnhtQfoEXuSUj9OE8StJvJ9v6R4ZLWRyArm8FuLusZPSmxJNJWG8FlBXtXKCu1hDcLB2iFdgFYdViqJD-ICXHbofeu80BJKbwgrPbDWN3d361UBy4Oq91Cx64rB75-_ALVHAi0ahGvwJLSzhvyoWQVRWUBNKDyWSI9Ik44a_WVe9S6EviXtwPWclRz05c0YOkhBWIuCHCgNbjgBTLCx_hlCYY9Xl5t-lBK-GnMIhY0eE972E1J2hMk5PYKhpERXk7JeGf22pg_sdyWXQj-G2zMWA2NjCPxODdQPDp4M7TcH8_Tvil_QmZZqrNi7cmfoVUEaR0ujN2r7n5N_JhNu6ILpALyytP3gxZBFbEtKssJTixFrkBrRbdmxs6qY32ETyhZhKQXtu4RT0IRndG9Mc5aRabc7VmzEwYVda2X4T-O7fZkSaom0NK32rEg4701YcWTfWRHP-DTJZhlP5vPZLF3EEXsO0zidcs7TOM5vs4Sni_wUsR99LJ8usts8TrN5kif5nGfp6Q__aQtx)

Server state persists to `localStorage` on every store update, so work is never lost on a page refresh.

#### 3.2 Resources

Resources expose data via URI templates without any execution logic. The system matches an incoming URI against the template, extracts variable values, and interpolates them into the response body using the same interpolation engine as the workflow nodes.

Fields: **Type** (static URI or template), **URI Template** (e.g. `weather/{city}`), **MIME Type**, **Response Template** (JSON or plain text with `{{variable}}` placeholders).

#### 3.3 Prompts

Prompts are message templates with typed arguments. Fields: **Arguments** (a list of `{ name, type, description, required }` entries) and **Messages** (an array of `{ role, content }` objects where content can reference arguments via `{{argumentName}}`). The MCP server handler expands these at request time — no runtime logic needed.

---

### Deliverable 4: Workflow Preview & Real-Time Debug Panel

#### 4.1 The Debug Side Channel

The MCP protocol only carries a final result — there is no built-in way to see which steps ran, how long each took, or what intermediate data looked like. The only way to surface this is to stream it as execution happens.

The solution is a WebSocket channel running alongside the HTTP execute call, keyed to an execution ID. The backend runner fires `onStep()` after every node, which emits to that WebSocket. The browser renders each event as it arrives.

[![](https://mermaid.ink/img/pako:eNqVUs2O2jAQfpWRT6yUZZ3wk8WHPWSL1B5KVwQpUhWpMsksRCR26tgLLeLaB-gj9kk6IbDbih5oTvbM9zP-JnuW6RyZYA1-dagyfFfIlZFVqoC-WhpbZEUtlYUIZAOR0dsGDfQepXqRzc0lLIlbXILLWGcbtP_QmbaA6a422JCgJJTKL2GzeQub0XAwd0qhSVUHim4fHpJYQOOWTWaKJfZwh9mH_OatHU0FPH2KF3An6-KubTuLsIetNpvnUm89KFTtbONBR4XDiTsl8mwuwDiVnLC9S5JWscX65Deb354G6srw68dPaA_TF1S2d-R88T0aN8vowR74QXXOLYlbbiTe8GAoDDSYkxnkuHQrCkVheZXX2tr6b6vJ_TVeV4lrZ-klf4j_hzTl2gHeLxZPEHBOu6Dtu9K-Jt_1P0qzgW5fhVaQ6aou0SLz2MoUORPWOPRYhaaS7ZXtW3bK7BorTJmgY04KKUvVgTiU3GetqzPNaLdaM_Esy4Zurs6lPf_tr9Vu7kftlGViwIdHESb2bMeEH_D-IAxCPhiNgmA49j32jar-sM85H_oUdkiM8eTgse9HW94fh_cTfxiOQs7DkR-MD78Bt6UaHQ?type=png)](https://mermaid.live/edit#pako:eNqVUs2O2jAQfpWRT6yUZZ3wk8WHPWSL1B5KVwQpUhWpMsksRCR26tgLLeLaB-gj9kk6IbDbih5oTvbM9zP-JnuW6RyZYA1-dagyfFfIlZFVqoC-WhpbZEUtlYUIZAOR0dsGDfQepXqRzc0lLIlbXILLWGcbtP_QmbaA6a422JCgJJTKL2GzeQub0XAwd0qhSVUHim4fHpJYQOOWTWaKJfZwh9mH_OatHU0FPH2KF3An6-KubTuLsIetNpvnUm89KFTtbONBR4XDiTsl8mwuwDiVnLC9S5JWscX65Deb354G6srw68dPaA_TF1S2d-R88T0aN8vowR74QXXOLYlbbiTe8GAoDDSYkxnkuHQrCkVheZXX2tr6b6vJ_TVeV4lrZ-klf4j_hzTl2gHeLxZPEHBOu6Dtu9K-Jt_1P0qzgW5fhVaQ6aou0SLz2MoUORPWOPRYhaaS7ZXtW3bK7BorTJmgY04KKUvVgTiU3GetqzPNaLdaM_Esy4Zurs6lPf_tr9Vu7kftlGViwIdHESb2bMeEH_D-IAxCPhiNgmA49j32jar-sM85H_oUdkiM8eTgse9HW94fh_cTfxiOQs7DkR-MD78Bt6UaHQ)

#### 4.2 Environment Variables for Preview

When the user clicks Execute in the canvas, the frontend collects env var values from a pre-execution input panel (similar to an `.env` editor) and sends them in the POST body. The backend merges them into `context.env` before running. These values are stored in `sessionStorage` so the user does not have to re-enter them on every run, but they are never persisted to `localStorage` or sent to the server outside of an active execute call.

#### 4.3 Debug Panel UI

The panel renders below the canvas in a split-pane layout:

```
┌─────────────────────────────────────────────────┐
│ ✅ Execution Completed                     226ms │
├─────────────────────────────────────────────────┤
│ ● input_1      12ms   ✓                         │
│   └─ { city: "Tokyo", units: "celsius" }        │
│                                                  │
│ ● http_1      198ms   ✓                         │
│   └─ GET api.weatherapi.com/v1/current.json     │
│   └─ Status: 200 OK   [Expand ▼]               │
│                                                  │
│ ● transform_1   8ms   ✓                         │
│ ● output        8ms   ✓                         │
├─────────────────────────────────────────────────┤
│ FINAL OUTPUT                         [Copy 📋]  │
│ { "city": "Tokyo", "temperature": 22, ... }     │
└─────────────────────────────────────────────────┘
```

Expanding an HTTP node shows the full outgoing request (method, URL, headers, body) and the raw response. Failed steps show the error message, stack trace, and the last-known context state. In parallel with the panel, each node's border on the canvas animates from idle → executing → success/error as its WebSocket event arrives.

---

### Deliverable 5: Manifest System & TypeScript Code Generation Pipeline

#### 5.1 The Manifest

The manifest is a single JSON file that captures everything needed to restore a workflow back into the builder — canvas positions, node configurations, edge connections, resource and prompt definitions, and the list of required environment variables (names only, never values). It is always included in the export ZIP and is the mechanism that makes previously exported servers editable again.

[![](https://mermaid.ink/img/pako:eNpNkMluwjAQhl_FmnNIs5HtUAnCpVKRUOkJwsFKBuKS2NHEKVt495p0UX3y_PL3zXhuUKgSIYUD8bZir2-5ZObMtpu-01yWbK0VYZ7Lk6LjvlYnZmKNOzaZPA8dkuC1uOLA5ttltpr3oi6RllyKPXbaUPZHp-Tu2zkfGdG0ivTAZv_DxwzsgBKJm3YDy7bvlxbXBYlWMyNma6RPJCPsqHgSssSzrbsfbzYqOBWVMG8GtthuXlZsoU6yVrzcgWX-JkpINfVoQYPU8EcJtweeg66wwRxScy05HXPI5d0wLZcbpZpfjFR_qCDd87ozVd-WZgkLwc3Wmr-U0AxGmeqlhtR34lEC6Q3OkLqeY_uRFzn-dOp5QehacDGpG9iO4wSum8SR7wRhcrfgOrZ17DCKEzeIwiQ2YBiE9y8kw4kP?type=png)](https://mermaid.live/edit#pako:eNpNkMluwjAQhl_FmnNIs5HtUAnCpVKRUOkJwsFKBuKS2NHEKVt495p0UX3y_PL3zXhuUKgSIYUD8bZir2-5ZObMtpu-01yWbK0VYZ7Lk6LjvlYnZmKNOzaZPA8dkuC1uOLA5ttltpr3oi6RllyKPXbaUPZHp-Tu2zkfGdG0ivTAZv_DxwzsgBKJm3YDy7bvlxbXBYlWMyNma6RPJCPsqHgSssSzrbsfbzYqOBWVMG8GtthuXlZsoU6yVrzcgWX-JkpINfVoQYPU8EcJtweeg66wwRxScy05HXPI5d0wLZcbpZpfjFR_qCDd87ozVd-WZgkLwc3Wmr-U0AxGmeqlhtR34lEC6Q3OkLqeY_uRFzn-dOp5QehacDGpG9iO4wSum8SR7wRhcrfgOrZ17DCKEzeIwiQ2YBiE9y8kw4kP)

The `envVariables` array in the manifest is auto-generated by scanning all node configs for `{{env.X}}` patterns. The export service also scans for hardcoded secret-shaped strings (e.g., bearer tokens written directly in an HTTP Request header) and emits a warning before packaging.

#### 5.2 Code Generator

The generator calls each node type's `codeTemplate()` function, assembles the snippets in topological order, and wraps them in a complete, standalone MCP server file:

```typescript
class MCPCodeGenerator {
  generate(server: MCPServer): GeneratedServer {
    const toolExecutors = server.tools.map(t => this.generateToolCode(t));
    const serverFile = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

${this.renderHelpers(toolExecutors)}
${this.renderToolDefinitions(server.tools)}
${toolExecutors.map(t => t.executorCode).join('\n\n')}
${this.renderServerBoilerplate(server)}
    `;
    return {
      files: [
        { path: 'src/index.ts',                 content: serverFile },
        { path: 'package.json',                 content: this.generatePackageJson(server) },
        { path: 'tsconfig.json',                content: this.generateTsConfig() },
        { path: '.env.example',                 content: this.generateEnvExample(server) },
        { path: 'README.md',                    content: this.generateReadme(server) },
        { path: 'Dockerfile',                   content: this.generateDockerfile() },
        { path: 'mcp-builder.manifest.json',    content: JSON.stringify(this.buildManifest(server), null, 2) },
      ],
    };
  }
}
```

#### 5.3 Variable Interpolation Compilation

The `{{variable}}` syntax used in the builder compiles to TypeScript optional chaining at export time:

| Builder syntax | Compiled TypeScript |
|---|---|
| `{{input_1.city}}` | `context["input_1"]?.city` |
| `{{env.API_KEY}}` | `process.env.API_KEY` |
| `https://api.com?q={{input_1.q}}` | `` `https://api.com?q=${context["input_1"]?.q}` `` |

Type-preserving references — where the entire value is a single `{{...}}` — emit a direct access expression rather than a template literal, so a JSON body field expecting a number compiles correctly.

#### 5.4 Export Validation

Before packaging, the generator validates the assembled TypeScript using `ts.transpileModule` from the TypeScript Compiler API with `strict: true`. If errors are found, the ZIP is blocked and the offending node is highlighted on the canvas with the error message. This ensures every downloaded package compiles cleanly.

Export options: **Download ZIP** (complete runnable project), **Copy Claude Desktop Config** (JSON snippet ready to paste), **Deploy to Vercel / Railway** (OAuth-gated one-click).

---

### Deliverable 6: Test Tab — Server Connection, Discovery & Primitive Testing

#### 6.1 What Is Reused vs. Built

`@mcpjam/sdk`'s `MCPClientManager` is used directly as an npm dependency. It handles the full connection lifecycle for both STDIO and HTTP transports, multiplexes connections under a single manager instance, and provides typed methods for every MCP protocol operation. This removes the need to implement the client transport layer from scratch.

The `rpcLogBus` SSE pipeline and `generateFormFieldsFromSchema` function are adapted from MCPJam's architecture — same design decisions, implemented to fit this project's Express backend.

#### 6.2 System Architecture

[![](https://mermaid.ink/img/pako:eNptUk2PmzAQ_SuWT62UDyDki0MPJKiNlGhRQNpVYQ8OzBIrYCNjstkm-e8dSLYibX2aN3pvZt6TzzSRKVCHZoqVexIuY0HwVfXu3oBKh2wXxbSpCJbki6vkewXqa0xfb-zmBW4UgDqCIgFPYcdUHItECgGJJkOS8uoOOhI_jHzFC675EdpF0Ii0lHmFEgWVrFUCTV0qWZS66mi362jrL8haZsRnAnIUBoFHvCMIHbS6OxlEGou_TLksOWAfTXmnEvdUn50HR5vFJtos_EXOceaGCZa191VcZDloKR6ucSNVJniNW3evXG2ildhAIdVHqJioSqk0jnBrnqdNUm1gHb73EgXhcvWEln-EoY9U74SpCJY_cjumApf0-98u_lMQkiEr-VBjkMN72JfGxI3nh__jtWEP4QRJraHD3q5b9nevS0aH_UorYAXBrC-N6xsbZS39FgHGRBKW5zvM9F8SZvKIvZcbXt1n1OJZqsNbLt8v5NmLPgHxRMYFYCRLyPHDKLbLgZivtIdfl6fU0aqGHi1AFayB9NyMjaneQwExdbBMmTrENBZX1JRM_JSy-JQpWWd76ryxvEJUlynTsOQMv0vxp6swdVALWQtNnZFptUOoc6Yn6piWMRhNrakxGo8ty56YPfqBXdMeGIZhm-Z8Nh0Z9mR-7dFf7VpjMJnO5qY9MyzDss3JZHz9DT2qHhk?type=png)](https://mermaid.live/edit#pako:eNptUk2PmzAQ_SuWT62UDyDki0MPJKiNlGhRQNpVYQ8OzBIrYCNjstkm-e8dSLYibX2aN3pvZt6TzzSRKVCHZoqVexIuY0HwVfXu3oBKh2wXxbSpCJbki6vkewXqa0xfb-zmBW4UgDqCIgFPYcdUHItECgGJJkOS8uoOOhI_jHzFC675EdpF0Ii0lHmFEgWVrFUCTV0qWZS66mi362jrL8haZsRnAnIUBoFHvCMIHbS6OxlEGou_TLksOWAfTXmnEvdUn50HR5vFJtos_EXOceaGCZa191VcZDloKR6ucSNVJniNW3evXG2ildhAIdVHqJioSqk0jnBrnqdNUm1gHb73EgXhcvWEln-EoY9U74SpCJY_cjumApf0-98u_lMQkiEr-VBjkMN72JfGxI3nh__jtWEP4QRJraHD3q5b9nevS0aH_UorYAXBrC-N6xsbZS39FgHGRBKW5zvM9F8SZvKIvZcbXt1n1OJZqsNbLt8v5NmLPgHxRMYFYCRLyPHDKLbLgZivtIdfl6fU0aqGHi1AFayB9NyMjaneQwExdbBMmTrENBZX1JRM_JSy-JQpWWd76ryxvEJUlynTsOQMv0vxp6swdVALWQtNnZFptUOoc6Yn6piWMRhNrakxGo8ty56YPfqBXdMeGIZhm-Z8Nh0Z9mR-7dFf7VpjMJnO5qY9MyzDss3JZHz9DT2qHhk)
#### 6.3 Connection Flow

**Builder server mode** — The backend creates a real `Server` from `@modelcontextprotocol/sdk`, registers handlers for each tool (calling `runWorkflow()` under the hood) and for the server's resources and prompts, then wires it to an `InMemoryTransport` linked pair. The resulting `Client` instance is stored in a `builderClients` map. A `getClientForServer` helper checks this map first before falling back to `MCPClientManager.getClient()`, which avoids depending on a `registerClient` API that does not exist on `MCPClientManager`:

```typescript
const builderClients = new Map<string, Client>();

async function mountBuilderServer(mcpServer: MCPServer): Promise<void> {
  const server = new Server(
    { name: mcpServer.name, version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = mcpServer.tools.find(t => t.name === req.params.name);
    if (!tool) throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${req.params.name}`);
    const steps: StepEvent[] = [];
    const result = await runWorkflow(tool.workflow, req.params.arguments ?? {}, s => steps.push(s));
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      _meta: { executionSteps: steps },
    };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: mcpServer.resources.map(r => ({ uri: r.uriTemplate, name: r.name, mimeType: r.mimeType })),
  }));

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: mcpServer.prompts.map(p => ({ name: p.name, description: p.description, arguments: p.arguments })),
  }));

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'mcp-builder-test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
  builderClients.set(mcpServer.id, client);
}

export function getClientForServer(serverId: string, manager: MCPClientManager): Client {
  return builderClients.get(serverId) ?? manager.getClient(serverId);
}
```

**External server mode** — `MCPClientManager.connectToServer()` is called with either a STDIO config (spawns a child process) or an HTTP config (opens a Streamable HTTP connection). The MCP initialization handshake runs automatically, returning `serverInfo` and `capabilities`.

#### 6.4 Tool/Resource/Prompt Discovery

On connect, all three primitive types are fetched in parallel and stored in Zustand. Discovery uses cursor-based pagination — the MCP `nextCursor` field is forwarded to the browser, and an `IntersectionObserver` sentinel at the bottom of the sidebar triggers the next page when scrolled into view.

```typescript
const [tools, resources, prompts] = await Promise.all([
  client.listTools(),
  client.listResources(),
  client.listPrompts(),
]);
```

#### 6.5 Dynamic Form Generation

When a user selects a tool, its `inputSchema` (a JSON Schema object returned by the server) is converted into a `FormField[]` array that drives React input components. The `generateFormFieldsFromSchema` function handles the following JSON Schema patterns:

- Direct `enum` arrays → `<Select>` dropdown
- `$ref → $defs` resolution (with cycle detection for circular schemas) → resolved type
- `oneOf[{ const, title }]` pattern — enum values with display labels
- `anyOf / allOf` composition → resolved to the most specific type
- `boolean` → checkbox; `array` / `object` → Monaco JSON editor; `number` / `integer` → number input; `string` → text input

Optional fields render an "unset" toggle. When toggled off, the field is excluded from the request entirely — not sent as `null`.

#### 6.6 Execution and Results

**Tool execution** calls `client.callTool(name, params)` on the backend. The `durationMs` is captured as a `Date.now()` delta and returned alongside the result. For builder servers, `_meta.executionSteps` on the response contains the per-node breakdown, which is forwarded to the browser and rendered in the same debug panel format as the canvas preview.

**Resource reading** calls `client.readResource({ uri })` and renders the response with syntax highlighting matched to the `mimeType`.

**Prompt retrieval** calls `client.getPrompt({ name, arguments })` after collecting argument values through the same form generation path.

#### 6.7 JSON-RPC Traffic Log

Every JSON-RPC frame that flows through the `MCPClientManager` is captured and streamed to the browser over SSE. This is the primary debugging surface for understanding unexpected tool behaviour.

[![](https://mermaid.ink/img/pako:eNq9k02PmkAYx7_Kk7lgE0TB9znsQZY0m6ymWTc9NF5GeMRJYYbOi11r_O774Gpr6qWncmEG_i8_HuDIcl0g48ziD48qx0cpSiPqtQI6GmGczGUjlIN0AcLCIv2SVhKVWwglSjT3upfneSs0Tf6sy7m30Mn2pM9q6RyaT_eG1SprDe0pU0WjpXL3onPm3Oiftu38uD_vPjyQi8Pn7BV6opE9h9b1qLlrnUFRX6pX2pscL81kIBtBcrB-Y3MjN9ih0D2ap8LeiEhFGoNNJQ5QCetgCdjGWdgaXYORqoSN327_AC21Q9CURMPi8Kp1BbmoKsA3zD2xfajSRfdK0PhNJe2uc4RCGsyd1IpDYFEVQQg1Wksj5nCMougUwhUSThdKiuheR4A0XgjOfMHfz1AIJygF3KGhtIDmQ-m3hats-XgudDtd0N4Rue216AGc_hGaVij3-F-5X7I0e_qa3aIbtL5yhM1CVhpZMO6Mx5DVaGrRbtmxrVkzt8Ma14zTshDm-5qtVeuhj-2b1vXVZrQvd4xvRWVp5xtCuv4hv68ael1oUu2VY3wwS84hjB_ZG-OTJJrFcdKfxf3xcDgaxCE7MD6cRvFkOIxHo-l0MJnO-uNTyH6da_vRbJwko3gQ9wfJJJmOx6d36lklQA?type=png)](https://mermaid.live/edit#pako:eNq9k02PmkAYx7_Kk7lgE0TB9znsQZY0m6ymWTc9NF5GeMRJYYbOi11r_O774Gpr6qWncmEG_i8_HuDIcl0g48ziD48qx0cpSiPqtQI6GmGczGUjlIN0AcLCIv2SVhKVWwglSjT3upfneSs0Tf6sy7m30Mn2pM9q6RyaT_eG1SprDe0pU0WjpXL3onPm3Oiftu38uD_vPjyQi8Pn7BV6opE9h9b1qLlrnUFRX6pX2pscL81kIBtBcrB-Y3MjN9ih0D2ap8LeiEhFGoNNJQ5QCetgCdjGWdgaXYORqoSN327_AC21Q9CURMPi8Kp1BbmoKsA3zD2xfajSRfdK0PhNJe2uc4RCGsyd1IpDYFEVQQg1Wksj5nCMougUwhUSThdKiuheR4A0XgjOfMHfz1AIJygF3KGhtIDmQ-m3hats-XgudDtd0N4Rue216AGc_hGaVij3-F-5X7I0e_qa3aIbtL5yhM1CVhpZMO6Mx5DVaGrRbtmxrVkzt8Ma14zTshDm-5qtVeuhj-2b1vXVZrQvd4xvRWVp5xtCuv4hv68ael1oUu2VY3wwS84hjB_ZG-OTJJrFcdKfxf3xcDgaxCE7MD6cRvFkOIxHo-l0MJnO-uNTyH6da_vRbJwko3gQ9wfJJJmOx6d36lklQA)

The browser keeps a single `EventSource` connection regardless of how many components are subscribed — a ref-count ensures the connection is only closed when the last subscriber unmounts. Events are stored in a Zustand slice capped at 1000 items, displayed with direction badge, method name, server ID, timestamp, and an expandable JSON payload.

---

### Deliverable 7: Test Tab — Agentic Chat Testing

Testing a tool with fixed inputs only validates it in isolation. The more important question is: given a natural language prompt, does the model select the right tool, pass the right arguments, and handle the result correctly? This deliverable adds a chat interface wired directly to the connected MCP server's tools.

#### 7.1 Architecture

[![](https://mermaid.ink/img/pako:eNpNkc9um0AQxl9ltKdEITZ_bMCoqlTjHKqqKgokh4JVrWBiUIFFu0ua1Pa1D9BH7JNkFttR97QzO99vvp3Zs1JUyCK2k3yoIdsUPdB5yB8USuhQKb7DLdzefoT4Pk--pRnM-dDMNSo9L2uutydBfD_VJHGWDxIHLjGmx0yIVhVFX4r-GaWGr3EC2uTg35-_8OkzpJsv8CRk984hwARKs7xgSkvkXYYv-qojl611ElsXX-oaHlGW2J5RBTtTyOUHohxMOZS8bQ9wZ4Bl22CvZyZjrF1dAy_1yNvJGH2YTP7PMIg0vYOTjwOs87UUv8xgNHmC-WTnh6Fd7hLV2GrAZ2qjzqD19KEsyU3LhNMYStENoqcSUDXxgMudghs4i2-gGiXXjei3zKK9NBWLtBzRYh3SpEzI9gZdMF1jhwWL6Fpx-bNgRX8kzcD770J0F5kU465m0RNvFUXjUHGNm4bTxrv3rMS-QhmLsdcsWqyWE4RFe_bCIsf2Zr69XNme7y4XYeiGFnultDML3cB2vJW_WriOFwZHi_2e-tqzMHDCwHV8J3C9pb_0jm9QC8UW?type=png)](https://mermaid.live/edit#pako:eNpNkc9um0AQxl9ltKdEITZ_bMCoqlTjHKqqKgokh4JVrWBiUIFFu0ua1Pa1D9BH7JNkFttR97QzO99vvp3Zs1JUyCK2k3yoIdsUPdB5yB8USuhQKb7DLdzefoT4Pk--pRnM-dDMNSo9L2uutydBfD_VJHGWDxIHLjGmx0yIVhVFX4r-GaWGr3EC2uTg35-_8OkzpJsv8CRk984hwARKs7xgSkvkXYYv-qojl611ElsXX-oaHlGW2J5RBTtTyOUHohxMOZS8bQ9wZ4Bl22CvZyZjrF1dAy_1yNvJGH2YTP7PMIg0vYOTjwOs87UUv8xgNHmC-WTnh6Fd7hLV2GrAZ2qjzqD19KEsyU3LhNMYStENoqcSUDXxgMudghs4i2-gGiXXjei3zKK9NBWLtBzRYh3SpEzI9gZdMF1jhwWL6Fpx-bNgRX8kzcD770J0F5kU465m0RNvFUXjUHGNm4bTxrv3rMS-QhmLsdcsWqyWE4RFe_bCIsf2Zr69XNme7y4XYeiGFnultDML3cB2vJW_WriOFwZHi_2e-tqzMHDCwHV8J3C9pb_0jm9QC8UW)

#### 7.2 Tool Assembly

Before each chat request, the server fetches all tools from the connected MCP server and converts them to the Vercel AI SDK's format. The `execute` function inside each tool calls back to the MCP server — the model never executes tools directly.

```typescript
async function prepareChatTools(client: Client): Promise<Record<string, CoreTool>> {
  const { tools } = await client.listTools();
  const aiTools: Record<string, CoreTool> = {};

  for (const tool of tools) {
    aiTools[tool.name] = {
      description: tool.description,
      parameters: jsonSchema(tool.inputSchema),
      execute: async (args) => client.callTool({ name: tool.name, arguments: args }),
    };
  }
  return aiTools;
}
```

For Anthropic models, tool names are validated against Anthropic's constraint (`[a-zA-Z0-9_-]`, max 64 chars) before the request is sent. Tools that fail this check are flagged in the UI with a fix suggestion.

#### 7.3 Chat Route

```typescript
app.post('/api/test/chat', async (c) => {
  const { serverId, messages, model, apiKey } = await c.req.json();
  const client = getClientForServer(serverId, manager);
  const tools = await prepareChatTools(client);
  const llmModel = createModel(model, apiKey);
  const result = streamText({ model: llmModel, tools, messages, maxSteps: 10 });
  return result.toDataStreamResponse();
});
```

The chat panel is a split view alongside the primitive tester. Tool call blocks show the tool name, the arguments the model passed, the raw MCP server result, and the duration. API keys are stored in `localStorage` under a namespaced key and configured in a settings panel within the tab.

---

### Deliverable 8: MCP Apps Testing Tab

MCP Apps is a protocol extension (SEP-1865) where a tool result's `_meta` object contains a `ui.resourceUri` field pointing to HTML on the MCP server. When the host fetches this HTML and renders it in a sandboxed iframe, the widget can call tools and read resources interactively without going through the LLM again. This tab provides a dedicated environment for building and testing these widgets.

#### 8.1 UI Type Detection

Before rendering any tool result, the result and its associated tool metadata are inspected to decide which renderer to use:

```typescript
type UIType = 'plain' | 'mcp-apps' | 'mcp-ui-inline';

function detectUIType(toolMeta: Record<string, unknown>, toolResult: unknown): UIType {
  if (getToolUiResourceUri(toolMeta)) return 'mcp-apps';
  const content = (toolResult as any)?.content;
  if (Array.isArray(content) && content.some(isUIResource)) return 'mcp-ui-inline';
  return 'plain';
}
```

#### 8.2 Widget Rendering Pipeline

[![](https://mermaid.ink/img/pako:eNp9U12P2jAQ_CsrvxyoOQgfgcZST4IrtEhFPR3hpUKqjL0EiyRObefKFfHf60CgFHrNk707Mzu76-wIVwIJJQZ_FJhx_ChZrFm6yMB9OdNWcpmzzMIcmIG5QX2bGkRlbvr4BIM8NxCx5S1mOCoxQ8Y3mInbdEmuNGaoX_5VZTIuETOWiaXaooDJyvnERXZEzu8fHgYRdewEuQWrVOLBSiYJMB0bD3gi-Qaeiwo-iBx-OKLw9HUWQZPlsmnR2GbJM03cIi8sHqHDkYM6YxQ4S5LIAWqZK-wdhOtHjEvfV4IaTZFYeAffU7SsUciGi6hCc5xreVas3O4quHcwPHUE2F8Z_DSK4EIBai-SwfI4R8i12r7Wr31qZOK5otQuuLdmf0oRo4XP0fTLtbWLFBirZRZfGJuMKRjNheLwAbjKLG7tjGuZl40fmX80J-NKMlfGTtEYFqPr3I1nrQSFu-PMy-HeeeXGWWpupvC_NUGtHINEUX9rYbDSKq18vbGw6_Yvo-eW_25ACu-07T3xSKylINTqAj2Sok5ZeSW7UmJB7BrdWyXUHQXTmwVZZCXHPexvSqUnmlZFvCZ0xRLjbkUumD39kOeodntH_aiKzBIaBL2DCKE7siW05XcaQb_fD3thp-d3gpbLvhLabTc6Xd_vvG-HYdDzg2DvkV-Hsn6jH7b6Lt4N_bDXanXb-9_TEUcX?type=png)](https://mermaid.live/edit#pako:eNp9U12P2jAQ_CsrvxyoOQgfgcZST4IrtEhFPR3hpUKqjL0EiyRObefKFfHf60CgFHrNk707Mzu76-wIVwIJJQZ_FJhx_ChZrFm6yMB9OdNWcpmzzMIcmIG5QX2bGkRlbvr4BIM8NxCx5S1mOCoxQ8Y3mInbdEmuNGaoX_5VZTIuETOWiaXaooDJyvnERXZEzu8fHgYRdewEuQWrVOLBSiYJMB0bD3gi-Qaeiwo-iBx-OKLw9HUWQZPlsmnR2GbJM03cIi8sHqHDkYM6YxQ4S5LIAWqZK-wdhOtHjEvfV4IaTZFYeAffU7SsUciGi6hCc5xreVas3O4quHcwPHUE2F8Z_DSK4EIBai-SwfI4R8i12r7Wr31qZOK5otQuuLdmf0oRo4XP0fTLtbWLFBirZRZfGJuMKRjNheLwAbjKLG7tjGuZl40fmX80J-NKMlfGTtEYFqPr3I1nrQSFu-PMy-HeeeXGWWpupvC_NUGtHINEUX9rYbDSKq18vbGw6_Yvo-eW_25ACu-07T3xSKylINTqAj2Sok5ZeSW7UmJB7BrdWyXUHQXTmwVZZCXHPexvSqUnmlZFvCZ0xRLjbkUumD39kOeodntH_aiKzBIaBL2DCKE7siW05XcaQb_fD3thp-d3gpbLvhLabTc6Xd_vvG-HYdDzg2DvkV-Hsn6jH7b6Lt4N_bDXanXb-9_TEUcX)
#### 8.3 Iframe Sandbox

The widget HTML is set as the iframe's `srcdoc` — not a `src` URL. This is important: response headers (including CSP) do not apply to `srcdoc` iframes, so the Content Security Policy must be injected as a `<meta>` tag inside the HTML itself. A context script is prepended before rendering, making `toolInput`, `toolOutput`, and the current theme available to the widget as `window.__MCP_CONTEXT__`.

```tsx
const contextScript = `<script>window.__MCP_CONTEXT__ = ${JSON.stringify({
  toolInput: args, toolOutput: result, theme: currentTheme,
})}</script>`;

<iframe
  srcdoc={contextScript + widgetHtml}
  sandbox="allow-scripts allow-forms allow-popups"
  style={{ width: '100%', height: '100%', border: 'none' }}
  ref={iframeRef}
/>
```

#### 8.4 `postMessage` JSON-RPC Bridge

Once the iframe is mounted, a `message` event listener proxies the widget's JSON-RPC calls back to the MCP server:

```typescript
window.addEventListener('message', async (event) => {
  if (event.source !== iframeRef.current?.contentWindow) return;
  const { id, method, params } = event.data;

  try {
    let result: unknown;
    if (method === 'tools/call')
      result = await client.callTool({ name: params.name, arguments: params.arguments });
    else if (method === 'resources/read')
      result = await client.readResource({ uri: params.uri });
    else throw new Error(`Unsupported bridge method: ${method}`);

    iframeRef.current?.contentWindow?.postMessage({ id, result }, '*');
  } catch (err: any) {
    iframeRef.current?.contentWindow?.postMessage(
      { id, error: { code: -32603, message: err.message } }, '*'
    );
  }
});
```

#### 8.5 Unified Traffic Log

The MCP Apps tab reuses the same RPC log panel from Deliverable 6 but adds a second data source: the `postMessage` traffic between the parent page and the iframe. Each frame is logged with a `source` tag (`mcp-server` or `mcp-apps-bridge`), so the developer can see both what the widget is requesting and what the MCP server is returning in one unified view.
