export const LINE_COLORS = {
  'Purple Line': '#7c3aed',
  'Blue Line': '#2563eb',
  'Green Line': '#16a34a',
  'Red Line': '#dc2626',
  'Orange Line': '#ea580c'
};

export const lineColor = (line) => LINE_COLORS[line] || '#64748b';

export const STATUS_META = {
  active: { label: 'Active', cls: 'badge-active' },
  entry_done: { label: 'In Journey', cls: 'badge-entry' },
  completed: { label: 'Completed', cls: 'badge-completed' },
  expired: { label: 'Expired', cls: 'badge-expired' },
  invalid: { label: 'Invalid', cls: 'badge-invalid' }
};

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const RECENT_KEY = 'metro_recent_tickets';

// Stores only ticket IDs returned by the backend; details are always re-fetched from the API.
export function rememberTicket(ticket) {
  try {
    const list = getRecentTickets().filter(t => t.ticketId !== ticket.ticketId);
    list.unshift({ ticketId: ticket.ticketId, route: `${ticket.sourceStation} → ${ticket.destinationStation}` });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    // localStorage unavailable (private mode); ignore.
  }
}

export function getRecentTickets() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}
