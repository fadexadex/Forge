const fs = require('fs');
const code = fs.readFileSync('src/components/test/McpAppsPanel.jsx', 'utf8');
const updated = code.replace(
  "console.log('bridge received:', method, { __widgetId, params });",
  "console.log('bridge received:', method, { __widgetId, params });\n      if (method === 'ui/notifications/initialized') {\n        console.log('handling ui/notifications/initialized');\n      }"
).replace(
  "arguments: context.toolInput,",
  "arguments: context.toolInput,\n                    _DEBUG_toolOutput: context.toolOutput,"
);
fs.writeFileSync('src/components/test/McpAppsPanel.jsx', updated);
