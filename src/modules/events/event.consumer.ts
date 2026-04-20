import amqp from 'amqplib';
import { config } from '../../config';
import { logger } from '../../shared/logger';

export const eventConsumer = {
  async start() {
    try {
      const connection = await amqp.connect(config.rabbitmq.url);
      const channel = await connection.createChannel();

      const exchange = 'rentshield.events';
      const queue = 'rentshield.property.consumer';
      const routingKey = 'property.*';

      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      await channel.consume(queue, (msg: any) => {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        logger.info('Received event', { event: data.event, payload: data.payload });
        channel.ack(msg);
      });

      logger.info('Event consumer started on RabbitMQ');
    } catch (error) {
      logger.warn(`[EventConsumer] Connection warning: ${(error as Error).message}`);
    }
  },
};
