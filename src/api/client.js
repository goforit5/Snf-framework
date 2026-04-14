// Frontend API client — connects to Fastify backend when VITE_API_URL is set,
// returns null for all calls when not set (pages fall back to mock data).

const API_URL = import.meta.env.VITE_API_URL || null;
const isLiveMode = !!API_URL;

// Placeholder for future auth integration
let authToken = null;
export function setAuthToken(token) { authToken = token; }

async function apiFetch(path, options = {}) {
  if (!API_URL) return null;

  const url = new URL(path, API_URL);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  }

  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// --- Decision endpoints ---

export async function fetchDecisions(filters = {}) {
  return apiFetch('/api/decisions', {
    params: {
      domain: filters.domain,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
}

export async function fetchDecisionStats() {
  return apiFetch('/api/decisions/stats');
}

export async function fetchDecision(id) {
  return apiFetch(`/api/decisions/${id}`);
}

export async function approveDecision(id, data = {}) {
  return apiFetch(`/api/decisions/${id}/approve`, { method: 'POST', body: data });
}

export async function overrideDecision(id, reason) {
  return apiFetch(`/api/decisions/${id}/override`, { method: 'POST', body: { reason } });
}

export async function escalateDecision(id) {
  return apiFetch(`/api/decisions/${id}/escalate`, { method: 'POST' });
}

export async function deferDecision(id, deferUntil) {
  return apiFetch(`/api/decisions/${id}/defer`, { method: 'POST', body: { deferUntil } });
}

// --- Agent endpoints ---

export async function fetchAgents() {
  return apiFetch('/api/agents');
}

export async function fetchAgent(id) {
  return apiFetch(`/api/agents/${id}`);
}

export async function fetchAgentRuns(id, filters = {}) {
  return apiFetch(`/api/agents/${id}/runs`, {
    params: { limit: filters.limit, offset: filters.offset },
  });
}

// --- Audit endpoints ---

export async function fetchAuditTrail(filters = {}) {
  return apiFetch('/api/audit', {
    params: {
      domain: filters.domain,
      action: filters.action,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
}

export async function verifyAuditChain() {
  return apiFetch('/api/audit/verify');
}

// --- Demo trigger ---

export async function triggerAgent(agentId, facilityId) {
  return apiFetch('/api/demo/trigger', {
    method: 'POST',
    body: { agentId, facilityId },
  });
}

export async function getSessionStatus(sessionId) {
  return apiFetch(`/api/demo/sessions/${sessionId}`);
}

// --- WebSocket ---

export function connectWebSocket(onMessage) {
  if (!API_URL) return null;

  const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws';
  let ws = null;
  let reconnectDelay = 1000;
  let closed = false;

  function connect() {
    if (closed) return;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => { reconnectDelay = 1000; };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // Ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      if (closed) return;
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    ws.onerror = () => { ws.close(); };
  }

  connect();

  return {
    close() {
      closed = true;
      if (ws) ws.close();
    },
    send(data) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    },
  };
}

export { isLiveMode };
