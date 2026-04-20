import { eventBus } from '../../config/eventBus';

export const eventPublisher = {
  async publishPropertyCreated(payload: unknown) {
    await eventBus.publishRabbit('rentshield.events', 'property.created', {
      event: 'PROPERTY_CREATED',
      payload,
    });
  },

  async publishKafkaEvent(topic: string, payload: unknown) {
    await eventBus.publishKafka(topic, payload);
  },
};
