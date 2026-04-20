# RentShield: Platform Documentation Index

Welcome to the official technical documentation for the RentShield Platform. This ecosystem provides a detailed map of the business logic, state machines, and integration patterns that power our backend.

## 🏗️ System Architecture

RentShield is built on a **Modular Monolith** architecture:
- **Runtime**: Node.js / Express (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Security**: JWT-based stateless auth with 2FA
- **Real-time**: Socket.io for Chat & Notifications

---

## 📂 Domain Documentation

Each module below contains detailed documentation on its specific logic, data interactions, and frontend integration strategies.

| Domain | Focus Areas | Documentation |
| :--- | :--- | :--- |
| **Identity & Security** | 2FA, RBAC, User Settings | [IDENTITY.md](./modules/IDENTITY.md) |
| **Finance & Ledger** | Payments, Stamping, Ledger | [FINANCE.md](./modules/FINANCE.md) |
| **Legal Agreements** | Templates, E-Signatures | [LEGAL_AGREEMENTS.md](./modules/LEGAL_AGREEMENTS.md) |
| **Society & Community** | Amenities, Events, Notices | [SOCIETY_SOCIAL.md](./modules/SOCIETY_SOCIAL.md) |
| **Operations Lifecycle** | Move-In, Exit, Maintenance | [LIFECYCLE_OPS.md](./modules/LIFECYCLE_OPS.md) |

---

## 🛠️ Developer Resources

- **Live API Docs**: Visit `/api/docs` on your local instance to interact with the Swagger UI.
- **Master Postman Collection**: Located in the repo root as `RentShield_Master_Collection.postman_collection.json`.
- **Database Schema**: Reference the source of truth at `prisma/schema.prisma`.

## 🤝 Project Links
- [Frontend Integration Guide](../docs/FRONTEND_GUIDE.md)
