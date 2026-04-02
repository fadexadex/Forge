import { McpServer } from "./sample-mcp-apps-chatflow/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js";
import { Server } from "./sample-mcp-apps-chatflow/node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js";

const server = new McpServer({ name: "test", version: "1.0" });
server.registerResource("test-ui", "ui://test", { mimeType: "text/html" }, async () => {
  return {
    contents: [
      {
        uri: "ui://test",
        mimeType: "text/html",
        text: "hello",
        _meta: {
          ui: {
            csp: { resourceDomains: ["https://example.com"] }
          }
        }
      }
    ]
  };
});

async function run() {
  const result = await server.server.request({
    method: "resources/read",
    params: { name: "test-ui", uri: "ui://test" }
  }, { parse: (x) => x });
  console.log(JSON.stringify(result, null, 2));
}
run();
