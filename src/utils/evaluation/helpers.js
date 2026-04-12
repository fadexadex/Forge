function stableSortObject(value) {
  if (Array.isArray(value)) {
    return value.map(stableSortObject);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableSortObject(value[key]);
      return acc;
    }, {});
}

export function stableStringify(value) {
  try {
    return JSON.stringify(stableSortObject(value));
  } catch {
    return '';
  }
}

export function hashString(input = '') {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

export function getNormalizedServerUrl(url = '') {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return url.trim();
  }
}

export function buildEvaluationScopeKey({
  testMode = 'external',
  serverUrl = '',
  selectedBuilderServerId = null,
}) {
  if (testMode === 'builder') {
    return selectedBuilderServerId ? `builder::${selectedBuilderServerId}` : 'builder::unknown';
  }

  return `external::${getNormalizedServerUrl(serverUrl)}`;
}

export function buildToolSnapshotHash({
  serverInfo = null,
  tools = [],
  resources = [],
  prompts = [],
}) {
  const snapshot = {
    serverInfo: serverInfo
      ? {
          name: serverInfo.name,
          version: serverInfo.version,
          protocolVersion: serverInfo.protocolVersion,
        }
      : null,
    tools: (tools || []).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema || {},
      widgetResourceUri: tool?._meta?.ui?.resourceUri || null,
    })),
    resources: (resources || []).map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
    prompts: (prompts || []).map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments || [],
    })),
  };

  return hashString(stableStringify(snapshot));
}

export function formatDateTime(value) {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export function formatDuration(durationMs) {
  if (durationMs == null || Number.isNaN(durationMs)) {
    return '—';
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 1 : 2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function getToolWidgetResourceUri(tool) {
  return tool?._meta?.ui?.resourceUri || null;
}

export function compareArgs(expectedArgs = {}, actualArgs = {}, mode = 'exact') {
  const normalizedExpected = expectedArgs || {};
  const normalizedActual = actualArgs || {};

  if (mode === 'keys-only') {
    const keys = Object.keys(normalizedExpected);
    if (keys.length === 0) return 1;

    const matchedKeyCount = keys.filter((key) => key in normalizedActual).length;
    return matchedKeyCount / keys.length;
  }

  const expectedKeys = Object.keys(normalizedExpected);
  if (expectedKeys.length === 0 && Object.keys(normalizedActual).length === 0) {
    return 1;
  }

  if (mode === 'subset') {
    if (expectedKeys.length === 0) return 1;

    const matchedKeyCount = expectedKeys.filter((key) => {
      if (!(key in normalizedActual)) return false;
      return stableStringify(normalizedExpected[key]) === stableStringify(normalizedActual[key]);
    }).length;

    return matchedKeyCount / expectedKeys.length;
  }

  return stableStringify(normalizedExpected) === stableStringify(normalizedActual) ? 1 : 0;
}

export function clamp(value, min = 0, max = 1) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function titleFromToolName(name = '') {
  return name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
