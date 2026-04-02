# Plan to Enable CSP Enforcement in Forge Tester

## Issue Identified
The user reported that the visualization MCP app (`sales-visualization`) isn't working appropriately because the Content Security Policy (CSP) is "not registered" or enforced properly by the host sandbox. 

Upon inspecting `src/components/test/McpAppsPanel.jsx`, the CSP enforcement for the `srcDoc` iframe is currently commented out and disabled:
```javascript
// Strict CSP enforcing the Security Contract (disabled for now as per request)
```
Because Forge does not dynamically generate and inject the `<meta http-equiv="Content-Security-Policy">` tag into the iframe based on the widget's metadata, the MCP app's contract (which explicitly requests `https://cdn.jsdelivr.net` for `chart.js`) is effectively ignored. The user expects the host (Forge) to actively enforce this security contract as per the MCP App specification.

## Planned Changes
I will modify `src/components/test/McpAppsPanel.jsx` to dynamically generate and inject the CSP meta tag into the iframe.

1. **Extract CSP Metadata:**
   Extract the `csp` configuration from `widget.context?.resourceMeta?.ui?.csp`.

2. **Generate CSP String:**
   Implement the CSP generation logic to allow declared domains:
   - Map `csp.resourceDomains` to `script-src`, `style-src`, `img-src`, etc.
   - Map `csp.connectDomains` to `connect-src`.
   - Add `'unsafe-inline'` to `script-src` and `style-src` so that the local `openaiCompatScript` and `contextScript` can run.
   - If no CSP is provided by the widget, fallback to a strict default that blocks all external connections (`default-src 'none'`, etc.).

3. **Inject into `srcDoc`:**
   Construct a `<meta http-equiv="Content-Security-Policy" content="...">` tag and prepend it to the `headContent` variable so it is injected into the `<head>` of the `srcDoc` when the iframe renders.

### Example Logic for `McpAppsPanel.jsx`
```javascript
// Strict CSP enforcing the Security Contract
const cspObj = widget.context?.resourceMeta?.ui?.csp;
let cspString = '';

if (cspObj) {
  const connectDomains = (cspObj.connectDomains || []).filter(Boolean);
  const resourceDomains = (cspObj.resourceDomains || []).filter(Boolean);
  const frameDomains = (cspObj.frameDomains || []).filter(Boolean);
  const baseUriDomains = (cspObj.baseUriDomains || []).filter(Boolean);
  
  const connectSrc = connectDomains.length > 0 ? connectDomains.join(" ") : "'none'";
  const resourceSrc = resourceDomains.length > 0 ? ["data:", "blob:", ...resourceDomains].join(" ") : "data: blob:";
  const frameSrc = frameDomains.length > 0 ? frameDomains.join(" ") : "'none'";
  const baseUri = baseUriDomains.length > 0 ? baseUriDomains.join(" ") : "'none'";
  
  cspString = [
    "default-src 'none'",
    "script-src 'unsafe-inline' " + resourceSrc,
    "style-src 'unsafe-inline' " + resourceSrc,
    "img-src " + resourceSrc,
    "font-src " + resourceSrc,
    "media-src " + resourceSrc,
    "connect-src " + connectSrc,
    "frame-src " + frameSrc,
    "object-src 'none'",
    "base-uri " + baseUri,
  ].join("; ");
} else {
  // Default strict CSP if none provided
  cspString = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data: blob:",
    "media-src data: blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
  ].join("; ");
}

const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="${cspString}">`;
const headContent = cspMetaTag + contextScript + openaiCompatScript;
```

This ensures Forge correctly implements the security contract expected by the MCP App, honoring the CSP registration and allowing `chart.js` to execute properly from the declared CDN.