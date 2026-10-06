export const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://93dft45d-8000.inc1.devtunnels.ms'
export const BASE_URL = `${BACKEND_URL.replace(/\/+$/, '')}/api`

export const getWsUrl = () => {
  try {
    if (BACKEND_URL.startsWith('http://') || BACKEND_URL.startsWith('https://')) {
      const url = new URL(BACKEND_URL)
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${url.host}/ws/telemetry`
    }
  } catch (e) {
    console.error('Invalid BACKEND_URL:', e)
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/telemetry`
}

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
