import app from './app';
import http from 'http';
import { logger } from './shared/logger';
import { config } from './config';
import { eventBus } from './config/eventBus';
import { eventConsumer } from './modules/events/event.consumer';
import { initSocket } from './modules/chat/chat.socket';

const port = config.server.port;

async function start() {
  try {
    await eventBus.connectRabbit();
    await eventConsumer.start();
  } catch (error) {
    logger.error('Failed to initialize event bus', { error });
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(port, () => {
    logger.info(`RentShield backend running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  logger.error('Server startup failed', { error });
  process.exit(1);
});
