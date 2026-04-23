import Fastify from 'fastify';
import pino from 'pino';
import {
  migrate,
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  shutdown,
  CreateEventInput,
  UpdateEventInput,
  ListEventsFilter,
} from './db.js';

const logger = pino({ name: 'calendar-api' });

const PORT = Number(process.env['PORT'] ?? 8080);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = Fastify({ logger: true });

/** Health check */
app.get('/healthz', async (_req, reply) => {
  return reply.code(200).send({ status: 'ok' });
});

/** List events with optional filters */
app.get<{
  Querystring: {
    created_by?: string;
    from?: string;
    to?: string;
    limit?: string;
    offset?: string;
  };
}>('/api/events', async (req, reply) => {
  const filter: ListEventsFilter = {
    created_by: req.query.created_by,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  };

  try {
    const events = await listEvents(filter);
    return reply.code(200).send({ events });
  } catch (err) {
    logger.error({ err }, 'Failed to list events');
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

/** Get single event by ID */
app.get<{ Params: { id: string } }>('/api/events/:id', async (req, reply) => {
  const { id } = req.params;

  if (!isValidUuid(id)) {
    return reply.code(400).send({ error: 'Invalid event ID format' });
  }

  try {
    const event = await getEvent(id);
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.code(200).send({ event });
  } catch (err) {
    logger.error({ err }, 'Failed to get event');
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

/** Create a new event */
app.post<{ Body: CreateEventInput }>('/api/events', async (req, reply) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return reply.code(400).send({ error: 'Request body is required' });
  }

  const { title, start_time, end_time, created_by } = body;

  if (!title || typeof title !== 'string') {
    return reply.code(400).send({ error: 'title is required' });
  }
  if (!start_time || typeof start_time !== 'string') {
    return reply.code(400).send({ error: 'start_time is required' });
  }
  if (!end_time || typeof end_time !== 'string') {
    return reply.code(400).send({ error: 'end_time is required' });
  }
  if (!created_by || typeof created_by !== 'string') {
    return reply.code(400).send({ error: 'created_by is required' });
  }

  if (new Date(end_time) <= new Date(start_time)) {
    return reply.code(400).send({ error: 'end_time must be after start_time' });
  }

  try {
    const event = await createEvent({
      title,
      start_time,
      end_time,
      created_by,
      description: body.description,
      location: body.location,
    });
    return reply.code(201).send({ event });
  } catch (err) {
    logger.error({ err }, 'Failed to create event');
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

/** Update an existing event */
app.put<{ Params: { id: string }; Body: UpdateEventInput }>(
  '/api/events/:id',
  async (req, reply) => {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return reply.code(400).send({ error: 'Invalid event ID format' });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Request body is required' });
    }

    if (body.start_time && body.end_time) {
      if (new Date(body.end_time) <= new Date(body.start_time)) {
        return reply.code(400).send({ error: 'end_time must be after start_time' });
      }
    }

    try {
      const event = await updateEvent(id, {
        title: body.title,
        description: body.description,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
      });

      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }
      return reply.code(200).send({ event });
    } catch (err) {
      logger.error({ err }, 'Failed to update event');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  },
);

/** Delete an event */
app.delete<{ Params: { id: string } }>('/api/events/:id', async (req, reply) => {
  const { id } = req.params;

  if (!isValidUuid(id)) {
    return reply.code(400).send({ error: 'Invalid event ID format' });
  }

  try {
    const deleted = await deleteEvent(id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.code(204).send();
  } catch (err) {
    logger.error({ err }, 'Failed to delete event');
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function start(): Promise<void> {
  logger.info({ port: PORT, host: HOST }, 'Starting calendar API');

  await migrate();

  await app.listen({ port: PORT, host: HOST });
  logger.info({ port: PORT }, 'Calendar API listening');
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  try {
    await app.close();
  } catch (err) {
    logger.error({ err }, 'Error closing Fastify');
  }
  try {
    await shutdown();
  } catch (err) {
    logger.error({ err }, 'Error closing database pool');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
