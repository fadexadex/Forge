const { McpServer } = require("./sample-mcp-apps-chatflow/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js");
const { ReadResourceResultSchema } = require("./sample-mcp-apps-chatflow/node_modules/@modelcontextprotocol/sdk/dist/cjs/types.js");

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
    params: { uri: "ui://test" }
  }, ReadResourceResultSchema);
  console.log(JSON.stringify(result, null, 2));
}
run();
