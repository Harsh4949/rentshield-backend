# RentShield Backend

Backend scaffold for RentShield using Express, PostgreSQL, Redis, Elasticsearch, and RabbitMQ/Kafka.

## Architecture

- `src/app.ts` - Express application setup and middleware.
- `src/server.ts` - entrypoint for starting HTTP server.
- `src/config` - environment, database, cache, search, and event bus configuration.
- `src/modules` - domain modules with controllers, services, repositories, and message handling.
- `prisma/schema.prisma` - relational data model for PostgreSQL.

## Getting Started

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Start in development mode:
   ```bash
   npm run dev
   ```

## Modules

- `property` - property management, persistence, search indexing, caching, and events.
- `search` - Elasticsearch-backed property search.
- `events` - RabbitMQ/Kafka publisher and consumer patterns.

## Notes

- This scaffold is designed to support a modular backend structure with clear separation of concerns.
- Add new modules under `src/modules` and wire their routers in `src/app.ts`.
