import pino from 'pino';

const logger = pino({ name: 'calendar' });

logger.info('calendar service starting');

// HTTP server and database logic will be added in Phase 2
