const BASE = 'http://localhost:8000/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  getStations: () => request('/stations'),
  getStation: (id) => request(`/stations/${id}`),
  searchStations: (q) => request(`/stations/search?q=${encodeURIComponent(q)}`),
  calculateFare: (body) => request('/tickets/calculate-fare', { method: 'POST', body }),
  bookTicket: (body) => request('/tickets', { method: 'POST', body }),
  getTicket: (id) => request(`/tickets/${id}`),
  entry: (id) => request(`/tickets/${id}/entry`, { method: 'POST' }),
  exit: (id) => request(`/tickets/${id}/exit`, { method: 'POST' }),
  chat: (message, sessionId) => request('/chat', {
    method: 'POST',
    body: { message, sessionId }
  })
};
