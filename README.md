# Bengaluru Metro Ticket Booking System

A complete, professional metro ticket booking system built with React, Node.js/Express, MongoDB Atlas, and an AI chatbot powered by LangChain + Anthropic Claude.

## Features

- **20 Bengaluru Metro Stations** across 5 lines (Purple, Blue, Green, Red, Orange)
- **Fare Calculation** — based on price difference between stations
- **Digital Ticket Booking** — unique ticket ID, 18-hour expiry
- **Ticket Lifecycle** — entry scan → exit scan → completed (2 scans max)
- **Ticket Validation** — entry/exit with expiry and reuse checks
- **AI Chatbot** — LangChain + Anthropic Claude with real backend tools
- **Responsive UI** — modern, metro-themed design

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Lucide Icons |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB Atlas |
| AI | LangChain.js, Anthropic Claude |

## Architecture

```
frontend/          React + Vite (port 5173)
  └── API calls → backend/

backend/           Express API (port 8000)
  ├── /api/stations     — GET all stations
  ├── /api/tickets      — POST book, GET lookup, POST entry/exit
  ├── /api/chat         — POST AI chat
  └── MongoDB Atlas
```

## Setup

### 1. MongoDB Atlas

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get your connection string
3. Create `backend/config.env`:

```env
NODE_ENV=development
PORT=8000
DATABASE=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/metro_tickets
DATABASE_PASSWORD=<your_password>
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307
CLIENT_URL=http://localhost:5173
```

### 2. Install Backend

```bash
cd backend
npm install
```

### 3. Install Frontend

```bash
cd frontend
npm install
```

## Running

### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:8000`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stations` | Get all 20 stations |
| GET | `/api/stations/search?q=query` | Search stations |
| POST | `/api/tickets/calculate-fare` | Calculate fare |
| POST | `/api/tickets` | Book a ticket |
| GET | `/api/tickets/:ticketId` | Get ticket details |
| POST | `/api/tickets/:ticketId/entry` | Validate entry |
| POST | `/api/tickets/:ticketId/exit` | Validate exit |
| POST | `/api/chat` | AI chatbot (body: `{ message, sessionId }`) |
| GET | `/api/health` | Health check |

## Fare Formula

```
fare = |destination.price - source.price|
```

## Ticket Lifecycle

1. **Booked** → ticket created, 18-hour validity
2. **Entry** → first scan, marks entry
3. **Exit** → second scan, marks completed
4. **Expired** → if not used within 18 hours

## AI Chatbot Tools

- `get_stations` — list all stations
- `search_station` — search by name
- `calculate_fare` — fare between two stations
- `book_ticket` — book after explicit confirmation
- `get_ticket_status` — lookup ticket
- `validate_ticket_entry` — entry scan
- `validate_ticket_exit` — exit scan

## Troubleshooting

- **MongoDB connection fails**: Check `config.env` DATABASE URI
- **Chatbot not working**: Verify `ANTHROPIC_API_KEY` is set
- **CORS errors**: Ensure `CLIENT_URL` matches frontend URL
- **Stations not loading**: Check backend is running and DB is connected
