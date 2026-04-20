import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: Number(process.env.PORT ?? 4000),
  },
  database: {
    name: process.env.DATABASE_NAME ?? 'rentshield',
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'root',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5433),
  },
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID ?? 'rentshield-service',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '7926c3ee30a99331c905731e1081b5817d05d6a2ae32a34b6e6f6817ada1dc4d4d946caa8e0661630056c47c6c4d3b58ccc18064b1cf6a3c47d971d54f6ce6d5',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
};
