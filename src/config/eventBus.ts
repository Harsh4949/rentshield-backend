import amqp, { Channel, ChannelModel } from 'amqplib';
import { Kafka, Producer } from 'kafkajs';
import { config } from './index';
import { logger } from '../shared/logger';

export class EventBus {
  private rabbitConnection?: ChannelModel;
  private rabbitChannel?: Channel;
  private kafkaProducer?: Producer;

  async connectRabbit(): Promise<void> {
    try {
      this.rabbitConnection = await amqp.connect(config.rabbitmq.url);
      this.rabbitChannel = await this.rabbitConnection.createChannel();
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.warn(`[RabbitMQ] Connection warning: ${(error as Error).message}`);
    }
  }

  async publishRabbit(exchange: string, routingKey: string, message: unknown): Promise<void> {
    if (!this.rabbitChannel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    await this.rabbitChannel.assertExchange(exchange, 'topic', { durable: true });
    this.rabbitChannel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }

  async connectKafka(): Promise<void> {
    try {
      const kafka = new Kafka({
        clientId: config.kafka.clientId,
        brokers: config.kafka.brokers,
      });

      this.kafkaProducer = kafka.producer();
      await this.kafkaProducer.connect();
      logger.info('Connected to Kafka');
    } catch (error) {
      logger.warn(`[Kafka] Connection warning: ${(error as Error).message}`);
    }
  }

  async publishKafka(topic: string, message: unknown): Promise<void> {
    if (!this.kafkaProducer) {
      throw new Error('Kafka producer is not initialized');
    }

    await this.kafkaProducer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}

export const eventBus = new EventBus();
