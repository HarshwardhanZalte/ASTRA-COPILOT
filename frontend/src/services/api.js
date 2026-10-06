const BASE_URL = 'http://192.168.5.1:8000/api'

export const api = {
  async get(path) {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  async post(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
}

// Simulator API
export const simulatorApi = {
  start: () => api.post('/simulator/start'),
  pause: () => api.post('/simulator/pause'),
  reset: () => api.post('/simulator/reset'),
  getStatus: () => api.get('/simulator/status'),
  getEvents: () => api.get('/simulator/events'),
  injectFault: (fault_type, severity) => api.post('/simulator/fault', { fault_type, severity }),
  clearFault: () => api.post('/simulator/clear-fault'),
  setConditions: (conditions) => api.post('/simulator/conditions', conditions),
}

// Telemetry API
export const telemetryApi = {
  getLatest: () => api.get('/telemetry/latest'),
  getHistory: (limit = 100) => api.get(`/telemetry/history?limit=${limit}`),
}

// Anomalies API
export const anomalyApi = {
  getAll: (limit = 50) => api.get(`/anomalies?limit=${limit}`),
  getLatest: () => api.get('/anomalies/latest'),
}

// Incidents API
export const incidentApi = {
  getAll: () => api.get('/incidents'),
  getById: (id) => api.get(`/incidents/${id}`),
  getTimeline: (id) => api.get(`/incidents/${id}/timeline`),
  getEvidence: (id) => api.get(`/incidents/${id}/evidence`),
}

// Copilot API
export const copilotApi = {
  chat: (question, incident_id, conversation_history) => api.post('/copilot/chat', {
    question, incident_id, conversation_history
  }),
  getMode: () => api.get('/copilot/mode'),
}

// System API
export const systemApi = {
  getHealth: () => api.get('/health'),
  getStatus: () => api.get('/system/status'),
}
