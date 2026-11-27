const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running on port 8000.', 0, 'NETWORK');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response; handled below.
  }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (HTTP ${res.status})`, res.status, data?.code);
  if (!data) throw new ApiError('Unexpected response from server', res.status);
  return data;
}

export const api = {
  health: () => request('/health'),
  getStations: () => request('/stations'),
  getStation: (id) => request(`/stations/${encodeURIComponent(id)}`),
  searchStations: (q) => request(`/stations/search?q=${encodeURIComponent(q)}`),
  calculateFare: (body) => request('/tickets/calculate-fare', { method: 'POST', body }),
  bookTicket: (body) => request('/tickets', { method: 'POST', body }),
  getTicket: (id) => request(`/tickets/${encodeURIComponent(id)}`),
  entry: (id) => request(`/tickets/${encodeURIComponent(id)}/entry`, { method: 'POST' }),
  exit: (id) => request(`/tickets/${encodeURIComponent(id)}/exit`, { method: 'POST' }),
  chat: (message, sessionId) => request('/chat', { method: 'POST', body: { message, sessionId } }),
  resetChat: (sessionId) => request('/chat/reset', { method: 'POST', body: { sessionId } })
};
