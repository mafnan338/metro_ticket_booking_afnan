import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import * as ticketSvc from '../services/ticketService.js';
import * as stationSvc from '../services/stationService.js';

const chatSessions = new Map();

const tools = [
  {
    name: 'get_stations',
    description: 'Get all metro stations',
    parameters: {},
    func: async () => {
      const stations = await stationSvc.getAllStations();
      return JSON.stringify(stations.map(s => ({
        stationId: s.stationId, name: s.name, line: s.line, price: s.price
      })));
    }
  },
  {
    name: 'search_station',
    description: 'Search metro stations by name',
    parameters: { query: 'string' },
    func: async ({ query }) => {
      const results = await stationSvc.searchStation(query);
      return JSON.stringify(results.map(s => ({
        stationId: s.stationId, name: s.name, line: s.line, price: s.price
      })));
    }
  },
  {
    name: 'calculate_fare',
    description: 'Calculate fare between two stations',
    parameters: { sourceStationId: 'string', destinationStationId: 'string' },
    func: async ({ sourceStationId, destinationStationId }) => {
      const source = await stationSvc.getStationById(sourceStationId);
      const dest = await stationSvc.getStationById(destinationStationId);
      if (!source) return `Error: Source station ${sourceStationId} not found`;
      if (!dest) return `Error: Destination station ${destinationStationId} not found`;
      if (sourceStationId === destinationStationId) return 'Error: Source and destination cannot be the same';
      const fare = ticketSvc.calculateFare(source, dest);
      return JSON.stringify({ source: source.name, destination: dest.name, fare });
    }
  },
  {
    name: 'book_ticket',
    description: 'Book a metro ticket (use only after explicit user confirmation)',
    parameters: { sourceStationId: 'string', destinationStationId: 'string' },
    func: async ({ sourceStationId, destinationStationId }) => {
      const ticket = await ticketSvc.createTicket(sourceStationId, destinationStationId);
      return JSON.stringify({
        ticketId: ticket.ticketId,
        source: ticket.sourceStation,
        destination: ticket.destinationStation,
        fare: ticket.fare,
        createdAt: ticket.createdAt,
        expiresAt: ticket.expiresAt,
        status: ticket.status
      });
    }
  },
  {
    name: 'get_ticket_status',
    description: 'Get ticket details by ticket ID',
    parameters: { ticketId: 'string' },
    func: async ({ ticketId }) => {
      const ticket = await ticketSvc.getTicket(ticketId);
      if (!ticket) return `Error: Ticket ${ticketId} not found`;
      return JSON.stringify(ticket);
    }
  },
  {
    name: 'validate_ticket_entry',
    description: 'Validate ticket for entry scan',
    parameters: { ticketId: 'string' },
    func: async ({ ticketId }) => {
      try {
        const ticket = await ticketSvc.validateEntry(ticketId);
        return JSON.stringify({ success: true, message: 'Entry validated', ticket });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }
  },
  {
    name: 'validate_ticket_exit',
    description: 'Validate ticket for exit scan',
    parameters: { ticketId: 'string' },
    func: async ({ ticketId }) => {
      try {
        const ticket = await ticketSvc.validateExit(ticketId);
        return JSON.stringify({ success: true, message: 'Exit validated', ticket });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }
  }
];

const toolDefs = tools.map(t => ({
  type: 'tool',
  name: t.name,
  description: t.description,
  input_schema: { type: 'object', properties: t.parameters, required: [] }
}));

export async function processChat(message, sessionId = 'default') {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      reply: 'AI chatbot is not configured. Please add ANTHROPIC_API_KEY to backend/config.env.',
      error: 'Anthropic API key not set'
    };
  }

  const model = new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    temperature: 0,
    anthropicApiKey: apiKey,
    model_kwargs: { tools: toolDefs }
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a helpful Metro Assistant for the Bengaluru Metro Ticket Booking System.
You have access to tools that can fetch real station data, calculate fares, book tickets, and validate tickets.
IMPORTANT RULES:
- NEVER invent station IDs, names, fares, or ticket IDs. Always use tools.
- For booking: Always show source, destination, and fare first, then ASK for explicit user confirmation before booking.
- NEVER book without explicit confirmation (yes/ok/confirm).
- Explain errors clearly (expired, already used, entry before exit, etc).
- Keep responses concise and helpful.`],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}']
  ]);

  try {
    let history = chatSessions.get(sessionId) || [];

    const formatted = await prompt.formatMessages({
      input: message,
      chat_history: history
    });

    // Convert stored history to proper message objects
    const historyMsgs = history.map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    const response = await model.invoke([...historyMsgs, ...formatted.slice(formatted.length - 1)]);

    // Handle tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = [];
      let toolOutputs = {};

      for (const call of response.tool_calls) {
        const toolName = call.name;
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          try {
            const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
            const result = await tool.func(args);
            toolOutputs[call.id || toolName] = result;
            toolResults.push(new ToolMessage(result, call.id || toolName, call.name));
          } catch (err) {
            const errMsg = `Error: ${err.message}`;
            toolOutputs[call.id || toolName] = errMsg;
            toolResults.push(new ToolMessage(errMsg, call.id || toolName, call.name));
          }
        }
      }

      // Ask model to respond based on tool results
      const followUpMessages = [
        ...historyMsgs,
        ...formatted.slice(0, formatted.length - 1),
        new AIMessage({
          content: '',
          tool_calls: response.tool_calls
        }),
        ...toolResults
      ];

      const followUp = await model.invoke(followUpMessages);
      const reply = typeof followUp.content === 'string' ? followUp.content : JSON.stringify(followUp.content);

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: reply });
      chatSessions.set(sessionId, history.slice(-20)); // Keep last 20 messages

      return { reply, error: null };
    }

    const reply = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: reply });
    chatSessions.set(sessionId, history.slice(-20));

    return { reply, error: null };

  } catch (err) {
    console.error('Chat error:', err.message);
    return {
      reply: 'Sorry, I\'m having trouble connecting to the AI service right now. Please try again later.',
      error: err.message
    };
  }
}
