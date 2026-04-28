import { Pool, PoolConfig } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'calendar-db' });

/** Calendar event stored in PostgreSQL */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Input for creating a calendar event */
export interface CreateEventInput {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_by: string;
}

/** Input for updating a calendar event */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

/** Filter options for listing events */
export interface ListEventsFilter {
  created_by?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

const poolConfig: PoolConfig = {
  host: process.env['PGHOST'] ?? 'postgres.tmpclaw.svc.cluster.local',
  port: Number(process.env['PGPORT'] ?? 5432),
  database: process.env['PGDATABASE'] ?? 'calendar',
  user: process.env['PGUSER'] ?? 'calendar',
  password: process.env['PGPASSWORD'] ?? 'calendar',
  max: Number(process.env['PG_POOL_MAX'] ?? 10),
};

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected pool error');
    });
  }
  return pool;
}

/** Run schema migration — creates the events table if not present */
export async function migrate(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        start_time  TIMESTAMPTZ NOT NULL,
        end_time    TIMESTAMPTZ NOT NULL,
        location    TEXT NOT NULL DEFAULT '',
        created_by  TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT events_time_order CHECK (end_time > start_time)
      );

      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);
    `);
    logger.info('Database migration complete');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    throw err;
  } finally {
    client.release();
  }
}

export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const { rows } = await getPool().query<CalendarEvent>(
    `INSERT INTO events (title, description, start_time, end_time, location, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.title,
      input.description ?? '',
      input.start_time,
      input.end_time,
      input.location ?? '',
      input.created_by,
    ],
  );
  return rows[0];
}

export async function getEvent(id: string): Promise<CalendarEvent | undefined> {
  const { rows } = await getPool().query<CalendarEvent>(
    'SELECT * FROM events WHERE id = $1',
    [id],
  );
  return rows[0];
}

export async function listEvents(filter: ListEventsFilter): Promise<CalendarEvent[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filter.created_by) {
    conditions.push(`created_by = $${idx++}`);
    params.push(filter.created_by);
  }
  if (filter.from) {
    conditions.push(`start_time >= $${idx++}`);
    params.push(filter.from);
  }
  if (filter.to) {
    conditions.push(`end_time <= $${idx++}`);
    params.push(filter.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;

  const { rows } = await getPool().query<CalendarEvent>(
    `SELECT * FROM events ${where} ORDER BY start_time ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return rows;
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<CalendarEvent | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (input.title !== undefined) {
    sets.push(`title = $${idx++}`);
    params.push(input.title);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${idx++}`);
    params.push(input.description);
  }
  if (input.start_time !== undefined) {
    sets.push(`start_time = $${idx++}`);
    params.push(input.start_time);
  }
  if (input.end_time !== undefined) {
    sets.push(`end_time = $${idx++}`);
    params.push(input.end_time);
  }
  if (input.location !== undefined) {
    sets.push(`location = $${idx++}`);
    params.push(input.location);
  }

  if (sets.length === 0) {
    return getEvent(id);
  }

  sets.push(`updated_at = now()`);
  params.push(id);

  const { rows } = await getPool().query<CalendarEvent>(
    `UPDATE events SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return rows[0];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    'DELETE FROM events WHERE id = $1',
    [id],
  );
  return (rowCount ?? 0) > 0;
}

export async function shutdown(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    logger.info('Database pool closed');
  }
}
